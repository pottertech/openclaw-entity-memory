import type {
  GraphAdapter,
  GraphEdge,
  GraphNode,
  GraphPathHop,
} from "../adapter.js";

export class KuzuGraphAdapter implements GraphAdapter {
  async load(_nodes: GraphNode[], _edges: GraphEdge[]): Promise<void> {
    throw new Error("KuzuGraphAdapter not implemented yet");
  }

  async findPath(
    _fromXid: string,
    _toXid: string,
    _maxDepth: number,
  ): Promise<GraphPathHop[] | null> {
    throw new Error("KuzuGraphAdapter not implemented yet");
  }

  async findTopPaths(
    _fromXid: string,
    _toXid: string,
    _maxDepth: number,
    _maxResults = 5,
  ): Promise<GraphPathHop[][]> {
    throw new Error("KuzuGraphAdapter not implemented yet");
  }

  async neighbors(_xid: string): Promise<GraphPathHop[]> {
    throw new Error("KuzuGraphAdapter not implemented yet");
  }
}