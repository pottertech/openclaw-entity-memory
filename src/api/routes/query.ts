import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { EntityService } from "../../services/entity-service.js";
import { TraversalService } from "../../query/traversal.js";
import { HybridQueryService } from "../../services/hybrid-query-service.js";

const PathQuerySchema = z.object({
  tenantId: z.string().min(1),
  from: z.object({
    name: z.string().optional(),
    xid: z.string().optional(),
  }),
  to: z.object({
    name: z.string().optional(),
    xid: z.string().optional(),
  }),
  maxDepth: z.number().int().positive().max(8).optional(),
  asOf: z.string().optional(),
});

const HybridQuerySchema = z.object({
  tenantId: z.string().min(1),
  question: z.string().min(1),
  semanticCandidates: z.array(
    z.object({
      documentXid: z.string().optional(),
      chunkXid: z.string().optional(),
      text: z.string().min(1),
    }),
  ),
  asOf: z.string().optional(),
});

export function createQueryRouter(
  entityService: EntityService,
  traversalService: TraversalService,
  hybridQueryService: HybridQueryService,
): Router {
  const router = createRouter();

  router.post("/query/path", async (req: Request, res: Response) => {
    const parsed = PathQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid path query request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const tenantId = parsed.data.tenantId;

    const fromXid =
      parsed.data.from.xid ??
      (parsed.data.from.name
        ? (await entityService.resolveEntity(tenantId, parsed.data.from.name))?.match.xid
        : undefined);

    const toXid =
      parsed.data.to.xid ??
      (parsed.data.to.name
        ? (await entityService.resolveEntity(tenantId, parsed.data.to.name))?.match.xid
        : undefined);

    if (!fromXid || !toXid) {
      res.status(404).json({ error: "could not resolve from/to entities" });
      return;
    }

    const path = await traversalService.findPathByResolvedIds(
      tenantId,
      fromXid,
      toXid,
      parsed.data.maxDepth ?? 4,
    );

    res.json({
      found: Boolean(path),
      path: (path ?? []).map((hop) => ({
        from: hop.from,
        edge: hop.edge,
        to: hop.to,
      })),
    });
  });

  router.post("/query/hybrid", async (req: Request, res: Response) => {
    const parsed = HybridQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid hybrid query request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await hybridQueryService.query(parsed.data);
    res.json(result);
  });

  router.post("/query/impact", async (_req: Request, res: Response) => {
    res.status(501).json({
      error: "not implemented yet",
      note: "build this after path and hybrid are stable",
    });
  });

  return router;
}