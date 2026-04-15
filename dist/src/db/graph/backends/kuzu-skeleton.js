export class KuzuGraphSkeletonAdapter {
    nodes = new Map();
    edges = [];
    async load(nodes, edges) {
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
    async neighbors(xid) {
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
    async findPath(fromXid, toXid, maxDepth) {
        const paths = await this.findTopPaths(fromXid, toXid, maxDepth, 1);
        return paths[0] ?? null;
    }
    async findTopPaths(fromXid, toXid, maxDepth, maxResults = 5) {
        const results = [];
        const queue = [
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
