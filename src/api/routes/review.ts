import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import pg from "pg";

type ConflictRow = {
  xid: string;
  tenant_id: string;
  edge_type: string;
  from_entity_xid: string;
  to_entity_xid: string;
  authority_tier: string;
  conflict_key: string | null;
  conflict_status: string;
  superseded_by_edge_xid: string | null;
  created_at: Date;
};

type QueryAuditRow = {
  xid: string;
  query_type: string;
  response_json: Record<string, unknown>;
  created_at: Date;
};

export function createReviewRouter(pool: pg.Pool): Router {
  const router = createRouter();

  router.get("/review/conflicts", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const conflictKey =
      String(req.query.conflict_key ?? "").trim() || null;
    const limit = Math.min(Number(req.query.limit ?? 50), 100);

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query<ConflictRow>(
      `
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
      `,
      [tenantId, conflictKey, limit],
    );

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

  router.get("/review/exclusions", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const limit = Math.min(Number(req.query.limit ?? 25), 100);

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query<QueryAuditRow>(
      `
      SELECT
        xid,
        query_type,
        response_json,
        created_at
      FROM query_audit
      WHERE tenant_id = $1
        AND response_json ? 'explanation'
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [tenantId, limit],
    );

    const exclusions = result.rows.flatMap((row) => {
      const responseJson = row.response_json as Record<string, unknown>;
      const items = (responseJson?.explanation as Record<string, unknown> | undefined)?.exclusions;
      if (!Array.isArray(items)) {
        return [];
      }

      return items.map((item: Record<string, unknown>) => ({
        queryAuditXid: row.xid,
        queryType: row.query_type,
        createdAt: row.created_at.toISOString(),
        kind: item.kind,
        id: item.id,
        reason: item.reason,
        detail: item.detail,
      }));
    });

    res.json({ exclusions });
  });

  router.get("/review/benchmark-summary", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();

    if (!tenantId) {
      res.status(400).json({ error: "tenant_id is required" });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        query_type,
        status,
        COUNT(*)::int AS count,
        AVG(duration_ms)::numeric(10,2) AS avg_duration_ms
      FROM query_audit
      WHERE tenant_id = $1
      GROUP BY query_type, status
      ORDER BY query_type, status
      `,
      [tenantId],
    );

    res.json({
      summary: result.rows.map((row: Record<string, unknown>) => ({
        queryType: row.query_type,
        status: row.status,
        count: Number(row.count),
        avgDurationMs: Number(row.avg_duration_ms),
      })),
    });
  });

  return router;
}