import { Router as createRouter } from "express";
export function createCanaryTrendsRouter(pool) {
    const router = createRouter();
    router.get("/canary-dashboard/outage-impact/trends", async (req, res) => {
        const tenantId = String(req.query.tenant_id ?? "").trim();
        const days = Math.min(Number(req.query.days ?? 7), 30);
        if (!tenantId) {
            res.status(400).json({ error: "tenant_id is required" });
            return;
        }
        const result = await pool.query(`
        SELECT
          DATE(created_at) AS day,
          COUNT(*)::int AS total,
          SUM(CASE WHEN chosen_path = 'hybrid' THEN 1 ELSE 0 END)::int AS chosen_hybrid,
          SUM(CASE WHEN chosen_path = 'semantic' THEN 1 ELSE 0 END)::int AS chosen_semantic,
          SUM(
            CASE WHEN comparison_json->>'sameAnswer' = 'true' THEN 1 ELSE 0 END
          )::int AS same_answer_count
        FROM shadow_audit
        WHERE tenant_id = $1
          AND query_class = 'outage_impact'
          AND created_at >= NOW() - ($2::text || ' days')::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
        `, [tenantId, String(days)]);
        res.json({
            days,
            trends: result.rows.map((row) => {
                const total = Number(row.total);
                const sameAnswerCount = Number(row.same_answer_count);
                return {
                    day: String(row.day),
                    total,
                    chosenHybrid: Number(row.chosen_hybrid),
                    chosenSemantic: Number(row.chosen_semantic),
                    sameAnswerCount,
                    sameAnswerRate: total > 0 ? sameAnswerCount / total : 0,
                };
            }),
        });
    });
    return router;
}
