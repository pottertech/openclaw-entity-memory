export class KuzuGraphAdapter {
    async load(_nodes, _edges) {
        throw new Error("KuzuGraphAdapter not implemented yet");
    }
    async findPath(_fromXid, _toXid, _maxDepth) {
        throw new Error("KuzuGraphAdapter not implemented yet");
    }
    async findTopPaths(_fromXid, _toXid, _maxDepth, _maxResults = 5) {
        throw new Error("KuzuGraphAdapter not implemented yet");
    }
    async neighbors(_xid) {
        throw new Error("KuzuGraphAdapter not implemented yet");
    }
}
