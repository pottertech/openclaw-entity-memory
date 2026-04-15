import type { RepoServiceRecord, ReposSource } from "./contracts.js";

export class OpenClawReposAdapter implements ReposSource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  async listRepoServiceMappings(): Promise<RepoServiceRecord[]> {
    const response = await fetch(`${this.baseUrl}/repos/service-mappings`, {
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `repo adapter failed: ${response.status} ${await response.text()}`,
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