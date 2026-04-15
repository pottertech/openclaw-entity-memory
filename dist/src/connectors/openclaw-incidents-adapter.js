export class OpenClawIncidentsAdapter {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async listRecentIncidents() {
        const response = await fetch(`${this.baseUrl}/incidents/recent`, {
            headers: {
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`incident adapter failed: ${response.status} ${await response.text()}`);
        }
        const json = await response.json();
        return Array.isArray(json?.incidents)
            ? json.incidents.map((item) => ({
                incidentName: String(item.incidentName),
                affectedSystem: String(item.affectedSystem),
                affectedProjects: Array.isArray(item.affectedProjects)
                    ? item.affectedProjects.map(String)
                    : [],
                owners: Array.isArray(item.owners) ? item.owners.map(String) : [],
                sourceRef: String(item.sourceRef ?? "openclaw:incidents"),
                observedAt: item.observedAt ? String(item.observedAt) : undefined,
            }))
            : [];
    }
}
