export type IncidentRecord = {
  incidentName: string;
  affectedSystem: string;
  affectedProjects: string[];
  owners: string[];
  sourceRef: string;
};

export interface IncidentsSource {
  listRecentIncidents(): Promise<IncidentRecord[]>;
}

export class StaticIncidentsSource implements IncidentsSource {
  async listRecentIncidents(): Promise<IncidentRecord[]> {
    return [
      {
        incidentName: "Tuesday Outage",
        affectedSystem: "PostgreSQL Cluster",
        affectedProjects: ["Project Atlas"],
        owners: ["Alice"],
        sourceRef: "static:incident:tuesday-outage",
      },
    ];
  }
}