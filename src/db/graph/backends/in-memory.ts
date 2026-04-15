import type {
  GraphAdapter,
  GraphEdge,
  GraphNode,
  GraphPathHop,
} from "../adapter.js";
import { WeightedPathSearch } from "../../../query/weighted-path-search.js";

export class InMemoryGraphAdapter implements GraphAdapter {
  private readonly nodes = new Map<string, GraphNode>();
  private readonly adjacency = new Map<string, GraphPathHop[]>();
  private readonly weightedPathSearch = new WeightedPathSearch();

  async load(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    this.nodes.clear();
    this.adjacency.clear();

    for (const node of nodes) {
      this.nodes.set(node.xid, node);
      this.adjacency.set(node.xid, []);
    }

    for (const edge of edges) {
      if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
        continue;
      }

      const hop: GraphPathHop = {
        edgeXid: edge.xid,
        edgeType: edge.type,
        from: edge.from,
        to: edge.to,
        score: edge.score ?? 1,
      };

      const reverseHop: GraphPathHop = {
        edgeXid: edge.xid,
        edgeType: edge.type,
        from: edge.to,
        to: edge.from,
        score: edge.score ?? 1,
      };

      this.adjacency.get(edge.from)?.push(hop);
      this.adjacency.get(edge.to)?.push(reverseHop);
    }
  }

  async neighbors(xid: string): Promise<GraphPathHop[]> {
    return this.adjacency.get(xid) ?? [];
  }

  async findPath(
    fromXid: string,
    toXid: string,
    maxDepth: number,
  ): Promise<GraphPathHop[] | null> {
    const paths = await this.findTopPaths(fromXid, toXid, maxDepth, 1);
    return paths[0] ?? null;
  }

  async findTopPaths(
    fromXid: string,
    toXid: string,
    maxDepth: number,
    maxResults = 5,
  ): Promise<GraphPathHop[][]> {
    if (fromXid === toXid) {
      return [[]];
    }

    const results = this.weightedPathSearch.findTopPaths({
      start: fromXid,
      goal: toXid,
      maxDepth,
      maxResults,
      neighborsForNode: (xid) =>
        (this.adjacency.get(xid) ?? []).map((hop) => ({
          edgeXid: hop.edgeXid,
          edgeType: hop.edgeType,
          from: hop.from,
          to: hop.to,
          score: hop.score ?? 1,
        })),
    });

    return results.map((item) =>
      item.hops.map((hop) => ({
        edgeXid: hop.edgeXid,
        edgeType: hop.edgeType,
        from: hop.from,
        to: hop.to,
        score: hop.score,
      })),
    );
  }
}