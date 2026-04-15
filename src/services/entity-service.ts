import type { Entity, EntityResolveResult } from "../types/entities.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";

export class EntityService {
  constructor(private readonly entityRepository: EntityRepository) {}

  async getEntity(tenantId: string, xid: string): Promise<Entity | null> {
    return this.entityRepository.getByXid(tenantId, xid);
  }

  async resolveEntity(
    tenantId: string,
    name: string,
  ): Promise<EntityResolveResult | null> {
    const result = await this.entityRepository.resolveByName(tenantId, name);

    if (!result) {
      return null;
    }

    return {
      match: {
        xid: result.entity.xid,
        entityType: result.entity.entityType,
        canonicalName: result.entity.canonicalName,
      },
      matchedAlias: result.matchedAlias,
      confidence: result.score,
    };
  }

  async getNeighbors(
    tenantId: string,
    xid: string,
  ): Promise<
    Array<{
      edgeXid: string;
      edgeType: string;
      direction: "out" | "in";
      entity: Entity;
    }>
  > {
    return this.entityRepository.getNeighbors(tenantId, xid);
  }
}