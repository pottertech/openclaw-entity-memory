export function createPseudoXid(prefix) {
    const now = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${now}_${rand}`;
}
