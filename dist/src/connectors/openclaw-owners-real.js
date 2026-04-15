export class OpenClawOwnersRealAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async listOwnerProjectMappings() {
        const response = await fetch(`${this.config.baseUrl}${this.config.ownersPath}`, {
            headers: {
                ...(this.config.apiKey
                    ? { Authorization: `Bearer ${this.config.apiKey}` }
                    : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`owners source failed: ${response.status} ${await response.text()}`);
        }
        const json = await response.json();
        return Array.isArray(json?.mappings)
            ? json.mappings.map((item) => ({
                ownerName: String(item.ownerName),
                projectName: String(item.projectName),
                sourceRef: String(item.sourceRef ?? "openclaw:owners"),
                observedAt: item.observedAt ? String(item.observedAt) : undefined,
            }))
            : [];
    }
}
