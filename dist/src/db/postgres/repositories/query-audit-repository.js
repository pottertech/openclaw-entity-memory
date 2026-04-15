export class QueryAuditRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async insert(record) {
        await this.pool.query(`
      INSERT INTO query_audit (
        xid, tenant_id, query_type, query_text, request_json,
        response_json, status, duration_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
            record.xid,
            record.tenantId,
            record.queryType,
            record.queryText ?? null,
            record.requestJson,
            record.responseJson,
            record.status,
            record.durationMs ?? null,
        ]);
    }
}
