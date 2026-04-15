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
    const thresholds = await fetchJson(`/shadow-report/thresholds?tenant_id=${tenantId}&query_class=outage_impact`);
    const sourceHealth = await fetchJson(`/source-health/case-pack`);
    const checks = [
        {
            name: "case pack healthy",
            pass: sourceHealth?.ok === true,
        },
        {
            name: "enough reviewed cases",
            pass: Number(thresholds?.total ?? 0) >= 10,
        },
        {
            name: "same-answer threshold met",
            pass: Number(thresholds?.sameAnswerRate ?? 0) >= 0.8,
        },
        {
            name: "hybrid preference threshold met",
            pass: Number(thresholds?.hybridPreferenceRate ?? 0) >= 0.6,
        },
    ];
    const allPass = checks.every((item) => item.pass);
    console.log(JSON.stringify({
        allPass,
        checks,
    }, null, 2));
    if (!allPass) {
        process.exit(1);
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
