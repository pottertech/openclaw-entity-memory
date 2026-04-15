import { describe, it, expect } from "vitest";
import { decideLimitedActiveRouting } from "../../src/adapters/limited-active-router.js";
describe("outage impact production gate", () => {
    it("allows hybrid only for approved outage-impact class", () => {
        const decision = decideLimitedActiveRouting({
            question: "Which projects were affected by the Tuesday outage?",
            enableOutageImpactActive: true,
            rollbackEnabled: false,
        });
        expect(decision.active).toBe(true);
        expect(decision.chosenPath).toBe("hybrid");
    });
    it("does not activate hybrid for non-outage class", () => {
        const decision = decideLimitedActiveRouting({
            question: "Summarize the release notes",
            enableOutageImpactActive: true,
            rollbackEnabled: false,
        });
        expect(decision.active).toBe(false);
        expect(decision.chosenPath).toBe("semantic");
    });
});
