export type IncidentRecord = {
  incidentName: string;
  affectedSystem: string;
  affectedProjects: string[];
  owners: string[];
  sourceRef: string;
  observedAt?: string;
};

export type RepoServiceRecord = {
  repoName: string;
  serviceName: string;
  sourceRef: string;
  observedAt?: string;
};

export type WorkflowDependencyRecord = {
  workflowName: string;
  dependsOn: string;
  sourceRef: string;
  observedAt?: string;
};

export type OwnerProjectRecord = {
  ownerName: string;
  projectName: string;
  sourceRef: string;
  observedAt?: string;
};

export interface IncidentsSource {
  listRecentIncidents(): Promise<IncidentRecord[]>;
}

export interface ReposSource {
  listRepoServiceMappings(): Promise<RepoServiceRecord[]>;
}

export interface WorkflowsSource {
  listWorkflowDependencies(): Promise<WorkflowDependencyRecord[]>;
}

export interface OwnersSource {
  listOwnerProjectMappings(): Promise<OwnerProjectRecord[]>;
}