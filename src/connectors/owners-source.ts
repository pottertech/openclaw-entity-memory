export type OwnerProjectRecord = {
  ownerName: string;
  projectName: string;
  sourceRef: string;
};

export interface OwnersSource {
  listOwnerProjectMappings(): Promise<OwnerProjectRecord[]>;
}

export class StaticOwnersSource implements OwnersSource {
  async listOwnerProjectMappings(): Promise<OwnerProjectRecord[]> {
    return [
      {
        ownerName: "Alice",
        projectName: "Project Atlas",
        sourceRef: "static:owner:alice-atlas",
      },
    ];
  }
}