import type { IngestEdgeInput } from "../types/api.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import { IngestRepository } from "../db/postgres/repositories/ingest-repository.js";
import { EdgeAclRepository } from "../db/postgres/repositories/edge-acl-repository.js";

export class EdgeService {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly ingestRepository: IngestRepository,
    private readonly edgeAclRepository: EdgeAclRepository,
  ) {}

  async ingestEdge(input: IngestEdgeInput): Promise<void> {
    if (!input.evidence || input.evidence.length === 0) {
      throw new Error("edge evidence is required");
    }

    const fromEntity = await this.entityRepository.getByXid(input.tenantId, input.fromEntityXid);
    const toEntity = await this.entityRepository.getByXid(input.tenantId, input.toEntityXid);

    if (!fromEntity) {
      throw new Error(`from entity not found: ${input.fromEntityXid}`);
    }

    if (!toEntity) {
      throw new Error(`to entity not found: ${input.toEntityXid}`);
    }

    await this.ingestRepository.upsertEdge(input);

    if (input.acl && input.acl.length > 0) {
      await this.edgeAclRepository.upsertBindings({
        tenantId: input.tenantId,
        edgeXid: input.xid,
        bindings: input.acl.map((item) => ({
          xid: item.xid,
          subjectType: item.subjectType,
          subjectId: item.subjectId,
          permission: item.permission,
          effect: item.effect,
        })),
      });
    }
  }
}