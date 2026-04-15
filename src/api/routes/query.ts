import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { EntityService } from "../../services/entity-service.js";
import { TraversalService } from "../../query/traversal.js";
import { HybridQueryService } from "../../services/hybrid-query-service.js";
import { ImpactQueryService } from "../../services/impact-query-service.js";
import { QueryAuditService } from "../../services/query-audit-service.js";

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
  actor: z
    .object({
      subjectType: z.string().optional(),
      subjectId: z.string().optional(),
    })
    .optional(),
  minAuthorityTier: z.string().optional(),
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
  actor: z
    .object({
      subjectType: z.string().optional(),
      subjectId: z.string().optional(),
    })
    .optional(),
  minAuthorityTier: z.string().optional(),
});

const ImpactQuerySchema = z.object({
  tenantId: z.string().min(1),
  source: z.object({
    name: z.string().optional(),
    xid: z.string().optional(),
  }),
  targetTypes: z.array(z.string()).optional(),
  maxDepth: z.number().int().positive().max(8).optional(),
  asOf: z.string().optional(),
  actor: z
    .object({
      subjectType: z.string().optional(),
      subjectId: z.string().optional(),
    })
    .optional(),
  minAuthorityTier: z.string().optional(),
});

export function createQueryRouter(
  entityService: EntityService,
  traversalService: TraversalService,
  hybridQueryService: HybridQueryService,
  impactQueryService: ImpactQueryService,
  queryAuditService: QueryAuditService,
): Router {
  const router = createRouter();

  router.post("/query/path", async (req: Request, res: Response) => {
    const started = Date.now();
    const parsed = PathQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      const responseJson = {
        error: "invalid path query request",
        details: parsed.error.flatten(),
      };

      await queryAuditService.record({
        tenantId: String(req.body?.tenantId ?? "unknown"),
        queryType: "path",
        requestJson: req.body ?? {},
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(400).json(responseJson);
      return;
    }

    try {
      const tenantId = parsed.data.tenantId;

      const fromXid =
        parsed.data.from.xid ??
        (parsed.data.from.name
          ? (await entityService.resolveEntity(tenantId, parsed.data.from.name, parsed.data.actor))?.match.xid
          : undefined);

      const toXid =
        parsed.data.to.xid ??
        (parsed.data.to.name
          ? (await entityService.resolveEntity(tenantId, parsed.data.to.name, parsed.data.actor))?.match.xid
          : undefined);

      if (!fromXid || !toXid) {
        const responseJson = { error: "could not resolve from/to entities" };

        await queryAuditService.record({
          tenantId,
          queryType: "path",
          requestJson: parsed.data,
          responseJson,
          status: "error",
          durationMs: Date.now() - started,
        });

        res.status(404).json(responseJson);
        return;
      }

      const path = await (traversalService as any).findPathByResolvedIds(
        tenantId,
        fromXid,
        toXid,
        parsed.data.maxDepth ?? 4,
        parsed.data.asOf,
      );

      const responseJson = {
        found: Boolean(path),
        path: (path ?? []).map((hop: any) => ({
          from: hop.from,
          edge: hop.edge,
          to: hop.to,
        })),
      };

      await queryAuditService.record({
        tenantId,
        queryType: "path",
        requestJson: parsed.data,
        responseJson,
        status: "ok",
        durationMs: Date.now() - started,
      });

      res.json(responseJson);
    } catch (error) {
      const responseJson = {
        error: error instanceof Error ? error.message : String(error),
      };

      await queryAuditService.record({
        tenantId: parsed.success ? parsed.data.tenantId : "unknown",
        queryType: "path",
        requestJson: parsed.success ? parsed.data : req.body ?? {},
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(500).json(responseJson);
    }
  });

  router.post("/query/hybrid", async (req: Request, res: Response) => {
    const started = Date.now();
    const parsed = HybridQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      const responseJson = {
        error: "invalid hybrid query request",
        details: parsed.error.flatten(),
      };

      await queryAuditService.record({
        tenantId: String(req.body?.tenantId ?? "unknown"),
        queryType: "hybrid",
        queryText: String(req.body?.question ?? ""),
        requestJson: req.body ?? {},
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(400).json(responseJson);
      return;
    }

    try {
      const result = await hybridQueryService.query(parsed.data);

      await queryAuditService.record({
        tenantId: parsed.data.tenantId,
        queryType: "hybrid",
        queryText: parsed.data.question,
        requestJson: parsed.data,
        responseJson: result,
        status: "ok",
        durationMs: Date.now() - started,
      });

      res.json(result);
    } catch (error) {
      const responseJson = {
        error: error instanceof Error ? error.message : String(error),
      };

      await queryAuditService.record({
        tenantId: parsed.data.tenantId,
        queryType: "hybrid",
        queryText: parsed.data.question,
        requestJson: parsed.data,
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(500).json(responseJson);
    }
  });

  router.post("/query/impact", async (req: Request, res: Response) => {
    const started = Date.now();
    const parsed = ImpactQuerySchema.safeParse(req.body);

    if (!parsed.success) {
      const responseJson = {
        error: "invalid impact query request",
        details: parsed.error.flatten(),
      };

      await queryAuditService.record({
        tenantId: String(req.body?.tenantId ?? "unknown"),
        queryType: "impact",
        requestJson: req.body ?? {},
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(400).json(responseJson);
      return;
    }

    try {
      const result = await impactQueryService.query(parsed.data);

      await queryAuditService.record({
        tenantId: parsed.data.tenantId,
        queryType: "impact",
        requestJson: parsed.data,
        responseJson: result,
        status: "ok",
        durationMs: Date.now() - started,
      });

      res.json(result);
    } catch (error) {
      const responseJson = {
        error: error instanceof Error ? error.message : String(error),
      };

      await queryAuditService.record({
        tenantId: parsed.data.tenantId,
        queryType: "impact",
        requestJson: parsed.data,
        responseJson,
        status: "error",
        durationMs: Date.now() - started,
      });

      res.status(404).json(responseJson);
    }
  });

  return router;
}