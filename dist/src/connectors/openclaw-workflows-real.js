export class OpenClawWorkflowsRealAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async listWorkflowDependencies() {
        const response = await fetch(`${this.config.baseUrl}${this.config.workflowsPath}`, {
            headers: {
                ...(this.config.apiKey
                    ? { Authorization: `Bearer ${this.config.apiKey}` }
                    : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`workflows source failed: ${response.status} ${await response.text()}`);
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
