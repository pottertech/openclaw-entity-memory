import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { IngestService } from "../../services/ingest-service.js";

const EntitySchema = z.object({
  xid: z.string().min(1),
  tenantId: z.string().min(1),
  entityType: z.enum([
    "Agent",
    "User",
    "Team",
    "Project",
    "Repository",
    "Service",
    "Workflow",
    "Document",
    "Incident",
    "Datastore",
  ]),
  canonicalName: z.string().min(1),
  status: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  aliases: z
    .array(
      z.object({
        xid: z.string().min(1),
        alias: z.string().min(1),
        aliasType: z.string().optional(),
      }),
    )
    .optional(),
});

const EdgeSchema = z.object({
  xid: z.string().min(1),
  tenantId: z.string().min(1),
  edgeType: z.enum([
    "LEADS",
    "BELONGS_TO",
    "OWNS",
    "DEPENDS_ON",
    "USES",
    "IMPLEMENTS",
    "GOVERNED_BY",
    "AFFECTED_BY",
    "ASSIGNED_TO",
    "GENERATED_FROM",
    "SUPERSEDES",
    "RELATED_TO",
  ]),
  fromEntityXid: z.string().min(1),
  toEntityXid: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  authorityTier: z.enum(["low", "standard", "high", "critical"]).optional(),
  conflictKey: z.string().optional().nullable(),
  supersededByEdgeXid: z.string().optional().nullable(),
  conflictStatus: z.enum(["active", "superseded", "conflicted", "inactive"]).optional(),
  lastObservedAt: z.string().optional().nullable(),
  acl: z
    .array(
      z.object({
        xid: z.string().min(1),
        subjectType: z.string().min(1),
        subjectId: z.string().min(1),
        permission: z.string().min(1),
        effect: z.enum(["allow", "deny"]),
      }),
    )
    .optional(),
  evidence: z
    .array(
      z.object({
        xid: z.string().min(1),
        sourceRef: z.string().min(1),
        documentXid: z.string().optional().nullable(),
        chunkXid: z.string().optional().nullable(),
        evidenceSpan: z.record(z.any()).optional(),
        confidence: z.number().min(0).max(1).optional(),
        authorityTier: z.enum(["low", "standard", "high", "critical"]).optional(),
      }),
    )
    .min(1),
});

export function createIngestRouter(ingestService: IngestService): Router {
  const router = createRouter();

  router.post("/ingest/entities", async (req: Request, res: Response) => {
    const parsed = z.array(EntitySchema).safeParse(req.body?.entities);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid entity ingest request",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await ingestService.ingestEntities(parsed.data);
    res.json({ ok: true, result });
  });

  router.post("/ingest/edges", async (req: Request, res: Response) => {
    const parsed = z.array(EdgeSchema).safeParse(req.body?.edges);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid edge ingest request",
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      const result = await ingestService.ingestEdges(parsed.data);
      res.json({ ok: true, result });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}