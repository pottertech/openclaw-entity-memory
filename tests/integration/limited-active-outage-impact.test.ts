import { describe, it, expect } from "vitest";
import { decideLimitedActiveRouting } from "../../src/adapters/limited-active-router.js";

describe("limited active outage impact routing", () => {
  it("stays semantic when rollback is enabled", () => {
    const decision = decideLimitedActiveRouting({
      question: "Was Alice's project affected by Tuesday's outage?",
      enableOutageImpactActive: true,
      rollbackEnabled: true,
    });

    expect(decision.active).toBe(false);
    expect(decision.chosenPath).toBe("semantic");
  });

  it("uses hybrid when outage impact is approved and rollback is off", () => {
    const decision = decideLimitedActiveRouting({
      question: "Was Alice's project affected by Tuesday's outage?",
      enableOutageImpactActive: true,
      rollbackEnabled: false,
    });

    expect(decision.active).toBe(true);
    expect(decision.queryClass).toBe("outage_impact");
    expect(decision.chosenPath).toBe("hybrid");
  });

  it("keeps semantic for non-approved query classes", () => {
    const decision = decideLimitedActiveRouting({
      question: "Summarize the quarterly memo",
      enableOutageImpactActive: true,
      rollbackEnabled: false,
    });

    expect(decision.active).toBe(false);
    expect(decision.chosenPath).toBe("semantic");
  });
});