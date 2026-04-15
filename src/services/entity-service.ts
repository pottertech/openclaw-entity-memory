import type { Entity, EntityResolveResult } from "../types/entities.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import { AclService } from "./acl-service.js";

export class EntityService {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly aclService: AclService,
  ) {}

  async listEntities(
    tenantId: string,
    actor?: { subjectType?: string; subjectId?: string },
  ): Promise<Entity[]> {
    const all = await this.entityRepository.listByTenant(tenantId);
    const visible: Entity[] = [];

    for (const entity of all) {
      const canRead = await this.aclService.canReadEntity({
        tenantId,
        subjectType: actor?.subjectType,
        subjectId: actor?.subjectId,
        entityXid: entity.xid,
      });

      if (canRead) {
        visible.push(entity);
      }
    }

    return visible;
  }

  async getEntity(
    tenantId: string,
    xid: string,
    actor?: { subjectType?: string; subjectId?: string },
  ): Promise<Entity | null> {
    const entity = await this.entityRepository.getByXid(tenantId, xid);
    if (!entity) {
      return null;
    }

    const canRead = await this.aclService.canReadEntity({
      tenantId,
      subjectType: actor?.subjectType,
      subjectId: actor?.subjectId,
      entityXid: xid,
    });

    return canRead ? entity : null;
  }

  async resolveEntity(
    tenantId: string,
    name: string,
    actor?: { subjectType?: string; subjectId?: string },
  ): Promise<EntityResolveResult | null> {
    const result = await this.entityRepository.resolveByName(tenantId, name);
    if (!result) {
      return null;
    }

    const canRead = await this.aclService.canReadEntity({
      tenantId,
      subjectType: actor?.subjectType,
      subjectId: actor?.subjectId,
      entityXid: result.entity.xid,
    });

    if (!canRead) {
      return null;
    }

    return {
      match: {
        xid: result.entity.xid,
        entityType: result.entity.entityType,
        canonicalName: result.entity.canonicalName,
      },
      matchedAlias: result.matchedAlias ?? undefined,
      confidence: result.score,
    };
  }

  async getNeighbors(
    tenantId: string,
    xid: string,
    actor?: { subjectType?: string; subjectId?: string },
  ): Promise<
    Array<{
      edgeXid: string;
      edgeType: string;
      direction: "out" | "in";
      entity: Entity;
    }>
  > {
    const neighbors = await this.entityRepository.getNeighbors(tenantId, xid);
    const visible: typeof neighbors = [];

    for (const item of neighbors) {
      const canRead = await this.aclService.canReadEntity({
        tenantId,
        subjectType: actor?.subjectType,
        subjectId: actor?.subjectId,
        entityXid: item.entity.xid,
      });

      if (canRead) {
        visible.push(item);
      }
    }

    return visible;
  }
}