import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import pg from "pg";

export function createAlertHistoryRouter(pool: pg.Pool): Router {
  const router = createRouter();

  router.get(
    "/canary-dashboard/outage-impact/alert-history",
    async (req: Request, res: Response) => {
      const tenantId = String(req.query.tenant_id ?? "").trim();
      const days = Math.min(Number(req.query.days ?? 14), 90);

      if (!tenantId) {
        res.status(400).json({ error: "tenant_id is required" });
        return;
      }

      const thresholdResult = await pool.query(
        `
        SELECT
          DATE(created_at) AS day,
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
          AND created_at >= NOW() - ($2::text || ' days')::interval
        GROUP BY DATE(created_at)
        ORDER BY day ASC
        `,
        [tenantId, String(days)],
      );

      const history = (thresholdResult.rows as any[]).map((row) => {
        const total = Number(row.total);
        const preferredHybrid = Number(row.preferred_hybrid);
        const sameAnswerCount = Number(row.same_answer_count);

        const hybridPreferenceRate = total > 0 ? preferredHybrid / total : 0;
        const sameAnswerRate = total > 0 ? sameAnswerCount / total : 0;

        const alerts: string[] = [];

        if (total >= 10 && sameAnswerRate < 0.8) {
          alerts.push("same_answer_rate_below_threshold");
        }

        if (total >= 10 && hybridPreferenceRate < 0.6) {
          alerts.push("hybrid_preference_rate_below_threshold");
        }

        return {
          day: String(row.day),
          total,
          hybridPreferenceRate,
          sameAnswerRate,
          alerts,
        };
      });

      res.json({ days, history });
    },
  );

  return router;
}