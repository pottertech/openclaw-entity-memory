import type { OwnerProjectRecord, OwnersSource } from "./contracts.js";

export class OpenClawOwnersAdapter implements OwnersSource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  async listOwnerProjectMappings(): Promise<OwnerProjectRecord[]> {
    const response = await fetch(`${this.baseUrl}/owners/project-mappings`, {
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `owner adapter failed: ${response.status} ${await response.text()}`,
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