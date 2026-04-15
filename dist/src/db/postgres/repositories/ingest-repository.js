export class IngestRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsertEntity(input) {
        await this.pool.query(`
      INSERT INTO entities (
        xid, tenant_id, entity_type, canonical_name, status, metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (xid) DO UPDATE
      SET
        tenant_id = EXCLUDED.tenant_id,
        entity_type = EXCLUDED.entity_type,
        canonical_name = EXCLUDED.canonical_name,
        status = EXCLUDED.status,
        metadata_json = EXCLUDED.metadata_json,
        updated_at = NOW()
      `, [
            input.xid,
            input.tenantId,
            input.entityType,
            input.canonicalName,
            input.status ?? "active",
            input.metadata ?? {},
        ]);
        for (const alias of input.aliases ?? []) {
            await this.pool.query(`
        INSERT INTO entity_aliases (
          xid, tenant_id, entity_xid, alias, alias_type
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (xid) DO UPDATE
        SET
          tenant_id = EXCLUDED.tenant_id,
          entity_xid = EXCLUDED.entity_xid,
          alias = EXCLUDED.alias,
          alias_type = EXCLUDED.alias_type
        `, [
                alias.xid,
                input.tenantId,
                input.xid,
                alias.alias,
                alias.aliasType ?? "name_variant",
            ]);
        }
    }
    async upsertEdge(input) {
        await this.pool.query(`
      INSERT INTO edges (
        xid, tenant_id, edge_type, from_entity_xid, to_entity_xid,
        confidence, valid_from, valid_to, metadata_json,
        authority_tier, conflict_key, superseded_by_edge_xid,
        conflict_status, last_observed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (xid) DO UPDATE
      SET
        tenant_id = EXCLUDED.tenant_id,
        edge_type = EXCLUDED.edge_type,
        from_entity_xid = EXCLUDED.from_entity_xid,
        to_entity_xid = EXCLUDED.to_entity_xid,
        confidence = EXCLUDED.confidence,
        valid_from = EXCLUDED.valid_from,
        valid_to = EXCLUDED.valid_to,
        metadata_json = EXCLUDED.metadata_json,
        authority_tier = EXCLUDED.authority_tier,
        conflict_key = EXCLUDED.conflict_key,
        superseded_by_edge_xid = EXCLUDED.superseded_by_edge_xid,
        conflict_status = EXCLUDED.conflict_status,
        last_observed_at = EXCLUDED.last_observed_at,
        updated_at = NOW()
      `, [
            input.xid,
            input.tenantId,
            input.edgeType,
            input.fromEntityXid,
            input.toEntityXid,
            input.confidence ?? 1,
            input.validFrom ?? null,
            input.validTo ?? null,
            input.metadata ?? {},
            input.authorityTier ?? "standard",
            input.conflictKey ?? null,
            input.supersededByEdgeXid ?? null,
            input.conflictStatus ?? "active",
            input.lastObservedAt ?? new Date().toISOString(),
        ]);
        for (const ev of input.evidence) {
            await this.pool.query(`
        INSERT INTO edge_evidence (
          xid, tenant_id, edge_xid, source_ref, document_xid, chunk_xid,
          evidence_span, confidence, authority_tier
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (xid) DO UPDATE
        SET
          tenant_id = EXCLUDED.tenant_id,
          edge_xid = EXCLUDED.edge_xid,
          source_ref = EXCLUDED.source_ref,
          document_xid = EXCLUDED.document_xid,
          chunk_xid = EXCLUDED.chunk_xid,
          evidence_span = EXCLUDED.evidence_span,
          confidence = EXCLUDED.confidence,
          authority_tier = EXCLUDED.authority_tier
        `, [
                ev.xid,
                input.tenantId,
                input.xid,
                ev.sourceRef,
                ev.documentXid ?? null,
                ev.chunkXid ?? null,
                ev.evidenceSpan ?? {},
                ev.confidence ?? 1,
                ev.authorityTier ?? input.authorityTier ?? "standard",
            ]);
        }
    }
    async recordIngestionRun(input) {
        await this.pool.query(`
      INSERT INTO ingestion_runs (
        xid, tenant_id, run_type, source_ref, status, stats_json, started_at, finished_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [
            input.xid,
            input.tenantId,
            input.runType,
            input.sourceRef ?? null,
            input.status,
            input.stats ?? {},
        ]);
    }
}
