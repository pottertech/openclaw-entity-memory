import { EntityService } from "./entity-service.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import type { HybridQueryRequest } from "../types/queries.js";
import { DefaultSemanticBridge } from "../query/semantic-bridge.js";
import { AccessAwareTraversalService } from "./access-aware-traversal-service.js";
import { AuthorityService } from "./authority-service.js";
import { ProvenanceService } from "./provenance-service.js";

const CAPITALIZED_PHRASE_REGEX = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;

export class HybridQueryService {
  private readonly semanticBridge = new DefaultSemanticBridge();

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
    entities: Array<{ xid: string; entityType: string; canonicalName: string }>;
    path: Array<{ from: string; edge: string; to: string }>;
    evidence: Array<{ edgeXid: string; documentXid: string | null; chunkXid: string | null }>;
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

    let bestPath:
      | Array<{ from: string; edge: string; to: string; edgeXid: string }>
      | null = null;

    for (let i = 0; i < resolved.length; i += 1) {
      for (let j = i + 1; j < resolved.length; j += 1) {
        const path = await this.traversalService.findPathByResolvedIds({
          tenantId: request.tenantId,
          fromXid: resolved[i].xid,
          toXid: resolved[j].xid,
          maxDepth: 4,
          asOf: request.asOf,
          minAuthorityRank,
          actor: request.actor,
        });

        if (path && (!bestPath || path.length > bestPath.length)) {
          bestPath = path;
        }
      }
    }

    const evidence: Array<{
      edgeXid: string;
      documentXid: string | null;
      chunkXid: string | null;
    }> = [];

    const explanationExclusions = [...this.traversalService.getExplanations()];

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
      },
      explanation: {
        exclusions: explanationExclusions,
      },
    };
  }

  private extractCandidateNames(question: string, candidateTexts: string[]): string[] {
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