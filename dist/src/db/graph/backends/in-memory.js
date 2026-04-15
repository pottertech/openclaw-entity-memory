export class InMemoryGraphAdapter {
    nodes = new Map();
    adjacency = new Map();
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
            };
            const reverseHop = {
                edgeXid: edge.xid,
                edgeType: edge.type,
                from: edge.to,
                to: edge.from,
            };
            this.adjacency.get(edge.from)?.push(hop);
            this.adjacency.get(edge.to)?.push(reverseHop);
        }
    }
    async neighbors(xid) {
        return this.adjacency.get(xid) ?? [];
    }
    async findPath(fromXid, toXid, maxDepth) {
        if (fromXid === toXid) {
            return [];
        }
        const queue = [
            { current: fromXid, path: [] },
        ];
        const visited = new Set([fromXid]);
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
