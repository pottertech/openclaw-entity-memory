import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import type { GraphAdapter, GraphNode, GraphEdge } from "../db/graph/adapter.js";

export class TraversalService {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly edgeRepository: EdgeRepository,
    private readonly graphAdapter: GraphAdapter,
  ) {}

  async refreshTenantGraph(tenantId: string): Promise<void> {
    const edges = await this.edgeRepository.getAllEdgesForTenant(tenantId);

    const nodeIds = new Set<string>();
    for (const edge of edges) {
      nodeIds.add(edge.from_entity_xid);
      nodeIds.add(edge.to_entity_xid);
    }

    const nodes: GraphNode[] = [];
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

    const graphEdges: GraphEdge[] = edges.map((edge) => ({
      xid: edge.xid,
      type: edge.edge_type,
      from: edge.from_entity_xid,
      to: edge.to_entity_xid,
    }));

    await this.graphAdapter.load(nodes, graphEdges);
  }

  async findPathByResolvedIds(
    tenantId: string,
    fromXid: string,
    toXid: string,
    maxDepth = 4,
  ): Promise<
    Array<{
      from: string;
      edge: string;
      to: string;
      edgeXid: string;
    }> | null
  > {
    await this.refreshTenantGraph(tenantId);

    const path = await this.graphAdapter.findPath(fromXid, toXid, maxDepth);
    if (!path) {
      return null;
    }

    const hops: Array<{
      from: string;
      edge: string;
      to: string;
      edgeXid: string;
    }> = [];

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