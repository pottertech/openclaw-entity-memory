import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import pg from "pg";

type ShadowAuditRow = {
  xid: string;
  tenant_id: string;
  query_class: string;
  question: string;
  semantic_json: Record<string, unknown>;
  hybrid_json: Record<string, unknown>;
  comparison_json: Record<string, unknown>;
  chosen_path: string;
  rollback_state: string;
  created_at: Date;
};

export function createShadowAuditRouter(pool: pg.Pool): Router {
  const router = createRouter();

  router.get("/shadow-audit", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const queryClass = String(req.query.query_class ?? "").trim() || null;
    const limit = Math.min(Number(req.query.limit ?? 25), 100);

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query<ShadowAuditRow>(
      `
      SELECT
        xid,
        tenant_id,
        query_class,
        question,
        semantic_json,
        hybrid_json,
        comparison_json,
        chosen_path,
        rollback_state,
        created_at
      FROM shadow_audit
      WHERE tenant_id = $1
        AND ($2::text IS NULL OR query_class = $2)
      ORDER BY created_at DESC
      LIMIT $3
      `,
      [tenantId, queryClass, limit],
    );

    res.json({
      records: result.rows.map((row) => ({
        xid: row.xid,
        tenantId: row.tenant_id,
        queryClass: row.query_class,
        question: row.question,
        semanticJson: row.semantic_json,
        hybridJson: row.hybrid_json,
        comparisonJson: row.comparison_json,
        chosenPath: row.chosen_path,
        rollbackState: row.rollback_state,
        createdAt: row.created_at.toISOString(),
      })),
    });
  });

  router.get("/shadow-audit/summary", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        query_class,
        chosen_path,
        rollback_state,
        COUNT(*)::int AS count
      FROM shadow_audit
      WHERE tenant_id = $1
      GROUP BY query_class, chosen_path, rollback_state
      ORDER BY query_class, chosen_path, rollback_state
      `,
      [tenantId],
    );

    res.json({
      summary: result.rows.map((row: any) => ({
        queryClass: row.query_class,
        chosenPath: row.chosen_path,
        rollbackState: row.rollback_state,
        count: Number(row.count),
      })),
    });
  });

  return router;
}