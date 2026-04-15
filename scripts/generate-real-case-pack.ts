import fs from "node:fs/promises";
import path from "node:path";

type IncidentInput = {
  incidentName: string;
  affectedSystem: string;
  affectedProjects: string[];
  owners: string[];
};

type RepoInput = {
  repoName: string;
  serviceName: string;
};

type WorkflowInput = {
  workflowName: string;
  dependsOn: string;
};

type GeneratedCase = {
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

function buildIncidentCases(inputs: IncidentInput[]): GeneratedCase[] {
  const cases: GeneratedCase[] = [];

  for (const input of inputs) {
    for (const project of input.affectedProjects) {
      cases.push({
        name: `incident-${input.incidentName}-${project}`.replace(/\s+/g, "-").toLowerCase(),
        question: `Was ${project} affected by ${input.incidentName}?`,
        expectedAnswer: "Yes",
        semanticCandidates: [
          { text: `${project} depends on ${input.affectedSystem}`, score: 0.95 },
          { text: `${input.affectedSystem} was affected by ${input.incidentName}`, score: 0.94 },
        ],
      });
    }

    for (const owner of input.owners) {
      const project = input.affectedProjects[0];
      if (!project) {
        continue;
      }

      cases.push({
        name: `owner-incident-${owner}-${input.incidentName}`.replace(/\s+/g, "-").toLowerCase(),
        question: `Was ${owner}'s project affected by ${input.incidentName}?`,
        expectedAnswer: "Yes",
        semanticCandidates: [
          { text: `${owner} leads ${project}`, score: 0.96 },
          { text: `${project} depends on ${input.affectedSystem}`, score: 0.95 },
          { text: `${input.affectedSystem} was affected by ${input.incidentName}`, score: 0.94 },
        ],
      });
    }
  }

  return cases;
}

function buildRepoCases(inputs: RepoInput[]): GeneratedCase[] {
  return inputs.map((input) => ({
    name: `repo-service-${input.repoName}`.toLowerCase(),
    question: `Does ${input.repoName} implement ${input.serviceName}?`,
    expectedAnswer: "Yes",
    semanticCandidates: [
      { text: `${input.repoName} implements ${input.serviceName}`, score: 0.95 },
    ],
  }));
}

function buildWorkflowCases(inputs: WorkflowInput[]): GeneratedCase[] {
  return inputs.map((input) => ({
    name: `workflow-dependency-${input.workflowName}`.replace(/\s+/g, "-").toLowerCase(),
    question: `Does ${input.workflowName} depend on ${input.dependsOn}?`,
    expectedAnswer: "Yes",
    semanticCandidates: [
      { text: `${input.workflowName} depends on ${input.dependsOn}`, score: 0.94 },
    ],
  }));
}

async function main(): Promise<void> {
  const outputFile =
    process.env.REAL_CASE_PACK_FILE ??
    "tests/fixtures/generated-real-case-pack.json";

  const incidents: IncidentInput[] = [
    {
      incidentName: "Tuesday Outage",
      affectedSystem: "PostgreSQL Cluster",
      affectedProjects: ["Project Atlas"],
      owners: ["Alice"],
    },
  ];

  const repos: RepoInput[] = [
    { repoName: "auth-repo", serviceName: "Auth Service" },
  ];

  const workflows: WorkflowInput[] = [
    { workflowName: "Order Workflow", dependsOn: "Auth Service" },
  ];

  const generated = [
    ...buildIncidentCases(incidents),
    ...buildRepoCases(repos),
    ...buildWorkflowCases(workflows),
  ];

  const fullPath = path.resolve(process.cwd(), outputFile);
  await fs.writeFile(fullPath, JSON.stringify(generated, null, 2), "utf8");

  console.log(
    JSON.stringify({ ok: true, outputFile, count: generated.length }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});