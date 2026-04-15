import express from "express";
import { createPgPool } from "../db/postgres/client.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import { IngestRepository } from "../db/postgres/repositories/ingest-repository.js";
import { QueryAuditRepository } from "../db/postgres/repositories/query-audit-repository.js";
import { AclRepository } from "../db/postgres/repositories/acl-repository.js";
import { AuthorityRepository } from "../db/postgres/repositories/authority-repository.js";
import { ProvenanceRepository } from "../db/postgres/repositories/provenance-repository.js";
import { ShadowAuditRepository } from "../db/postgres/repositories/shadow-audit-repository.js";
import { InMemoryGraphAdapter } from "../db/graph/backends/in-memory.js";
import { KuzuGraphAdapter } from "../db/graph/backends/kuzu.js";
import { EntityService } from "../services/entity-service.js";
import { EdgeService } from "../services/edge-service.js";
import { IngestService } from "../services/ingest-service.js";
import { QueryAuditService } from "../services/query-audit-service.js";
import { AclService } from "../services/acl-service.js";
import { AuthorityService } from "../services/authority-service.js";
import { EdgeAclRepository } from "../db/postgres/repositories/edge-acl-repository.js";
import { EdgeAclService } from "../services/edge-acl-service.js";
import { ConflictResolutionService } from "../services/conflict-resolution-service.js";
import { DocumentAclService } from "../services/document-acl-service.js";
import { ProvenanceService } from "../services/provenance-service.js";
import { ProvenanceWeightedConflictService } from "../services/provenance-weighted-conflict-service.js";
import { AccessAwareTraversalService } from "../services/access-aware-traversal-service.js";
import { HybridQueryService } from "../services/hybrid-query-service.js";
import { ImpactQueryService } from "../services/impact-query-service.js";
import { ShadowAuditService } from "../services/shadow-audit-service.js";
import { createHealthRouter } from "./routes/health.js";
import { createEntityRouter } from "./routes/entities.js";
import { createQueryRouter } from "./routes/query.js";
import { createIngestRouter } from "./routes/ingest.js";
import { createAuditRouter } from "./routes/audit.js";
import { createProvenanceRouter } from "./routes/provenance.js";
import { createReviewRouter } from "./routes/review.js";
import { createSemanticBaselineRouter } from "./routes/semantic-baseline.js";
export async function createServer(config) {
    const app = express();
    const pool = createPgPool(config);
    const entityRepository = new EntityRepository(pool);
    const edgeRepository = new EdgeRepository(pool);
    const ingestRepository = new IngestRepository(pool);
    const queryAuditRepository = new QueryAuditRepository(pool);
    const aclRepository = new AclRepository(pool);
    const authorityRepository = new AuthorityRepository(pool);
    const edgeAclRepository = new EdgeAclRepository(pool);
    const provenanceRepository = new ProvenanceRepository(pool);
    const graphAdapter = config.graphBackend === "kuzu"
        ? new KuzuGraphAdapter()
        : new InMemoryGraphAdapter();
    const aclService = new AclService(aclRepository);
    const authorityService = new AuthorityService(authorityRepository);
    const edgeAclService = new EdgeAclService(edgeAclRepository);
    const conflictResolutionService = new ConflictResolutionService();
    const documentAclService = new DocumentAclService(pool);
    const provenanceService = new ProvenanceService(provenanceRepository, documentAclService);
    const provenanceWeightedConflictService = new ProvenanceWeightedConflictService();
    const entityService = new EntityService(entityRepository, aclService);
    const edgeService = new EdgeService(entityRepository, ingestRepository, edgeAclRepository);
    const ingestService = new IngestService(ingestRepository, edgeService);
    const queryAuditService = new QueryAuditService(queryAuditRepository);
    const shadowAuditRepository = new ShadowAuditRepository(pool);
    const shadowAuditService = new ShadowAuditService(shadowAuditRepository);
    const traversalService = new AccessAwareTraversalService(entityRepository, edgeRepository, graphAdapter, aclService, edgeAclService, conflictResolutionService, provenanceService, authorityService, provenanceWeightedConflictService);
    const hybridQueryService = new HybridQueryService(entityService, traversalService, edgeRepository, authorityService, provenanceService);
    const impactQueryService = new ImpactQueryService(entityService, entityRepository, traversalService, edgeRepository, authorityService, provenanceService);
    app.use(express.json({ limit: "1mb" }));
    app.use("/v1", createHealthRouter(pool));
    app.use("/v1", createEntityRouter(entityService));
    app.use("/v1", createIngestRouter(ingestService));
    app.use("/v1", createAuditRouter(pool));
    app.use("/v1", createProvenanceRouter(provenanceService));
    app.use("/v1", createReviewRouter(pool));
    app.use("/v1", createSemanticBaselineRouter());
    app.use("/v1", createQueryRouter(entityService, traversalService, hybridQueryService, impactQueryService, queryAuditService));
    app.use((err, _req, res, _next) => {
        res.status(500).json({
            error: "internal_server_error",
            detail: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
    });
    return app;
}
