import express from "express";
import type { Express } from "express";
import type { AppConfig } from "../config/index.js";
import { createPgPool } from "../db/postgres/client.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import { InMemoryGraphAdapter } from "../db/graph/backends/in-memory.js";
import { EntityService } from "../services/entity-service.js";
import { TraversalService } from "../query/traversal.js";
import { HybridQueryService } from "../services/hybrid-query-service.js";
import { createHealthRouter } from "./routes/health.js";
import { createEntityRouter } from "./routes/entities.js";
import { createQueryRouter } from "./routes/query.js";

export async function createServer(config: AppConfig): Promise<Express> {
  const app = express();
  const pool = createPgPool(config);

  const entityRepository = new EntityRepository(pool);
  const edgeRepository = new EdgeRepository(pool);
  const graphAdapter = new InMemoryGraphAdapter();

  const entityService = new EntityService(entityRepository);
  const traversalService = new TraversalService(
    entityRepository,
    edgeRepository,
    graphAdapter,
  );
  const hybridQueryService = new HybridQueryService(
    entityService,
    traversalService,
    edgeRepository,
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/v1", createHealthRouter(pool));
  app.use("/v1", createEntityRouter(entityService));
  app.use("/v1", createQueryRouter(entityService, traversalService, hybridQueryService));

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({
      error: "internal_server_error",
      detail: err instanceof Error ? err.message : String(err),
    });
  });

  return app;
}