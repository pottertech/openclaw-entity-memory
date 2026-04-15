import { Router as createRouter } from "express";
export function createAuditRouter(pool) {
    const router = createRouter();
    router.get("/audit/queries", async (req, res) => {
        const tenantId = String(req.query.tenant_id ?? "").trim();
        const limit = Math.min(Number(req.query.limit ?? 25), 100);
        if (!tenantId) {
            res.status(400).json({ error: "tenant_id is required" });
            return;
        }
        const result = await pool.query(`
      SELECT
        xid,
        tenant_id,
        query_type,
        query_text,
        request_json,
        response_json,
        status,
        duration_ms,
        created_at
      FROM query_audit
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `, [tenantId, limit]);
        res.json({
            queries: result.rows.map((row) => ({
                xid: row.xid,
                tenantId: row.tenant_id,
                queryType: row.query_type,
                queryText: row.query_text,
                requestJson: row.request_json,
                responseJson: row.response_json,
                status: row.status,
                durationMs: row.duration_ms,
                createdAt: row.created_at.toISOString(),
            })),
        });
    });
    return router;
}
