export class OpenClawReposAdapter {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async listRepoServiceMappings() {
        const response = await fetch(`${this.baseUrl}/repos/service-mappings`, {
            headers: {
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`repo adapter failed: ${response.status} ${await response.text()}`);
        }
        const json = await response.json();
        return Array.isArray(json?.mappings)
            ? json.mappings.map((item) => ({
                repoName: String(item.repoName),
                serviceName: String(item.serviceName),
                sourceRef: String(item.sourceRef ?? "openclaw:repos"),
                observedAt: item.observedAt ? String(item.observedAt) : undefined,
            }))
            : [];
    }
}
