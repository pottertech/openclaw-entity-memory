import { createOpenBrainEntityMemoryPackage } from "../src/adapters/openbrain-package.js";
import { SemanticBaselineHttpClient } from "../src/adapters/semantic-baseline-http-client.js";
import { OpenBrainShadowRunner } from "../src/adapters/openbrain-shadow-runner.js";
import { classifyRelationshipQuery } from "../src/adapters/orchestrator-routing-contract.js";

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

async function getSemanticBaseline(question: string): Promise<SemanticProviderResult> {
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

async function main(): Promise<void> {
  const question = "Was Alice's project affected by Tuesday's outage?";

  const route = classifyRelationshipQuery(question);

  const semanticBaseline = await getSemanticBaseline(question);

  console.log(
    JSON.stringify(
      {
        route,
        semanticBaseline,
      },
      null,
      2,
    ),
  );

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

  console.log(JSON.stringify({ shadowComparison: result }, null, 2));

  console.log(
    JSON.stringify(
      {
        productionAnswer: semanticBaseline.answer,
        shadowHybridAnswer: result.hybrid.answer,
        note: "semantic remains authoritative until limited active gate is approved",
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
