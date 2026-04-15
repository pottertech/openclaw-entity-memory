import type pg from "pg";

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
  authority_tier?: string;
  conflict_key?: string | null;
  conflict_status?: string;
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

function mapEdgeRow(row: EdgeRow) {
  return {
    xid: row.xid,
    tenantId: row.tenant_id,
    edgeType: row.edge_type,
    fromEntityXid: row.from_entity_xid,
    toEntityXid: row.to_entity_xid,
    confidence: Number(row.confidence),
    validFrom: row.valid_from,
    validTo: row.valid_to,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvidenceRow(row: EvidenceRow & { rank_value?: number | null }) {
  return {
    xid: row.xid,
    tenantId: row.tenant_id,
    edgeXid: row.edge_xid,
    sourceRef: row.source_ref,
    documentXid: row.document_xid,
    chunkXid: row.chunk_xid,
    evidenceSpan: row.evidence_span ?? {},
    confidence: Number(row.confidence),
    createdAt: row.created_at.toISOString(),
  };
}

export class EdgeRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getByXid(tenantId: string, xid: string): Promise<ReturnType<typeof mapEdgeRow> | null> {
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
      WHERE tenant_id = $1 AND xid = $2
      LIMIT 1
      `,
      [tenantId, xid],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapEdgeRow(result.rows[0]);
  }

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
        updated_at,
        authority_tier
      FROM edges
      WHERE tenant_id = $1
      ORDER BY created_at ASC
      `,
      [tenantId],
    );

    return result.rows;
  }

  async getEdgesForTenantAsOf(tenantId: string, asOf?: string): Promise<EdgeRow[]> {
    if (!asOf) {
      return this.getAllEdgesForTenant(tenantId);
    }

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
        updated_at,
        authority_tier
      FROM edges
      WHERE tenant_id = $1
        AND (valid_from IS NULL OR valid_from <= $2::timestamptz)
        AND (valid_to IS NULL OR valid_to >= $2::timestamptz)
      ORDER BY created_at ASC
      `,
      [tenantId, asOf],
    );

    return result.rows;
  }

  async getEdgesForTenantFiltered(input: {
    tenantId: string;
    asOf?: string;
    minAuthorityRank?: number;
  }): Promise<EdgeRow[]> {
    const result = await this.pool.query<EdgeRow>(
      `
      SELECT
        e.xid,
        e.tenant_id,
        e.edge_type,
        e.from_entity_xid,
        e.to_entity_xid,
        e.confidence,
        e.valid_from,
        e.valid_to,
        e.metadata_json,
        e.created_at,
        e.updated_at,
        e.authority_tier
      FROM edges e
      LEFT JOIN authority_tiers a
        ON a.tier = e.authority_tier
      WHERE e.tenant_id = $1
        AND ($2::timestamptz IS NULL OR (e.valid_from IS NULL OR e.valid_from <= $2::timestamptz))
        AND ($2::timestamptz IS NULL OR (e.valid_to IS NULL OR e.valid_to >= $2::timestamptz))
        AND (COALESCE(a.rank, 0) >= $3)
      ORDER BY e.created_at ASC
      `,
      [input.tenantId, input.asOf ?? null, input.minAuthorityRank ?? 0],
    );

    return result.rows;
  }

  async getEvidenceForEdge(
    tenantId: string,
    edgeXid: string,
    minAuthorityRank = 0,
  ): Promise<ReturnType<typeof mapEvidenceRow>[]> {
    const result = await this.pool.query<EvidenceRow & { rank_value: number | null }>(
      `
      SELECT
        ev.xid,
        ev.tenant_id,
        ev.edge_xid,
        ev.source_ref,
        ev.document_xid,
        ev.chunk_xid,
        ev.evidence_span,
        ev.confidence,
        ev.created_at,
        COALESCE(a.rank, 0) AS rank_value
      FROM edge_evidence ev
      LEFT JOIN authority_tiers a
        ON a.tier = ev.authority_tier
      WHERE ev.tenant_id = $1
        AND ev.edge_xid = $2
        AND COALESCE(a.rank, 0) >= $3
      ORDER BY ev.created_at ASC
      `,
      [tenantId, edgeXid, minAuthorityRank],
    );

    return result.rows.map(mapEvidenceRow);
  }
}