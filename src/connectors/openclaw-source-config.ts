export type OpenClawSourceConfig = {
  baseUrl: string;
  apiKey?: string;
  incidentsPath: string;
  reposPath: string;
  workflowsPath: string;
  ownersPath: string;
};

export function loadOpenClawSourceConfig(): OpenClawSourceConfig {
  return {
    baseUrl: process.env.OPENCLAW_SOURCE_BASE_URL ?? "http://localhost:4030",
    apiKey: process.env.OPENCLAW_SOURCE_API_KEY || undefined,
    incidentsPath:
      process.env.OPENCLAW_INCIDENTS_PATH ?? "/incidents/recent",
    reposPath:
      process.env.OPENCLAW_REPOS_PATH ?? "/repos/service-mappings",
    workflowsPath:
      process.env.OPENCLAW_WORKFLOWS_PATH ?? "/workflows/dependencies",
    ownersPath:
      process.env.OPENCLAW_OWNERS_PATH ?? "/owners/project-mappings",
  };
}