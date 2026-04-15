export class OpenClawOwnersAdapter {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async listOwnerProjectMappings() {
        const response = await fetch(`${this.baseUrl}/owners/project-mappings`, {
            headers: {
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`owner adapter failed: ${response.status} ${await response.text()}`);
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
