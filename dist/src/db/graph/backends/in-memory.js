import { WeightedPathSearch } from "../../../query/weighted-path-search.js";
export class InMemoryGraphAdapter {
    nodes = new Map();
    adjacency = new Map();
    weightedPathSearch = new WeightedPathSearch();
    async load(nodes, edges) {
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
            const hop = {
                edgeXid: edge.xid,
                edgeType: edge.type,
                from: edge.from,
                to: edge.to,
                score: edge.score ?? 1,
            };
            const reverseHop = {
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
    async neighbors(xid) {
        return this.adjacency.get(xid) ?? [];
    }
    async findPath(fromXid, toXid, maxDepth) {
        const paths = await this.findTopPaths(fromXid, toXid, maxDepth, 1);
        return paths[0] ?? null;
    }
    async findTopPaths(fromXid, toXid, maxDepth, maxResults = 5) {
        if (fromXid === toXid) {
            return [[]];
        }
        const results = this.weightedPathSearch.findTopPaths({
            start: fromXid,
            goal: toXid,
            maxDepth,
            maxResults,
            neighborsForNode: (xid) => (this.adjacency.get(xid) ?? []).map((hop) => ({
                edgeXid: hop.edgeXid,
                edgeType: hop.edgeType,
                from: hop.from,
                to: hop.to,
                score: hop.score ?? 1,
            })),
        });
        return results.map((item) => item.hops.map((hop) => ({
            edgeXid: hop.edgeXid,
            edgeType: hop.edgeType,
            from: hop.from,
            to: hop.to,
            score: hop.score,
        })));
    }
}
