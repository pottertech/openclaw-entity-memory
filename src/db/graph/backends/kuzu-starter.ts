export type KuzuStarterConfig = {
  dbPath: string;
};

export class KuzuStarter {
  constructor(private readonly config: KuzuStarterConfig) {}

  describeSetup(): {
    dbPath: string;
    nextSteps: string[];
  } {
    return {
      dbPath: this.config.dbPath,
      nextSteps: [
        "Install Kuzu runtime and Node bindings",
        "Create node tables for entity types",
        "Create relationship tables for edge types",
        "Implement load() to upsert nodes and edges",
        "Implement neighbors() using Kuzu queries",
        "Implement findPath() with bounded traversal",
        "Implement findTopPaths() with weighted ranking",
      ],
    };
  }
}