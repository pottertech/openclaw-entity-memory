import type { IngestEntityInput, IngestEdgeInput } from "../types/api.js";
import { IngestRepository } from "../db/postgres/repositories/ingest-repository.js";
import { EdgeService } from "./edge-service.js";

export class IngestService {
  constructor(
    private readonly ingestRepository: IngestRepository,
    private readonly edgeService: EdgeService,
  ) {}

  async ingestEntities(entities: IngestEntityInput[]): Promise<{ count: number }> {
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

  async ingestEdges(edges: IngestEdgeInput[]): Promise<{ count: number }> {
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