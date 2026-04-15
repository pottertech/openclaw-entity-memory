import fs from "node:fs/promises";
import path from "node:path";

type SourceCase = {
  name: string;
  question: string;
  expectedAnswer: string;
  semanticCandidates: Array<{
    text: string;
    documentXid?: string;
    chunkXid?: string;
    score?: number;
  }>;
};

async function main(): Promise<void> {
  const outputFile =
    process.env.GENERATED_FIXTURE_FILE ??
    "tests/fixtures/generated-benchmark-cases.json";

  const seedCases: SourceCase[] = [
    {
      name: "incident-project-impact",
      question: "Was Alice's project affected by Tuesday's outage?",
      expectedAnswer: "Yes",
      semanticCandidates: [
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
      ],
    },
    {
      name: "repo-service-dependency",
      question: "Does auth-repo implement Auth Service?",
      expectedAnswer: "Yes",
      semanticCandidates: [
        {
          text: "auth-repo implements Auth Service",
          documentXid: "doc_auth_2",
          chunkXid: "chk_auth_9",
          score: 0.95,
        },
      ],
    },
  ];

  const outPath = path.resolve(process.cwd(), outputFile);
  await fs.writeFile(outPath, JSON.stringify(seedCases, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputFile,
        count: seedCases.length,
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
