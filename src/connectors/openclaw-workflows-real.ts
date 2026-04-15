import type {
  WorkflowDependencyRecord,
  WorkflowsSource,
} from "./contracts.js";
import type { OpenClawSourceConfig } from "./openclaw-source-config.js";

export class OpenClawWorkflowsRealAdapter implements WorkflowsSource {
  constructor(private readonly config: OpenClawSourceConfig) {}

  async listWorkflowDependencies(): Promise<WorkflowDependencyRecord[]> {
    const response = await fetch(
      `${this.config.baseUrl}${this.config.workflowsPath}`,
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
        `workflows source failed: ${response.status} ${await response.text()}`,
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