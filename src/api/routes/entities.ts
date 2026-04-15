import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { EntityService } from "../../services/entity-service.js";

const ResolveQuerySchema = z.object({
  tenant_id: z.string().min(1),
  name: z.string().min(1),
  actor_subject_type: z.string().optional(),
  actor_subject_id: z.string().optional(),
});

export function createEntityRouter(entityService: EntityService): Router {
  const router = createRouter();

  router.get("/entities/:xid", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const xid = String(req.params.xid ?? "").trim();

    if (!tenantId || !xid) {
      res.status(400).json({ error: "tenant_id and xid are required" });
      return;
    }

    const entity = await entityService.getEntity(tenantId, xid, {
      subjectType: String(req.query.actor_subject_type ?? "").trim() || undefined,
      subjectId: String(req.query.actor_subject_id ?? "").trim() || undefined,
    });

    if (!entity) {
      res.status(404).json({ error: "entity not found" });
      return;
    }

    res.json({ entity });
  });

  router.get("/entities/resolve", async (req: Request, res: Response) => {
    const parsed = ResolveQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid query",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await entityService.resolveEntity(parsed.data.tenant_id, parsed.data.name, {
      subjectType: parsed.data.actor_subject_type,
      subjectId: parsed.data.actor_subject_id,
    });

    if (!result) {
      res.status(404).json({ error: "no entity match found" });
      return;
    }

    res.json(result);
  });

  router.get("/entities/:xid/neighbors", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const xid = String(req.params.xid ?? "").trim();

    if (!tenantId || !xid) {
      res.status(400).json({ error: "tenant_id and xid are required" });
      return;
    }

    const center = await entityService.getEntity(tenantId, xid, {
      subjectType: String(req.query.actor_subject_type ?? "").trim() || undefined,
      subjectId: String(req.query.actor_subject_id ?? "").trim() || undefined,
    });

    if (!center) {
      res.status(404).json({ error: "entity not found" });
      return;
    }

    const neighbors = await entityService.getNeighbors(tenantId, xid, {
      subjectType: String(req.query.actor_subject_type ?? "").trim() || undefined,
      subjectId: String(req.query.actor_subject_id ?? "").trim() || undefined,
    });

    res.json({
      center: {
        xid: center.xid,
        canonicalName: center.canonicalName,
      },
      neighbors: neighbors.map((item) => ({
        edgeXid: item.edgeXid,
        edgeType: item.edgeType,
        direction: item.direction,
        entity: item.entity,
      })),
    });
  });

  return router;
}