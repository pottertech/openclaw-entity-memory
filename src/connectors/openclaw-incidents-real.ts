import type { IncidentRecord, IncidentsSource } from "./contracts.js";
import type { OpenClawSourceConfig } from "./openclaw-source-config.js";

export class OpenClawIncidentsRealAdapter implements IncidentsSource {
  constructor(private readonly config: OpenClawSourceConfig) {}

  async listRecentIncidents(): Promise<IncidentRecord[]> {
    const response = await fetch(
      `${this.config.baseUrl}${this.config.incidentsPath}`,
      {
        headers: {
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `incidents source failed: ${response.status} ${await response.text()}`,
      );
    }

    const json = await response.json();

    return Array.isArray(json?.incidents)
      ? json.incidents.map((item: any) => ({
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