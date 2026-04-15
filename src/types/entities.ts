export const ENTITY_TYPES = [
  "Agent",
  "User",
  "Team",
  "Project",
  "Repository",
  "Service",
  "Workflow",
  "Document",
  "Incident",
  "Datastore",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type Entity = {
  xid: string;
  tenantId: string;
  entityType: EntityType;
  canonicalName: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type EntityResolveResult = {
  match: Pick<Entity, "xid" | "entityType" | "canonicalName">;
  matchedAlias?: string;
  confidence: number;
};