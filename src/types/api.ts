export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: string;
  detail?: unknown;
};

export type AuthorityTier = "low" | "standard" | "high" | "critical";

export type IngestEntityInput = {
  xid: string;
  tenantId: string;
  entityType:
    | "Agent"
    | "User"
    | "Team"
    | "Project"
    | "Repository"
    | "Service"
    | "Workflow"
    | "Document"
    | "Incident"
    | "Datastore";
  canonicalName: string;
  status?: string;
  metadata?: Record<string, unknown>;
  aliases?: Array<{
    xid: string;
    alias: string;
    aliasType?: string;
  }>;
};

export type IngestEdgeAclInput = {
  xid: string;
  subjectType: string;
  subjectId: string;
  permission: string;
  effect: "allow" | "deny";
};

export type IngestEdgeInput = {
  xid: string;
  tenantId: string;
  edgeType:
    | "LEADS"
    | "BELONGS_TO"
    | "OWNS"
    | "DEPENDS_ON"
    | "USES"
    | "IMPLEMENTS"
    | "GOVERNED_BY"
    | "AFFECTED_BY"
    | "ASSIGNED_TO"
    | "GENERATED_FROM"
    | "SUPERSEDES"
    | "RELATED_TO";
  fromEntityXid: string;
  toEntityXid: string;
  confidence?: number;
  validFrom?: string | null;
  validTo?: string | null;
  metadata?: Record<string, unknown>;
  authorityTier?: AuthorityTier;
  conflictKey?: string | null;
  supersededByEdgeXid?: string | null;
  conflictStatus?: "active" | "superseded" | "conflicted" | "inactive";
  lastObservedAt?: string | null;
  acl?: IngestEdgeAclInput[];
  evidence: Array<{
    xid: string;
    sourceRef: string;
    documentXid?: string | null;
    chunkXid?: string | null;
    evidenceSpan?: Record<string, unknown>;
    confidence?: number;
    authorityTier?: AuthorityTier;
  }>;
};