import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import pg from "pg";

type AuditRow = {
  xid: string;
  tenant_id: string;
  query_type: string;
  query_text: string | null;
  request_json: Record<string, unknown>;
  response_json: Record<string, unknown>;
  status: string;
  duration_ms: number | null;
  created_at: Date;
};

export function createAuditRouter(pool: pg.Pool): Router {
  const router = createRouter();

  router.get("/audit/queries", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const limit = Math.min(Number(req.query.limit ?? 25), 100);

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query<AuditRow>(
      `
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
      `,
      [tenantId, limit],
    );

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