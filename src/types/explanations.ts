export type ExcludedPathReason =
  | "entity_acl_denied"
  | "edge_acl_deny"
  | "document_acl_denied"
  | "authority_below_threshold"
  | "temporal_window_excluded"
  | "conflict_loser"
  | "missing_entity"
  | "missing_evidence"
  | "unknown";

export type QueryExclusion = {
  kind: "edge" | "entity" | "path" | "document" | "evidence";
  id: string;
  reason: ExcludedPathReason;
  detail?: string;
};

export type QueryExplanation = {
  exclusions: QueryExclusion[];
};