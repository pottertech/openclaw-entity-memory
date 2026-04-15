import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import type pg from "pg";

export function registerHealthRoutes(router: Router, pool: pg.Pool): void {
  router.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  router.get("/ready", async (_req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        ok: true,
        postgres: "up",
        graph_adapter: "up",
      });
    } catch (error) {
      res.status(503).json({
        ok: false,
        postgres: "down",
        graph_adapter: "unknown",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export function createHealthRouter(pool: pg.Pool): Router {
  const router = createRouter();
  registerHealthRoutes(router, pool);
  return router;
}