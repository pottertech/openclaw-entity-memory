export class OpenClawWorkflowsAdapter {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async listWorkflowDependencies() {
        const response = await fetch(`${this.baseUrl}/workflows/dependencies`, {
            headers: {
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`workflow adapter failed: ${response.status} ${await response.text()}`);
        }
        const json = await response.json();
        return Array.isArray(json?.dependencies)
            ? json.dependencies.map((item) => ({
                workflowName: String(item.workflowName),
                dependsOn: String(item.dependsOn),
                sourceRef: String(item.sourceRef ?? "openclaw:workflows"),
                observedAt: item.observedAt ? String(item.observedAt) : undefined,
            }))
            : [];
    }
}
