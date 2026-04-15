export class ShadowAuditRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insert(input) {
        await this.pool.query(`
      INSERT INTO shadow_audit (
        xid, tenant_id, query_class, question,
        semantic_json, hybrid_json, comparison_json,
        chosen_path, rollback_state
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
            input.xid,
            input.tenantId,
            input.queryClass,
            input.question,
            input.semanticJson,
            input.hybridJson,
            input.comparisonJson,
            input.chosenPath,
            input.rollbackState,
        ]);
    }
}
