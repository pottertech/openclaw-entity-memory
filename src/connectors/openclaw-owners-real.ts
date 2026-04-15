import type { OwnerProjectRecord, OwnersSource } from "./contracts.js";
import type { OpenClawSourceConfig } from "./openclaw-source-config.js";

export class OpenClawOwnersRealAdapter implements OwnersSource {
  constructor(private readonly config: OpenClawSourceConfig) {}

  async listOwnerProjectMappings(): Promise<OwnerProjectRecord[]> {
    const response = await fetch(
      `${this.config.baseUrl}${this.config.ownersPath}`,
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
        `owners source failed: ${response.status} ${await response.text()}`,
      );
    }

    const json = await response.json();

    return Array.isArray(json?.mappings)
      ? json.mappings.map((item: any) => ({
          ownerName: String(item.ownerName),
          projectName: String(item.projectName),
          sourceRef: String(item.sourceRef ?? "openclaw:owners"),
          observedAt: item.observedAt ? String(item.observedAt) : undefined,
        }))
      : [];
  }
}