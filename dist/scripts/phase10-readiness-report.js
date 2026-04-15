import { loadConfig } from "../src/config/index.js";
const config = loadConfig();
const baseUrl = `http://localhost:${config.port}/v1`;
async function fetchJson(path) {
    const response = await fetch(`${baseUrl}${path}`);
    if (!response.ok) {
        throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
}
async function main() {
    const tenantId = process.env.PHASE10_TENANT_ID ?? "tenant_default";
    const [sourceHealth, dashboard, thresholds, verdicts, shadowSummary,] = await Promise.all([
        fetchJson(`/source-health/case-pack`),
        fetchJson(`/canary-dashboard/outage-impact?tenant_id=${tenantId}`),
        fetchJson(`/shadow-report/thresholds?tenant_id=${tenantId}&query_class=outage_impact`),
        fetchJson(`/shadow-report/verdicts?tenant_id=${tenantId}&query_class=outage_impact`),
        fetchJson(`/shadow-audit/summary?tenant_id=${tenantId}`),
    ]);
    console.log(JSON.stringify({
        tenantId,
        sourceHealth,
        dashboard,
        thresholds,
        verdicts,
        shadowSummary,
    }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
