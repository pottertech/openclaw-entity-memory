import { ProvenanceRepository } from "../db/postgres/repositories/provenance-repository.js";
import { DocumentAclService } from "./document-acl-service.js";
import type { QueryExclusion } from "../types/explanations.js";

export class ProvenanceService {
  constructor(
    private readonly repository: ProvenanceRepository,
    private readonly documentAclService: DocumentAclService,
  ) {}

  async getVisibleEdgeProvenance(input: {
    tenantId: string;
    edgeXid: string;
    actor?: {
      subjectType?: string;
      subjectId?: string;
    };
  }): Promise<{
    provenance: Array<{
      edgeXid: string;
      edgeType: string;
      fromEntityXid: string;
      toEntityXid: string;
      edgeAuthorityTier: string;
      conflictKey: string | null;
      conflictStatus: string;
      supersededByEdgeXid: string | null;
      evidenceXid: string;
      sourceRef: string;
      documentXid: string | null;
      chunkXid: string | null;
      evidenceAuthorityTier: string;
      evidenceConfidence: number;
      evidenceCreatedAt: string;
    }>;
    exclusions: QueryExclusion[];
  }> {
    const rows = await this.repository.getEdgeProvenance(input.tenantId, input.edgeXid);
    const visible: typeof rows = [];
    const exclusions: QueryExclusion[] = [];

    for (const row of rows) {
      const allowed = await this.documentAclService.canReadDocument({
        tenantId: input.tenantId,
        documentXid: row.documentXid,
        actor: input.actor,
      });

      if (!allowed) {
        exclusions.push({
          kind: "document",
          id: row.documentXid ?? "unknown_document",
          reason: "document_acl_denied",
        });
        continue;
      }

      visible.push(row);
    }

    return {
      provenance: visible,
      exclusions,
    };
  }

  async getEntityNeighborhood(input: {
    tenantId: string;
    entityXid: string;
  }) {
    return this.repository.getEntityNeighborhood(input.tenantId, input.entityXid);
  }
}