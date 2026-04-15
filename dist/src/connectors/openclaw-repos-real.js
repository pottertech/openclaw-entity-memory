export class OpenClawReposRealAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async listRepoServiceMappings() {
        const response = await fetch(`${this.config.baseUrl}${this.config.reposPath}`, {
            headers: {
                ...(this.config.apiKey
                    ? { Authorization: `Bearer ${this.config.apiKey}` }
                    : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`repos source failed: ${response.status} ${await response.text()}`);
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
