const RELATIONSHIP_PATTERNS = [
    /\bdepends on\b/i,
    /\baffected by\b/i,
    /\bwhat connects\b/i,
    /\bgoverned by\b/i,
    /\bbelongs to\b/i,
    /\bowned by\b/i,
    /\bwho owns\b/i,
    /\bblocked by\b/i,
    /\brelated to\b/i,
    /\bwhich projects\b/i,
    /\bwhich repos\b/i,
    /\bwhich customers\b/i,
    /\bimpact\b/i,
    /\boutage\b/i,
    /\bincident\b/i,
    /\bpolicy\b/i,
];
export function classifyRelationshipQuery(question) {
    const matched = RELATIONSHIP_PATTERNS.filter((pattern) => pattern.test(question));
    if (matched.length >= 2) {
        return {
            shouldUseEntityMemory: true,
            confidence: "high",
            reasons: ["multiple relationship patterns matched"],
        };
    }
    if (matched.length === 1) {
        return {
            shouldUseEntityMemory: true,
            confidence: "medium",
            reasons: ["single relationship pattern matched"],
        };
    }
    return {
        shouldUseEntityMemory: false,
        confidence: "low",
        reasons: ["no relationship-specific pattern matched"],
    };
}
