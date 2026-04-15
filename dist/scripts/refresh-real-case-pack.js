import fs from "node:fs/promises";
import path from "node:path";
import { StaticIncidentsSource } from "../src/connectors/incidents-source.js";
import { StaticReposSource } from "../src/connectors/repos-source.js";
import { StaticWorkflowsSource } from "../src/connectors/workflows-source.js";
import { StaticOwnersSource } from "../src/connectors/owners-source.js";
async function main() {
    const outputFile = process.env.REAL_CASE_PACK_FILE ??
        "tests/fixtures/generated-real-case-pack.json";
    const incidentsSource = new StaticIncidentsSource();
    const reposSource = new StaticReposSource();
    const workflowsSource = new StaticWorkflowsSource();
    const ownersSource = new StaticOwnersSource();
    const incidents = await incidentsSource.listRecentIncidents();
    const repos = await reposSource.listRepoServiceMappings();
    const workflows = await workflowsSource.listWorkflowDependencies();
    const owners = await ownersSource.listOwnerProjectMappings();
    const cases = [];
    for (const incident of incidents) {
        for (const project of incident.affectedProjects) {
            cases.push({
                name: `incident-impact-${project}`.replace(/\s+/g, "-").toLowerCase(),
                question: `Was ${project} affected by ${incident.incidentName}?`,
                expectedAnswer: "Yes",
                semanticCandidates: [
                    {
                        text: `${project} depends on ${incident.affectedSystem}`,
                        score: 0.95,
                        metadata: { sourceRef: incident.sourceRef },
                    },
                    {
                        text: `${incident.affectedSystem} was affected by ${incident.incidentName}`,
                        score: 0.94,
                        metadata: { sourceRef: incident.sourceRef },
                    },
                ],
            });
        }
    }
    for (const owner of owners) {
        const incident = incidents[0];
        if (!incident) {
            continue;
        }
        cases.push({
            name: `owner-incident-${owner.ownerName}`.toLowerCase(),
            question: `Was ${owner.ownerName}'s project affected by ${incident.incidentName}?`,
            expectedAnswer: "Yes",
            semanticCandidates: [
                {
                    text: `${owner.ownerName} leads ${owner.projectName}`,
                    score: 0.96,
                    metadata: { sourceRef: owner.sourceRef },
                },
                {
                    text: `${owner.projectName} depends on ${incident.affectedSystem}`,
                    score: 0.95,
                    metadata: { sourceRef: incident.sourceRef },
                },
                {
                    text: `${incident.affectedSystem} was affected by ${incident.incidentName}`,
                    score: 0.94,
                    metadata: { sourceRef: incident.sourceRef },
                },
            ],
        });
    }
    for (const repo of repos) {
        cases.push({
            name: `repo-service-${repo.repoName}`.toLowerCase(),
            question: `Does ${repo.repoName} implement ${repo.serviceName}?`,
            expectedAnswer: "Yes",
            semanticCandidates: [
                {
                    text: `${repo.repoName} implements ${repo.serviceName}`,
                    score: 0.95,
                    metadata: { sourceRef: repo.sourceRef },
                },
            ],
        });
    }
    for (const workflow of workflows) {
        cases.push({
            name: `workflow-dependency-${workflow.workflowName}`.replace(/\s+/g, "-").toLowerCase(),
            question: `Does ${workflow.workflowName} depend on ${workflow.dependsOn}?`,
            expectedAnswer: "Yes",
            semanticCandidates: [
                {
                    text: `${workflow.workflowName} depends on ${workflow.dependsOn}`,
                    score: 0.94,
                    metadata: { sourceRef: workflow.sourceRef },
                },
            ],
        });
    }
    const fullPath = path.resolve(process.cwd(), outputFile);
    await fs.writeFile(fullPath, JSON.stringify(cases, null, 2), "utf8");
    console.log(JSON.stringify({ ok: true, outputFile, count: cases.length }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
