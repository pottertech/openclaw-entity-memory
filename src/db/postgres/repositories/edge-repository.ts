import type pg from "pg";
import type { EdgeEvidence } from "../../../types/edges.js";

type EdgeRow = {
  xid: string;
  tenant_id: string;
  edge_type: string;
  from_entity_xid: string;
  to_entity_xid: string;
  confidence: string | number;
  valid_from: Date | null;
  valid_to: Date | null;
  metadata_json: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

type EvidenceRow = {
  xid: string;
  tenant_id: string;
  edge_xid: string;
  source_ref: string;
  document_xid: string | null;
  chunk_xid: string | null;
  evidence_span: Record<string, unknown>;
  confidence: string | number;
  created_at: Date;
};

export class EdgeRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getAllEdgesForTenant(tenantId: string): Promise<EdgeRow[]> {
    const result = await this.pool.query<EdgeRow>(
      `
      SELECT
        xid,
        tenant_id,
        edge_type,
        from_entity_xid,
        to_entity_xid,
        confidence,
        valid_from,
        valid_to,
        metadata_json,
        created_at,
        updated_at
      FROM edges
      WHERE tenant_id = $1
      ORDER BY created_at ASC
      `,
      [tenantId],
    );

    return result.rows;
  }

  async getEvidenceForEdge(
    tenantId: string,
    edgeXid: string,
  ): Promise<EdgeEvidence[]> {
    const result = await this.pool.query<EvidenceRow>(
      `
      SELECT
        xid,
        tenant_id,
        edge_xid,
        source_ref,
        document_xid,
        chunk_xid,
        evidence_span,
        confidence,
        created_at
      FROM edge_evidence
      WHERE tenant_id = $1
        AND edge_xid = $2
      ORDER BY created_at ASC
      `,
      [tenantId, edgeXid],
    );

    return result.rows.map((row) => ({
      xid: row.xid,
      tenantId: row.tenant_id,
      edgeXid: row.edge_xid,
      sourceRef: row.source_ref,
      documentXid: row.document_xid,
      chunkXid: row.chunk_xid,
      evidenceSpan: row.evidence_span ?? {},
      confidence: Number(row.confidence),
      createdAt: row.created_at.toISOString(),
    }));
  }
}