import type pg from "pg";

type EdgeProvenanceRow = {
  edge_xid: string;
  tenant_id: string;
  edge_type: string;
  from_entity_xid: string;
  to_entity_xid: string;
  edge_authority_tier: string;
  conflict_key: string | null;
  conflict_status: string;
  superseded_by_edge_xid: string | null;
  evidence_xid: string;
  source_ref: string;
  document_xid: string | null;
  chunk_xid: string | null;
  evidence_authority_tier: string;
  evidence_confidence: string | number;
  evidence_created_at: Date;
};

type EntityNeighborRow = {
  tenant_id: string;
  edge_xid: string;
  edge_type: string;
  from_entity_xid: string;
  from_entity_name: string;
  to_entity_xid: string;
  to_entity_name: string;
  authority_tier: string;
  conflict_status: string;
  valid_from: Date | null;
  valid_to: Date | null;
};

export class ProvenanceRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getEdgeProvenance(
    tenantId: string,
    edgeXid: string,
  ): Promise<
    Array<{
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
    }>
  > {
    const result = await this.pool.query<EdgeProvenanceRow>(
      `
      SELECT *
      FROM v_edge_provenance
      WHERE tenant_id = $1
        AND edge_xid = $2
      ORDER BY evidence_created_at ASC
      `,
      [tenantId, edgeXid],
    );

    return result.rows.map((row) => ({
      edgeXid: row.edge_xid,
      edgeType: row.edge_type,
      fromEntityXid: row.from_entity_xid,
      toEntityXid: row.to_entity_xid,
      edgeAuthorityTier: row.edge_authority_tier,
      conflictKey: row.conflict_key,
      conflictStatus: row.conflict_status,
      supersededByEdgeXid: row.superseded_by_edge_xid,
      evidenceXid: row.evidence_xid,
      sourceRef: row.source_ref,
      documentXid: row.document_xid,
      chunkXid: row.chunk_xid,
      evidenceAuthorityTier: row.evidence_authority_tier,
      evidenceConfidence: Number(row.evidence_confidence),
      evidenceCreatedAt: row.evidence_created_at.toISOString(),
    }));
  }

  async getEntityNeighborhood(
    tenantId: string,
    entityXid: string,
  ): Promise<
    Array<{
      edgeXid: string;
      edgeType: string;
      fromEntityXid: string;
      fromEntityName: string;
      toEntityXid: string;
      toEntityName: string;
      authorityTier: string;
      conflictStatus: string;
      validFrom: string | null;
      validTo: string | null;
    }>
  > {
    const result = await this.pool.query<EntityNeighborRow>(
      `
      SELECT *
      FROM v_entity_edge_neighbors
      WHERE tenant_id = $1
        AND ($2 IN (from_entity_xid, to_entity_xid))
      ORDER BY edge_xid ASC
      `,
      [tenantId, entityXid],
    );

    return result.rows.map((row) => ({
      edgeXid: row.edge_xid,
      edgeType: row.edge_type,
      fromEntityXid: row.from_entity_xid,
      fromEntityName: row.from_entity_name,
      toEntityXid: row.to_entity_xid,
      toEntityName: row.to_entity_name,
      authorityTier: row.authority_tier,
      conflictStatus: row.conflict_status,
      validFrom: row.valid_from ? row.valid_from.toISOString() : null,
      validTo: row.valid_to ? row.valid_to.toISOString() : null,
    }));
  }
}