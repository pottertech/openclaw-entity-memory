import fs from "node:fs/promises";
import path from "node:path";
import { OpenBrainHttpEntityMemoryClient } from "../src/adapters/openbrain-http-client.js";
import { SemanticBaselineHttpClient } from "../src/adapters/semantic-baseline-http-client.js";
import { OpenBrainShadowRunner } from "../src/adapters/openbrain-shadow-runner.js";

type BenchmarkCase = {
  name: string;
  question: string;
  expectedAnswer: string;
  semanticCandidates: Array<{
    text: string;
    documentXid?: string;
    chunkXid?: string;
  }>;
};

async function loadCases(): Promise<BenchmarkCase[]> {
  const fileName =
    process.env.BENCHMARK_CASES_FILE ?? "tests/fixtures/benchmark-cases.json";

  const filePath = path.resolve(process.cwd(), fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as BenchmarkCase[];
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
  const rows = [];

  for (const caseDef of cases) {
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
      question: caseDef.question,
      expectedAnswer: caseDef.expectedAnswer,
      semanticAnswer: result.semantic.answer,
      hybridAnswer: result.hybrid.answer,
      semanticConfidence: result.semantic.confidence,
      hybridConfidence: result.hybrid.confidence,
      semanticEvidenceCount: result.semantic.evidenceCount,
      hybridEvidenceCount: result.hybrid.evidenceCount,
      hybridPathLength: result.hybrid.pathLength,
      hybridExclusionCount: result.hybrid.exclusionCount,
      semanticCorrect:
        result.semantic.answer === caseDef.expectedAnswer,
      hybridCorrect: result.hybrid.answer === caseDef.expectedAnswer,
    });
  }

  console.log(JSON.stringify({ benchmark: rows }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});