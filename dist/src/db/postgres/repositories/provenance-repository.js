export class ProvenanceRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getEdgeProvenance(tenantId, edgeXid) {
        const result = await this.pool.query(`
      SELECT
        edge_xid,
        tenant_id,
        edge_type,
        from_entity_xid,
        to_entity_xid,
        edge_authority_tier,
        conflict_key,
        conflict_status,
        superseded_by_edge_xid,
        evidence_xid,
        source_ref,
        document_xid,
        chunk_xid,
        evidence_authority_tier,
        evidence_confidence,
        evidence_created_at
      FROM v_edge_provenance
      WHERE tenant_id = $1
        AND edge_xid = $2
      ORDER BY evidence_created_at ASC
      `, [tenantId, edgeXid]);
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
    async getEntityNeighborhood(tenantId, entityXid) {
        const result = await this.pool.query(`
      SELECT
        tenant_id,
        edge_xid,
        edge_type,
        from_entity_xid,
        from_entity_name,
        to_entity_xid,
        to_entity_name,
        authority_tier,
        conflict_status,
        valid_from,
        valid_to
      FROM v_entity_edge_neighbors
      WHERE tenant_id = $1
        AND ($2 IN (from_entity_xid, to_entity_xid))
      ORDER BY edge_xid ASC
      `, [tenantId, entityXid]);
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
