export const EDGE_TYPES = [
  "LEADS",
  "BELONGS_TO",
  "OWNS",
  "DEPENDS_ON",
  "USES",
  "IMPLEMENTS",
  "GOVERNS_BY",
  "AFFECTED_BY",
  "ASSIGNED_TO",
  "GENERATED_FROM",
  "SUPERSEDES",
  "RELATED_TO",
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

export type Edge = {
  xid: string;
  tenantId: string;
  edgeType: EdgeType;
  fromEntityXid: string;
  toEntityXid: string;
  confidence: number;
  validFrom: string | null;
  validTo: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type EdgeEvidence = {
  xid: string;
  tenantId: string;
  edgeXid: string;
  sourceRef: string;
  documentXid: string | null;
  chunkXid: string | null;
  evidenceSpan: Record<string, unknown>;
  confidence: number;
  createdAt: string;
};