export class ImpactQueryService {
    entityService;
    entityRepository;
    traversalService;
    edgeRepository;
    authorityService;
    provenanceService;
    constructor(entityService, entityRepository, traversalService, edgeRepository, authorityService, provenanceService) {
        this.entityService = entityService;
        this.entityRepository = entityRepository;
        this.traversalService = traversalService;
        this.edgeRepository = edgeRepository;
        this.authorityService = authorityService;
        this.provenanceService = provenanceService;
    }
    async query(request) {
        const maxDepth = request.maxDepth ?? 3;
        const minAuthorityRank = await this.authorityService.getMinimumRank(request.minAuthorityTier);
        const sourceXid = request.source.xid ??
            (request.source.name
                ? (await this.entityService.resolveEntity(request.tenantId, request.source.name, request.actor))?.match.xid
                : undefined);
        if (!sourceXid) {
            throw new Error("could not resolve source entity");
        }
        const sourceEntity = await this.entityRepository.getByXid(request.tenantId, sourceXid);
        if (!sourceEntity) {
            throw new Error("source entity not found");
        }
        const allEntities = await this.entityRepository.listByTenant(request.tenantId);
        const targetTypes = new Set(request.targetTypes ?? []);
        const affected = [];
        const explanationExclusions = [...this.traversalService.getExplanations()];
        for (const entity of allEntities) {
            if (entity.xid === sourceXid) {
                continue;
            }
            if (targetTypes.size > 0 && !targetTypes.has(entity.entityType)) {
                continue;
            }
            const forwardPath = await this.traversalService.findPathByResolvedIds({
                tenantId: request.tenantId,
                fromXid: entity.xid,
                toXid: sourceXid,
                maxDepth,
                asOf: request.asOf,
                minAuthorityRank,
                actor: request.actor,
            });
            if (!forwardPath) {
                continue;
            }
            const evidence = [];
            for (const hop of forwardPath) {
                const visible = await this.provenanceService.getVisibleEdgeProvenance({
                    tenantId: request.tenantId,
                    edgeXid: hop.edgeXid,
                    actor: request.actor,
                });
                for (const ev of visible.provenance) {
                    evidence.push({
                        edgeXid: hop.edgeXid,
                        documentXid: ev.documentXid,
                        chunkXid: ev.chunkXid,
                    });
                }
                explanationExclusions.push(...visible.exclusions);
            }
            affected.push({
                entity: {
                    xid: entity.xid,
                    canonicalName: entity.canonicalName,
                    entityType: entity.entityType,
                },
                path: forwardPath.map((hop) => ({
                    from: hop.from,
                    edge: hop.edge,
                    to: hop.to,
                })),
                evidence,
            });
        }
        return {
            source: {
                xid: sourceEntity.xid,
                canonicalName: sourceEntity.canonicalName,
                entityType: sourceEntity.entityType,
            },
            affected,
            explanation: {
                exclusions: explanationExclusions,
            },
        };
    }
}
