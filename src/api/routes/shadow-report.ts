import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import pg from "pg";

export function createShadowReportRouter(pool: pg.Pool): Router {
  const router = createRouter();

  router.get("/shadow-report/verdicts", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const queryClass = String(req.query.query_class ?? "").trim() || null;

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        query_class,
        COUNT(*)::int AS total,
        SUM(
          CASE
            WHEN comparison_json->>'preferred' = 'hybrid' THEN 1
            ELSE 0
          END
        )::int AS preferred_hybrid,
        SUM(
          CASE
            WHEN comparison_json->>'preferred' = 'semantic' THEN 1
            ELSE 0
          END
        )::int AS preferred_semantic,
        SUM(
          CASE
            WHEN comparison_json->>'sameAnswer' = 'true' THEN 1
            ELSE 0
          END
        )::int AS same_answer_count
      FROM shadow_audit
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR query_class = $2)
      GROUP BY query_class
      ORDER BY query_class
      `,
      [tenantId, queryClass],
    );

    res.json({
      verdicts: result.rows.map((row: any) => ({
        queryClass: row.query_class,
        total: Number(row.total),
        preferredHybrid: Number(row.preferred_hybrid),
        preferredSemantic: Number(row.preferred_semantic),
        sameAnswerCount: Number(row.same_answer_count),
      })),
    });
  });

  router.get("/shadow-report/thresholds", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const queryClass = String(req.query.query_class ?? "").trim() || "outage_impact";

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        SUM(
          CASE WHEN comparison_json->>'preferred' = 'hybrid' THEN 1 ELSE 0 END
        )::int AS preferred_hybrid,
        SUM(
          CASE WHEN comparison_json->>'preferred' = 'semantic' THEN 1 ELSE 0 END
        )::int AS preferred_semantic,
        SUM(
          CASE WHEN comparison_json->>'sameAnswer' = 'true' THEN 1 ELSE 0 END
        )::int AS same_answer_count
      FROM shadow_audit
      WHERE tenant_id = $1
        AND query_class = $2
      `,
      [tenantId, queryClass],
    );

    const row: any = result.rows[0] ?? {
      total: 0,
      preferred_hybrid: 0,
      preferred_semantic: 0,
      same_answer_count: 0,
    };

    const total = Number(row.total);
    const preferredHybrid = Number(row.preferred_hybrid);
    const preferredSemantic = Number(row.preferred_semantic);
    const sameAnswerCount = Number(row.same_answer_count);

    const hybridPreferenceRate = total > 0 ? preferredHybrid / total : 0;
    const sameAnswerRate = total > 0 ? sameAnswerCount / total : 0;

    const meetsInitialPromotionThreshold =
      total >= 10 && hybridPreferenceRate >= 0.6 && sameAnswerRate >= 0.8;

    res.json({
      queryClass,
      total,
      preferredHybrid,
      preferredSemantic,
      sameAnswerCount,
      hybridPreferenceRate: Math.round(hybridPreferenceRate * 100) / 100,
      sameAnswerRate: Math.round(sameAnswerRate * 100) / 100,
      meetsInitialPromotionThreshold,
      thresholdNotes: [
        "minimum 10 reviewed cases",
        "hybrid preferred in at least 60 percent",
        "same answer in at least 80 percent",
      ],
    });
  });

  return router;
}