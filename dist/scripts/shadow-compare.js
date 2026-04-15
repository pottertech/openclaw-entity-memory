import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../src/config/index.js";
function getExclusionCount(hybrid) {
    try {
        const explanation = hybrid.explanation;
        if (!explanation)
            return 0;
        const exclusions = explanation.exclusions;
        if (!Array.isArray(exclusions))
            return 0;
        return exclusions.length;
    }
    catch {
        return 0;
    }
}
async function loadFixtures() {
    const filePath = path.resolve(process.cwd(), "tests/fixtures/shadow-cases.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
}
async function runHybrid(baseUrl, caseDef) {
    const response = await fetch(`${baseUrl}/query/hybrid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tenantId: "tenant_default",
            question: caseDef.question,
            semanticCandidates: caseDef.semanticCandidates,
            actor: {
                subjectType: "agent",
                subjectId: "brodie",
            },
            minAuthorityTier: "standard",
        }),
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return (await response.json());
}
async function main() {
    const config = loadConfig();
    const baseUrl = `http://localhost:${config.port}/v1`;
    const fixtures = await loadFixtures();
    const results = [];
    for (const fixture of fixtures) {
        try {
            const hybrid = await runHybrid(baseUrl, fixture);
            results.push({
                name: fixture.name,
                hybridAnswer: hybrid.answer,
                hybridConfidence: hybrid.confidence,
                hybridPathLength: Array.isArray(hybrid.path)
                    ? hybrid.path.length
                    : 0,
                hybridEvidenceCount: Array.isArray(hybrid.evidence)
                    ? hybrid.evidence.length
                    : 0,
                hybridExclusionCount: getExclusionCount(hybrid),
                expectedAnswer: fixture.expectedAnswer,
            });
        }
        catch (error) {
            results.push({
                name: fixture.name,
                hybridAnswer: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
                hybridConfidence: "low",
                hybridPathLength: 0,
                hybridEvidenceCount: 0,
                hybridExclusionCount: 0,
                expectedAnswer: fixture.expectedAnswer,
            });
        }
    }
    console.log(JSON.stringify({ results }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
