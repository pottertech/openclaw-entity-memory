import { EntityService } from "./entity-service.js";
import { TraversalService } from "../query/traversal.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import type { HybridQueryRequest } from "../types/queries.js";

const CAPITALIZED_PHRASE_REGEX = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;

export class HybridQueryService {
  constructor(
    private readonly entityService: EntityService,
    private readonly traversalService: TraversalService,
    private readonly edgeRepository: EdgeRepository,
  ) {}

  async query(request: HybridQueryRequest): Promise<{
    answer: string;
    confidence: "low" | "medium" | "high";
    entities: Array<{ xid: string; entityType: string; canonicalName: string }>;
    path: Array<{ from: string; edge: string; to: string }>;
    evidence: Array<{ edgeXid: string; documentXid: string | null; chunkXid: string | null }>;
    filtersApplied: Record<string, unknown>;
  }> {
    const candidateNames = this.extractCandidateNames(
      request.question,
      request.semanticCandidates.map((item) => item.text),
    );

    const resolved: Array<{
      xid: string;
      entityType: string;
      canonicalName: string;
    }> = [];

    for (const candidate of candidateNames) {
      const match = await this.entityService.resolveEntity(request.tenantId, candidate);
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
        const path = await this.traversalService.findPathByResolvedIds(
          request.tenantId,
          resolved[i].xid,
          resolved[j].xid,
          4,
        );

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

    if (bestPath) {
      for (const hop of bestPath) {
        const edgeEvidence = await this.edgeRepository.getEvidenceForEdge(
          request.tenantId,
          hop.edgeXid,
        );

        for (const ev of edgeEvidence) {
          evidence.push({
            edgeXid: hop.edgeXid,
            documentXid: ev.documentXid,
            chunkXid: ev.chunkXid,
          });
        }
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