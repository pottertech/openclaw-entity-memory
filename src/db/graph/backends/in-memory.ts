import type { GraphAdapter, GraphEdge, GraphNode, GraphPathHop } from "../adapter.js";

export class InMemoryGraphAdapter implements GraphAdapter {
  private readonly nodes = new Map<string, GraphNode>();
  private readonly adjacency = new Map<string, GraphPathHop[]>();

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
      };

      const reverseHop: GraphPathHop = {
        edgeXid: edge.xid,
        edgeType: edge.type,
        from: edge.to,
        to: edge.from,
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
    if (fromXid === toXid) {
      return [];
    }

    const queue: Array<{ current: string; path: GraphPathHop[] }> = [
      { current: fromXid, path: [] },
    ];
    const visited = new Set<string>([fromXid]);

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) {
        continue;
      }

      if (item.path.length >= maxDepth) {
        continue;
      }

      for (const hop of this.adjacency.get(item.current) ?? []) {
        if (visited.has(hop.to)) {
          continue;
        }

        const nextPath = [...item.path, hop];
        if (hop.to === toXid) {
          return nextPath;
        }

        visited.add(hop.to);
        queue.push({
          current: hop.to,
          path: nextPath,
        });
      }
    }

    return null;
  }
}