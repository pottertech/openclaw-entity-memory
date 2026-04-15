import { createOpenBrainEntityMemoryPackage } from "../src/adapters/openbrain-package.js";
import { SemanticBaselineHttpClient } from "../src/adapters/semantic-baseline-http-client.js";
import { OpenBrainShadowRunner } from "../src/adapters/openbrain-shadow-runner.js";
import { classifyRelationshipQuery } from "../src/adapters/orchestrator-routing-contract.js";
import { decideLimitedActiveRouting } from "../src/adapters/limited-active-router.js";

type SemanticProviderResult = {
  answer: string;
  confidence: "low" | "medium" | "high";
  evidence: Array<{
    documentXid?: string;
    chunkXid?: string;
    text?: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
};

async function getSemanticBaseline(
  question: string,
): Promise<SemanticProviderResult> {
  const semanticClient = new SemanticBaselineHttpClient(
    process.env.SEMANTIC_BASELINE_BASE_URL ?? "http://localhost:4020",
  );

  return semanticClient.query({
    tenantId: "tenant_default",
    question,
    actor: {
      subjectType: "agent",
      subjectId: "brodie",
    },
    semanticCandidates: [],
  });
}

async function writeShadowAudit(input: {
  tenantId: string;
  queryClass: string;
  question: string;
  semanticJson: Record<string, unknown>;
  hybridJson: Record<string, unknown>;
  comparisonJson: Record<string, unknown>;
  chosenPath: string;
  rollbackState: string;
}): Promise<void> {
  const response = await fetch(
    `${process.env.ENTITY_MEMORY_BASE_URL ?? "http://localhost:4017"}/v1/internal/shadow-audit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      `shadow audit write failed: ${response.status} ${await response.text()}`,
    );
  }
}

async function main(): Promise<void> {
  const question = "Was Alice's project affected by Tuesday's outage?";

  const route = classifyRelationshipQuery(question);
  const semanticBaseline = await getSemanticBaseline(question);

  if (!route.shouldUseEntityMemory) {
    console.log("Not selected for shadow hybrid call");
    return;
  }

  const entityMemory = createOpenBrainEntityMemoryPackage({
    baseUrl: process.env.ENTITY_MEMORY_BASE_URL ?? "http://localhost:4017",
  });

  const shadowRunner = new OpenBrainShadowRunner(
    new SemanticBaselineHttpClient(
      process.env.SEMANTIC_BASELINE_BASE_URL ?? "http://localhost:4020",
    ),
    entityMemory.client,
  );

  const result = await shadowRunner.run({
    tenantId: "tenant_default",
    question,
    semanticCandidates: semanticBaseline.evidence.map((item) => ({
      documentXid: item.documentXid,
      chunkXid: item.chunkXid,
      text: item.text ?? "",
      score: item.score,
      metadata: item.metadata,
    })),
    actor: {
      subjectType: "agent",
      subjectId: "brodie",
    },
    minAuthorityTier: "standard",
  });

  const activeDecision = decideLimitedActiveRouting({
    question,
    enableOutageImpactActive:
      String(process.env.ENABLE_OUTAGE_IMPACT_ACTIVE ?? "false") === "true",
    rollbackEnabled:
      String(process.env.ENTITY_MEMORY_ROLLBACK_ENABLED ?? "true") === "true",
  });

  const returnedAnswer =
    activeDecision.active && activeDecision.chosenPath === "hybrid"
      ? result.hybrid.answer
      : semanticBaseline.answer;

  await writeShadowAudit({
    tenantId: "tenant_default",
    queryClass: activeDecision.queryClass,
    question,
    semanticJson: result.semantic as unknown as Record<string, unknown>,
    hybridJson: result.hybrid as unknown as Record<string, unknown>,
    comparisonJson: result.comparison as unknown as Record<string, unknown>,
    chosenPath: activeDecision.chosenPath,
    rollbackState:
      String(process.env.ENTITY_MEMORY_ROLLBACK_ENABLED ?? "true") === "true"
        ? "enabled"
        : "disabled",
  });

  console.log(
    JSON.stringify(
      {
        route,
        semanticBaseline,
        shadowComparison: result,
        activeDecision,
        returnedAnswer,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});