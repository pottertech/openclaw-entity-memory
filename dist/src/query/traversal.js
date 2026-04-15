export class TraversalService {
    entityRepository;
    edgeRepository;
    graphAdapter;
    constructor(entityRepository, edgeRepository, graphAdapter) {
        this.entityRepository = entityRepository;
        this.edgeRepository = edgeRepository;
        this.graphAdapter = graphAdapter;
    }
    async refreshTenantGraph(tenantId) {
        const edges = await this.edgeRepository.getAllEdgesForTenant(tenantId);
        const nodeIds = new Set();
        for (const edge of edges) {
            nodeIds.add(edge.from_entity_xid);
            nodeIds.add(edge.to_entity_xid);
        }
        const nodes = [];
        for (const xid of nodeIds) {
            const entity = await this.entityRepository.getByXid(tenantId, xid);
            if (!entity) {
                continue;
            }
            nodes.push({
                xid: entity.xid,
                name: entity.canonicalName,
                type: entity.entityType,
            });
        }
        const graphEdges = edges.map((edge) => ({
            xid: edge.xid,
            type: edge.edge_type,
            from: edge.from_entity_xid,
            to: edge.to_entity_xid,
        }));
        await this.graphAdapter.load(nodes, graphEdges);
    }
    async findPathByResolvedIds(tenantId, fromXid, toXid, maxDepth = 4) {
        await this.refreshTenantGraph(tenantId);
        const path = await this.graphAdapter.findPath(fromXid, toXid, maxDepth);
        if (!path) {
            return null;
        }
        const hops = [];
        for (const hop of path) {
            const fromEntity = await this.entityRepository.getByXid(tenantId, hop.from);
            const toEntity = await this.entityRepository.getByXid(tenantId, hop.to);
            hops.push({
                from: fromEntity?.canonicalName ?? hop.from,
                edge: hop.edgeType,
                to: toEntity?.canonicalName ?? hop.to,
                edgeXid: hop.edgeXid,
            });
        }
        return hops;
    }
}
