import type { WorkflowDependencyRecord, WorkflowsSource } from "./contracts.js";

export class OpenClawWorkflowsAdapter implements WorkflowsSource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  async listWorkflowDependencies(): Promise<WorkflowDependencyRecord[]> {
    const response = await fetch(`${this.baseUrl}/workflows/dependencies`, {
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `workflow adapter failed: ${response.status} ${await response.text()}`,
      );
    }

    const json = await response.json();

    return Array.isArray(json?.dependencies)
      ? json.dependencies.map((item: any) => ({
          workflowName: String(item.workflowName),
          dependsOn: String(item.dependsOn),
          sourceRef: String(item.sourceRef ?? "openclaw:workflows"),
          observedAt: item.observedAt ? String(item.observedAt) : undefined,
        }))
      : [];
  }
}