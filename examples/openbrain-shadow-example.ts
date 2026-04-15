import { createOpenBrainEntityMemoryPackage } from "../src/adapters/openbrain-package.js";
import { SemanticBaselineHttpClient } from "../src/adapters/semantic-baseline-http-client.js";
import { OpenBrainShadowRunner } from "../src/adapters/openbrain-shadow-runner.js";
import { classifyRelationshipQuery } from "../src/adapters/orchestrator-routing-contract.js";

type SemanticCandidate = {
  text: string;
  documentXid?: string;
  chunkXid?: string;
  score?: number;
};

type ShadowDecision = {
  shouldShadow: boolean;
  routeConfidence: "low" | "medium" | "high";
  reasons: string[];
};

function decideShadow(question: string): ShadowDecision {
  const routing = classifyRelationshipQuery(question);

  return {
    shouldShadow: routing.shouldUseEntityMemory,
    routeConfidence: routing.confidence,
    reasons: routing.reasons,
  };
}

async function runExample(): Promise<void> {
  const entityMemory = createOpenBrainEntityMemoryPackage({
    baseUrl: process.env.ENTITY_MEMORY_BASE_URL ?? "http://localhost:4017",
  });

  const semanticClient = new SemanticBaselineHttpClient(
    process.env.SEMANTIC_BASELINE_BASE_URL ?? "http://localhost:4020",
  );

  const shadowRunner = new OpenBrainShadowRunner(
    semanticClient,
    entityMemory.client,
  );

  const question = "Was Alice's project affected by Tuesday's outage?";

  const semanticCandidates: SemanticCandidate[] = [
    {
      text: "Alice is the tech lead on Project Atlas",
      documentXid: "doc_1",
      chunkXid: "chk_1",
      score: 0.97,
    },
    {
      text: "Project Atlas uses PostgreSQL for its primary datastore",
      documentXid: "doc_2",
      chunkXid: "chk_8",
      score: 0.94,
    },
    {
      text: "The PostgreSQL cluster went down on Tuesday",
      documentXid: "doc_3",
      chunkXid: "chk_4",
      score: 0.93,
    },
  ];

  const decision = decideShadow(question);

  console.log(JSON.stringify({ decision }, null, 2));

  if (!decision.shouldShadow) {
    console.log("Question not selected for entity-memory shadow run");
    return;
  }

  const result = await shadowRunner.run({
    tenantId: "tenant_default",
    question,
    semanticCandidates,
    actor: {
      subjectType: "agent",
      subjectId: "brodie",
    },
    minAuthorityTier: "standard",
  });

  console.log(JSON.stringify({ shadowResult: result }, null, 2));

  const productionAnswer = result.semantic.answer;

  console.log(
    JSON.stringify(
      {
        productionAnswer,
        shadowHybridAnswer: result.hybrid.answer,
        note: "In shadow mode, semantic answer remains authoritative",
      },
      null,
      2,
    ),
  );
}

runExample().catch((error) => {
  console.error(error);
  process.exit(1);
});
