import fs from "node:fs/promises";
import path from "node:path";
import { OpenBrainHttpEntityMemoryClient } from "../src/adapters/openbrain-http-client.js";
import { SemanticBaselineHttpClient } from "../src/adapters/semantic-baseline-http-client.js";
import { OpenBrainShadowRunner } from "../src/adapters/openbrain-shadow-runner.js";

type PromotionCase = {
  name: string;
  question: string;
  expectedAnswer: string;
  semanticCandidates: Array<{
    text: string;
    documentXid?: string;
    chunkXid?: string;
  }>;
};

async function loadCases(): Promise<PromotionCase[]> {
  const filePath = path.resolve(
    process.cwd(),
    "tests/fixtures/promotion-cases.json",
  );
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as PromotionCase[];
}

async function main(): Promise<void> {
  const entityBaseUrl =
    process.env.ENTITY_MEMORY_BASE_URL ?? "http://localhost:4017";
  const semanticBaseUrl =
    process.env.SEMANTIC_BASELINE_BASE_URL ?? "http://localhost:4020";

  const hybridClient = new OpenBrainHttpEntityMemoryClient(entityBaseUrl);
  const semanticClient = new SemanticBaselineHttpClient(semanticBaseUrl);
  const runner = new OpenBrainShadowRunner(semanticClient, hybridClient);

  const cases = await loadCases();
  const rows: Record<string, unknown>[] = [];

  for (const caseDef of cases) {
    try {
      const result = await runner.run({
        tenantId: "tenant_default",
        question: caseDef.question,
        semanticCandidates: caseDef.semanticCandidates,
        actor: {
          subjectType: "agent",
          subjectId: "brodie",
        },
        minAuthorityTier: "standard",
      });

      rows.push({
        name: caseDef.name,
        expectedAnswer: caseDef.expectedAnswer,
        semanticAnswer: result.semantic.answer,
        hybridAnswer: result.hybrid.answer,
        semanticConfidence: result.semantic.confidence,
        hybridConfidence: result.hybrid.confidence,
        hybridPathLength: result.hybrid.pathLength,
        semanticEvidenceCount: result.semantic.evidenceCount,
        hybridEvidenceCount: result.hybrid.evidenceCount,
        hybridExclusionCount: result.hybrid.exclusionCount,
        semanticCorrect:
          result.semantic.answer === caseDef.expectedAnswer,
        hybridCorrect: result.hybrid.answer === caseDef.expectedAnswer,
      });
    } catch (error) {
      rows.push({
        name: caseDef.name,
        expectedAnswer: caseDef.expectedAnswer,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(JSON.stringify({ promotionReport: rows }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});