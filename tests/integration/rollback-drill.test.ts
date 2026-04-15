import { describe, it, expect } from "vitest";
import { decideLimitedActiveRouting } from "../../src/adapters/limited-active-router.js";

describe("rollback drill", () => {
  it("forces semantic path when rollback is enabled", () => {
    const decision = decideLimitedActiveRouting({
      question: "Was Alice's project affected by Tuesday's outage?",
      enableOutageImpactActive: true,
      rollbackEnabled: true,
    });

    expect(decision.active).toBe(false);
    expect(decision.chosenPath).toBe("semantic");
    expect(decision.queryClass).toBe("outage_impact");
  });
});