function mapEdgeRow(row) {
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
function mapEvidenceRow(row) {
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
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getByXid(tenantId, xid) {
        const result = await this.pool.query(`
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
      `, [tenantId, xid]);
        if (!result.rowCount) {
            return null;
        }
        return mapEdgeRow(result.rows[0]);
    }
    async getAllEdgesForTenant(tenantId) {
        const result = await this.pool.query(`
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
      `, [tenantId]);
        return result.rows;
    }
    async getEdgesForTenantAsOf(tenantId, asOf) {
        if (!asOf) {
            return this.getAllEdgesForTenant(tenantId);
        }
        const result = await this.pool.query(`
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
      `, [tenantId, asOf]);
        return result.rows;
    }
    async getEdgesForTenantFiltered(input) {
        const result = await this.pool.query(`
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
      `, [input.tenantId, input.asOf ?? null, input.minAuthorityRank ?? 0]);
        return result.rows;
    }
    async getEvidenceForEdge(tenantId, edgeXid, minAuthorityRank = 0) {
        const result = await this.pool.query(`
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
      `, [tenantId, edgeXid, minAuthorityRank]);
        return result.rows.map(mapEvidenceRow);
    }
}
