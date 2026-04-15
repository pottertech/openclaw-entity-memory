import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { ProvenanceService } from "../../services/provenance-service.js";

export function createProvenanceRouter(provenanceService: ProvenanceService): Router {
  const router = createRouter();

  router.get("/provenance/edges/:edgeXid", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const edgeXid = String(req.params.edgeXid ?? "").trim();

    if (!tenantId || !edgeXid) {
      res.status(400).json({ error: "tenant_id and edgeXid are required" });
      return;
    }

    const result = await provenanceService.getVisibleEdgeProvenance({
      tenantId,
      edgeXid,
      actor: {
        subjectType: String(req.query.actor_subject_type ?? "").trim() || undefined,
        subjectId: String(req.query.actor_subject_id ?? "").trim() || undefined,
      },
    });

    res.json(result);
  });

  router.get("/provenance/entities/:entityXid/neighborhood", async (req: Request, res: Response) => {
    const tenantId = String(req.query.tenant_id ?? "").trim();
    const entityXid = String(req.params.entityXid ?? "").trim();

    if (!tenantId || !entityXid) {
      res.status(400).json({ error: "tenant_id and entityXid are required" });
      return;
    }

    const result = await provenanceService.getEntityNeighborhood({
      tenantId,
      entityXid,
    });

    res.json({ neighborhood: result });
  });

  return router;
}