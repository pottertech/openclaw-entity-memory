import { buildKuzuBootstrapStatements } from "./kuzu-bootstrap.js";
export class KuzuRealGraphAdapter {
    loadedNodes = [];
    loadedEdges = [];
    async load(nodes, edges) {
        this.loadedNodes = [...nodes];
        this.loadedEdges = [...edges];
        const bootstrap = buildKuzuBootstrapStatements();
        console.log(JSON.stringify({
            ok: true,
            msg: "kuzu bootstrap prepared",
            statements: bootstrap.map((item) => item.name),
            nodeCount: nodes.length,
            edgeCount: edges.length,
        }));
        // Real implementation later:
        // 1. connect to Kuzu runtime
        // 2. run bootstrap DDL
        // 3. upsert nodes
        // 4. upsert edges
    }
    async neighbors(xid) {
        return this.loadedEdges
            .filter((edge) => edge.from === xid || edge.to === xid)
            .map((edge) => ({
            edgeXid: edge.xid,
            edgeType: edge.type,
            from: edge.from === xid ? edge.from : edge.to,
            to: edge.from === xid ? edge.to : edge.from,
            score: edge.score ?? 1,
        }));
    }
    async findPath(fromXid, toXid, maxDepth) {
        const top = await this.findTopPaths(fromXid, toXid, maxDepth, 1);
        return top[0] ?? null;
    }
    async findTopPaths(fromXid, toXid, maxDepth, maxResults = 5) {
        const queue = [
            {
                current: fromXid,
                path: [],
                visited: new Set([fromXid]),
            },
        ];
        const results = [];
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) {
                continue;
            }
            if (item.path.length >= maxDepth) {
                continue;
            }
            const neighbors = await this.neighbors(item.current);
            for (const hop of neighbors) {
                if (item.visited.has(hop.to)) {
                    continue;
                }
                const nextPath = [...item.path, hop];
                if (hop.to === toXid) {
                    results.push(nextPath);
                    continue;
                }
                const visited = new Set(item.visited);
                visited.add(hop.to);
                queue.push({
                    current: hop.to,
                    path: nextPath,
                    visited,
                });
            }
        }
        return results.slice(0, maxResults);
    }
}
