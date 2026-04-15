import { EntityService } from "./entity-service.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import type { HybridQueryRequest } from "../types/queries.js";
import { DefaultSemanticBridge } from "../query/semantic-bridge.js";
import { AccessAwareTraversalService } from "./access-aware-traversal-service.js";
import { AuthorityService } from "./authority-service.js";
import { ProvenanceService } from "./provenance-service.js";
import { PathScorer, type ScoredPath } from "../query/path-scorer.js";

const CAPITALIZED_PHRASE_REGEX =
  /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;

export class HybridQueryService {
  private readonly semanticBridge = new DefaultSemanticBridge();
  private readonly pathScorer = new PathScorer();

  constructor(
    private readonly entityService: EntityService,
    private readonly traversalService: AccessAwareTraversalService,
    private readonly edgeRepository: EdgeRepository,
    private readonly authorityService: AuthorityService,
    private readonly provenanceService: ProvenanceService,
  ) {}

  async query(
    request: HybridQueryRequest & {
      actor?: { subjectType?: string; subjectId?: string };
      minAuthorityTier?: string;
    },
  ): Promise<{
    answer: string;
    confidence: "low" | "medium" | "high";
    entities: Array<{
      xid: string;
      entityType: string;
      canonicalName: string;
    }>;
    path: Array<{ from: string; edge: string; to: string }>;
    evidence: Array<{
      edgeXid: string;
      documentXid: string | null;
      chunkXid: string | null;
    }>;
    filtersApplied: Record<string, unknown>;
    explanation: {
      exclusions: Array<{
        kind: "edge" | "entity" | "path" | "document" | "evidence";
        id: string;
        reason:
          | "entity_acl_denied"
          | "edge_acl_deny"
          | "document_acl_denied"
          | "authority_below_threshold"
          | "temporal_window_excluded"
          | "conflict_loser"
          | "missing_entity"
          | "missing_evidence"
          | "unknown";
        detail?: string;
      }>;
    };
  }> {
    const minAuthorityRank = await this.authorityService.getMinimumRank(
      request.minAuthorityTier,
    );

    const normalizedCandidates = this.semanticBridge.normalizeCandidates(
      request.semanticCandidates.map((item) => ({
        documentXid: item.documentXid,
        chunkXid: item.chunkXid,
        text: item.text,
      })),
    );

    const candidateNames = this.extractCandidateNames(
      request.question,
      normalizedCandidates.map((item: { text: string }) => item.text),
    );

    const resolved: Array<{
      xid: string;
      entityType: string;
      canonicalName: string;
    }> = [];

    for (const candidate of candidateNames) {
      const match = await this.entityService.resolveEntity(
        request.tenantId,
        candidate,
        request.actor,
      );

      if (!match) {
        continue;
      }

      if (!resolved.some((item) => item.xid === match.match.xid)) {
        resolved.push({
          xid: match.match.xid,
          entityType: match.match.entityType,
          canonicalName: match.match.canonicalName,
        });
      }
    }

    // Multi-path search with scoring
    const candidatePaths: Array<{
      rawPath: Array<{
        from: string;
        edge: string;
        to: string;
        edgeXid: string;
        score?: number;
      }>;
      scored: ScoredPath;
    }> = [];

    for (let i = 0; i < resolved.length; i += 1) {
      for (let j = i + 1; j < resolved.length; j += 1) {
        const paths = await this.traversalService.findTopPathsByResolvedIds({
          tenantId: request.tenantId,
          fromXid: resolved[i].xid,
          toXid: resolved[j].xid,
          maxDepth: 4,
          maxResults: 5,
          asOf: request.asOf,
          minAuthorityRank,
          actor: request.actor,
        });

        for (const path of paths) {
          const scoredHops = [];

          for (const hop of path) {
            const visible =
              await this.provenanceService.getVisibleEdgeProvenance({
                tenantId: request.tenantId,
                edgeXid: hop.edgeXid,
                actor: request.actor,
              });

            const authorityRank =
              visible.provenance[0]?.edgeAuthorityTier === "critical"
                ? 40
                : visible.provenance[0]?.edgeAuthorityTier === "high"
                  ? 30
                  : visible.provenance[0]?.edgeAuthorityTier === "standard"
                    ? 20
                    : 10;

            scoredHops.push({
              edgeXid: hop.edgeXid,
              edgeType: hop.edge,
              from: hop.from,
              to: hop.to,
              edgeAuthorityRank: authorityRank,
              evidenceVisibleCount: visible.provenance.length,
              evidenceHiddenCount: visible.exclusions.length,
              confidence: hop.score ?? 1,
            });
          }

          candidatePaths.push({
            rawPath: path,
            scored: this.pathScorer.scorePath(scoredHops),
          });
        }
      }
    }

    const bestScored = this.pathScorer.chooseBest(
      candidatePaths.map((item) => item.scored),
    );

    const bestPath = bestScored
      ? candidatePaths.find(
          (item) => item.scored.totalScore === bestScored.totalScore,
        )?.rawPath ?? null
      : null;

    const evidence: Array<{
      edgeXid: string;
      documentXid: string | null;
      chunkXid: string | null;
    }> = [];

    const explanationExclusions = [
      ...this.traversalService.getExplanations(),
    ];

    if (bestPath) {
      for (const hop of bestPath) {
        const visible = await this.provenanceService.getVisibleEdgeProvenance({
          tenantId: request.tenantId,
          edgeXid: hop.edgeXid,
          actor: request.actor,
        });

        for (const ev of visible.provenance) {
          evidence.push({
            edgeXid: hop.edgeXid,
            documentXid: ev.documentXid,
            chunkXid: ev.chunkXid,
          });
        }

        explanationExclusions.push(...visible.exclusions);
      }
    }

    return {
      answer: bestPath ? "Yes" : "No clear relationship path found",
      confidence: bestPath ? "high" : "low",
      entities: resolved,
      path: (bestPath ?? []).map((hop) => ({
        from: hop.from,
        edge: hop.edge,
        to: hop.to,
      })),
      evidence,
      filtersApplied: {
        tenantId: request.tenantId,
        acl: true,
        asOf: request.asOf ?? null,
        minAuthorityTier: request.minAuthorityTier ?? null,
        pathScore: bestScored?.totalScore ?? null,
        visibleEvidenceCount: bestScored?.visibleEvidenceCount ?? 0,
        hiddenEvidenceCount: bestScored?.hiddenEvidenceCount ?? 0,
      },
      explanation: {
        exclusions: explanationExclusions,
      },
    };
  }

  private extractCandidateNames(
    question: string,
    candidateTexts: string[],
  ): string[] {
    const results = new Set<string>();

    for (const text of [question, ...candidateTexts]) {
      const matches = text.match(CAPITALIZED_PHRASE_REGEX) ?? [];
      for (const match of matches) {
        const trimmed = match.trim();
        if (trimmed.length >= 2) {
          results.add(trimmed);
        }
      }
    }

    return [...results];
  }
}