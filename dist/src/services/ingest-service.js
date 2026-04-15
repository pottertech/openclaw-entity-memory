export class IngestService {
    ingestRepository;
    edgeService;
    constructor(ingestRepository, edgeService) {
        this.ingestRepository = ingestRepository;
        this.edgeService = edgeService;
    }
    async ingestEntities(entities) {
        for (const entity of entities) {
            await this.ingestRepository.upsertEntity(entity);
        }
        await this.ingestRepository.recordIngestionRun({
            xid: `ing_${Date.now()}_entities`,
            tenantId: entities[0]?.tenantId ?? "tenant_default",
            runType: "entities",
            status: "completed",
            stats: { count: entities.length },
        });
        return { count: entities.length };
    }
    async ingestEdges(edges) {
        for (const edge of edges) {
            await this.edgeService.ingestEdge(edge);
        }
        await this.ingestRepository.recordIngestionRun({
            xid: `ing_${Date.now()}_edges`,
            tenantId: edges[0]?.tenantId ?? "tenant_default",
            runType: "edges",
            status: "completed",
            stats: { count: edges.length },
        });
        return { count: edges.length };
    }
}
