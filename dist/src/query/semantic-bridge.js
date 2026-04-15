export class DefaultSemanticBridge {
    normalizeCandidates(input) {
        return input
            .filter((item) => item.text.trim().length > 0)
            .map((item) => ({
            ...item,
            text: item.text.trim(),
            score: item.score ?? 0.5,
            metadata: item.metadata ?? {},
        }));
    }
}
