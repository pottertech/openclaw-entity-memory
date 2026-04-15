import { Router as createRouter } from "express";
export function createReviewRouter(pool) {
    const router = createRouter();
    router.get("/review/conflicts", async (req, res) => {
        const tenantId = String(req.query.tenant_id ?? "").trim();
        const conflictKey = String(req.query.conflict_key ?? "").trim() || null;
        const limit = Math.min(Number(req.query.limit ?? 50), 100);
        if (!tenantId) {
            res.status(400).json({ error: "tenant_id is required" });
            return;
        }
        const result = await pool.query(`
      SELECT
        xid,
        tenant_id,
        edge_type,
        from_entity_xid,
        to_entity_xid,
        authority_tier,
        conflict_key,
        conflict_status,
        superseded_by_edge_xid,
        created_at
      FROM edges
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR conflict_key = $2)
      ORDER BY conflict_key NULLS LAST, created_at DESC
      LIMIT $3
      `, [tenantId, conflictKey, limit]);
        res.json({
            conflicts: result.rows.map((row) => ({
                xid: row.xid,
                tenantId: row.tenant_id,
                edgeType: row.edge_type,
                fromEntityXid: row.from_entity_xid,
                toEntityXid: row.to_entity_xid,
                authorityTier: row.authority_tier,
                conflictKey: row.conflict_key,
                conflictStatus: row.conflict_status,
                supersededByEdgeXid: row.superseded_by_edge_xid,
                createdAt: row.created_at.toISOString(),
            })),
        });
    });
    return router;
}
