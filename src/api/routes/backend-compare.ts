import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

export function createBackendCompareRouter(): Router {
  const router = createRouter();

  router.get("/backend-compare/graph", async (_req: Request, res: Response) => {
    res.json({
      ok: true,
      note: "phase 9 placeholder",
      comparisons: [
        {
          backendA: "in-memory",
          backendB: "kuzu",
          status: "not_yet_active",
          metric: "path parity",
        },
        {
          backendA: "in-memory",
          backendB: "kuzu",
          status: "not_yet_active",
          metric: "neighbor parity",
        },
      ],
    });
  });

  return router;
}