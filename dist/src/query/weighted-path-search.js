export class WeightedPathSearch {
    findTopPaths(input) {
        const maxResults = input.maxResults ?? 5;
        const results = [];
        const queue = [
            {
                current: input.start,
                hops: [],
                visited: new Set([input.start]),
                totalScore: 0,
            },
        ];
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) {
                continue;
            }
            if (item.hops.length >= input.maxDepth) {
                continue;
            }
            const neighbors = input.neighborsForNode(item.current);
            for (const neighbor of neighbors) {
                if (item.visited.has(neighbor.to)) {
                    continue;
                }
                const nextHop = {
                    edgeXid: neighbor.edgeXid,
                    edgeType: neighbor.edgeType,
                    from: neighbor.from,
                    to: neighbor.to,
                    score: neighbor.score,
                };
                const nextHops = [...item.hops, nextHop];
                const nextScore = item.totalScore + neighbor.score;
                if (neighbor.to === input.goal) {
                    results.push({
                        hops: nextHops,
                        totalScore: nextScore,
                    });
                    continue;
                }
                const nextVisited = new Set(item.visited);
                nextVisited.add(neighbor.to);
                queue.push({
                    current: neighbor.to,
                    hops: nextHops,
                    visited: nextVisited,
                    totalScore: nextScore,
                });
            }
        }
        return results
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, maxResults);
    }
}
