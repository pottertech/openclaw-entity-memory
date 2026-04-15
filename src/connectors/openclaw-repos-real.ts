import type { RepoServiceRecord, ReposSource } from "./contracts.js";
import type { OpenClawSourceConfig } from "./openclaw-source-config.js";

export class OpenClawReposRealAdapter implements ReposSource {
  constructor(private readonly config: OpenClawSourceConfig) {}

  async listRepoServiceMappings(): Promise<RepoServiceRecord[]> {
    const response = await fetch(
      `${this.config.baseUrl}${this.config.reposPath}`,
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
        `repos source failed: ${response.status} ${await response.text()}`,
      );
    }

    const json = await response.json();

    return Array.isArray(json?.mappings)
      ? json.mappings.map((item: any) => ({
          repoName: String(item.repoName),
          serviceName: String(item.serviceName),
          sourceRef: String(item.sourceRef ?? "openclaw:repos"),
          observedAt: item.observedAt ? String(item.observedAt) : undefined,
        }))
      : [];
  }
}