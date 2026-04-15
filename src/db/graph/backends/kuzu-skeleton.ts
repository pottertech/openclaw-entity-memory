import type { GraphAdapter, GraphEdge, GraphNode, GraphPathHop } from "../adapter.js";

type StoredNode = GraphNode;
type StoredEdge = Required<GraphEdge>;

export class KuzuGraphSkeletonAdapter implements GraphAdapter {
  private nodes = new Map<string, StoredNode>();
  private edges: StoredEdge[] = [];

  async load(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    this.nodes.clear();
    this.edges = [];

    for (const node of nodes) {
      this.nodes.set(node.xid, node);
    }

    for (const edge of edges) {
      this.edges.push({
        ...edge,
        score: edge.score ?? 1,
      });
    }
  }

  async neighbors(xid: string): Promise<GraphPathHop[]> {
    const outgoing = this.edges
      .filter((edge) => edge.from === xid || edge.to === xid)
      .map((edge) => ({
        edgeXid: edge.xid,
        edgeType: edge.type,
        from: edge.from === xid ? edge.from : edge.to,
        to: edge.from === xid ? edge.to : edge.from,
        score: edge.score,
      }));

    return outgoing;
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
    const results: Array<{ path: GraphPathHop[]; score: number }> = [];
    const queue: Array<{
      current: string;
      path: GraphPathHop[];
      visited: Set<string>;
      score: number;
    }> = [
      {
        current: fromXid,
        path: [],
        visited: new Set([fromXid]),
        score: 0,
      },
    ];

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) {
        continue;
      }

      if (item.path.length >= maxDepth) {
        continue;
      }

      const nextHops = await this.neighbors(item.current);

      for (const hop of nextHops) {
        if (item.visited.has(hop.to)) {
          continue;
        }

        const nextPath = [...item.path, hop];
        const nextScore = item.score + Number(hop.score ?? 1);

        if (hop.to === toXid) {
          results.push({
            path: nextPath,
            score: nextScore,
          });
          continue;
        }

        const nextVisited = new Set(item.visited);
        nextVisited.add(hop.to);

        queue.push({
          current: hop.to,
          path: nextPath,
          visited: nextVisited,
          score: nextScore,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.path);
  }
}
