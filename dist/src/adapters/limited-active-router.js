export function decideLimitedActiveRouting(input) {
    const isOutageImpact = /\boutage\b/i.test(input.question) ||
        /\baffected by\b/i.test(input.question) ||
        /\bimpact\b/i.test(input.question) ||
        /\bincident\b/i.test(input.question);
    if (!isOutageImpact) {
        return {
            active: false,
            queryClass: "other",
            chosenPath: "semantic",
            reason: "query class not approved for limited active routing",
        };
    }
    if (input.rollbackEnabled) {
        return {
            active: false,
            queryClass: "outage_impact",
            chosenPath: "semantic",
            reason: "rollback switch enabled",
        };
    }
    if (input.enableOutageImpactActive) {
        return {
            active: true,
            queryClass: "outage_impact",
            chosenPath: "hybrid",
            reason: "approved limited active class",
        };
    }
    return {
        active: false,
        queryClass: "outage_impact",
        chosenPath: "semantic",
        reason: "still in shadow mode",
    };
}
