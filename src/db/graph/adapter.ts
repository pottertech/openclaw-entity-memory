export type GraphNode = {
  xid: string;
  name: string;
  type: string;
};

export type GraphEdge = {
  xid: string;
  type: string;
  from: string;
  to: string;
};

export type GraphPathHop = {
  edgeXid: string;
  edgeType: string;
  from: string;
  to: string;
};

export interface GraphAdapter {
  load(nodes: GraphNode[], edges: GraphEdge[]): Promise<void>;
  findPath(fromXid: string, toXid: string, maxDepth: number): Promise<GraphPathHop[] | null>;
  neighbors(xid: string): Promise<GraphPathHop[]>;
}