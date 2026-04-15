export class EntityService {
    entityRepository;
    aclService;
    constructor(entityRepository, aclService) {
        this.entityRepository = entityRepository;
        this.aclService = aclService;
    }
    async getEntity(tenantId, xid, actor) {
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
    async resolveEntity(tenantId, name, actor) {
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
    async getNeighbors(tenantId, xid, actor) {
        const neighbors = await this.entityRepository.getNeighbors(tenantId, xid);
        const visible = [];
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
