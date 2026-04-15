import { Router as createRouter } from "express";
export function createCanaryDashboardRouter(pool) {
    const router = createRouter();
    router.get("/canary-dashboard/outage-impact", async (req, res) => {
        const tenantId = String(req.query.tenant_id ?? "").trim();
        if (!tenantId) {
            res.status(400).json({ error: "tenant_id is required" });
            return;
        }
        const shadowSummary = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          SUM(CASE WHEN chosen_path = 'hybrid' THEN 1 ELSE 0 END)::int AS chosen_hybrid,
          SUM(CASE WHEN chosen_path = 'semantic' THEN 1 ELSE 0 END)::int AS chosen_semantic
        FROM shadow_audit
        WHERE tenant_id = $1
          AND query_class = 'outage_impact'
        `, [tenantId]);
        const auditSummary = await pool.query(`
        SELECT
          COUNT(*)::int AS total_queries,
          AVG(duration_ms)::numeric(10,2) AS avg_duration_ms
        FROM query_audit
        WHERE tenant_id = $1
          AND query_type IN ('hybrid', 'impact', 'path')
        `, [tenantId]);
        const exclusionSummary = await pool.query(`
        SELECT
          item->>'reason' AS reason,
          COUNT(*)::int AS count
        FROM query_audit qa,
          LATERAL jsonb_array_elements(
            COALESCE(qa.response_json->'explanation'->'exclusions', '[]'::jsonb)
          ) item
        WHERE qa.tenant_id = $1
        GROUP BY item->>'reason'
        ORDER BY count DESC
        `, [tenantId]);
        const thresholdSummary = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          SUM(
            CASE WHEN comparison_json->>'preferred' = 'hybrid' THEN 1 ELSE 0 END
          )::int AS preferred_hybrid,
          SUM(
            CASE WHEN comparison_json->>'sameAnswer' = 'true' THEN 1 ELSE 0 END
          )::int AS same_answer_count
        FROM shadow_audit
        WHERE tenant_id = $1
          AND query_class = 'outage_impact'
        `, [tenantId]);
        const shadow = shadowSummary.rows[0];
        const audit = auditSummary.rows[0];
        const threshold = thresholdSummary.rows[0];
        const total = Number(threshold?.total ?? 0);
        const preferredHybrid = Number(threshold?.preferred_hybrid ?? 0);
        const sameAnswerCount = Number(threshold?.same_answer_count ?? 0);
        res.json({
            queryClass: "outage_impact",
            routing: {
                totalShadowRecords: Number(shadow?.total ?? 0),
                chosenHybrid: Number(shadow?.chosen_hybrid ?? 0),
                chosenSemantic: Number(shadow?.chosen_semantic ?? 0),
            },
            performance: {
                totalQueries: Number(audit?.total_queries ?? 0),
                avgDurationMs: Number(audit?.avg_duration_ms ?? 0),
            },
            exclusions: exclusionSummary.rows.map((row) => ({
                reason: row.reason,
                count: Number(row.count),
            })),
            thresholds: {
                total,
                hybridPreferenceRate: total > 0 ? Math.round((preferredHybrid / total) * 100) / 100 : 0,
                sameAnswerRate: total > 0 ? Math.round((sameAnswerCount / total) * 100) / 100 : 0,
            },
        });
    });
    return router;
}
export function createCanaryDashboardAlertsRouter(pool) {
    const router = createRouter();
    router.get("/canary-dashboard/outage-impact/alerts", async (req, res) => {
        const tenantId = String(req.query.tenant_id ?? "").trim();
        if (!tenantId) {
            res.status(400).json({ error: "tenant_id is required" });
            return;
        }
        const thresholdResponse = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          SUM(
            CASE WHEN comparison_json->>'preferred' = 'hybrid' THEN 1 ELSE 0 END
          )::int AS preferred_hybrid,
          SUM(
            CASE WHEN comparison_json->>'sameAnswer' = 'true' THEN 1 ELSE 0 END
          )::int AS same_answer_count
        FROM shadow_audit
        WHERE tenant_id = $1
          AND query_class = 'outage_impact'
        `, [tenantId]);
        const exclusionResponse = await pool.query(`
        SELECT
          item->>'reason' AS reason,
          COUNT(*)::int AS count
        FROM query_audit qa,
          LATERAL jsonb_array_elements(
            COALESCE(qa.response_json->'explanation'->'exclusions', '[]'::jsonb)
          ) item
        WHERE qa.tenant_id = $1
        GROUP BY item->>'reason'
        ORDER BY count DESC
        `, [tenantId]);
        const row = thresholdResponse.rows[0] ?? {
            total: 0,
            preferred_hybrid: 0,
            same_answer_count: 0,
        };
        const total = Number(row.total);
        const hybridPreferenceRate = total > 0 ? Number(row.preferred_hybrid) / total : 0;
        const sameAnswerRate = total > 0 ? Number(row.same_answer_count) / total : 0;
        const alerts = [];
        if (total >= 10 && sameAnswerRate < 0.8) {
            alerts.push({
                level: "warning",
                reason: "same-answer rate below 0.80",
            });
        }
        if (total >= 10 && hybridPreferenceRate < 0.6) {
            alerts.push({
                level: "warning",
                reason: "hybrid preference rate below 0.60",
            });
        }
        const exclusionRows = exclusionResponse.rows.map((item) => ({
            reason: item.reason,
            count: Number(item.count),
        }));
        const missingEvidence = exclusionRows.find((item) => item.reason === "missing_evidence");
        if (missingEvidence && missingEvidence.count >= 5) {
            alerts.push({
                level: "action_required",
                reason: "missing_evidence exclusions elevated",
            });
        }
        res.json({
            queryClass: "outage_impact",
            alerts,
            thresholdSnapshot: {
                total,
                hybridPreferenceRate,
                sameAnswerRate,
            },
            exclusions: exclusionRows,
        });
    });
    return router;
}
