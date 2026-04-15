export class StaticIncidentsSource {
    async listRecentIncidents() {
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
