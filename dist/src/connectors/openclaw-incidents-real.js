export class OpenClawIncidentsRealAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    async listRecentIncidents() {
        const response = await fetch(`${this.config.baseUrl}${this.config.incidentsPath}`, {
            headers: {
                ...(this.config.apiKey
                    ? { Authorization: `Bearer ${this.config.apiKey}` }
                    : {}),
            },
        });
        if (!response.ok) {
            throw new Error(`incidents source failed: ${response.status} ${await response.text()}`);
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
