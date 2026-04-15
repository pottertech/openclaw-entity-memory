export type OpenBrainHybridQueryRequest = {
  tenantId: string;
  question: string;
  semanticCandidates: Array<{
    documentXid?: string;
    chunkXid?: string;
    text: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  actor?: {
    subjectType?: string;
    subjectId?: string;
  };
  asOf?: string;
  minAuthorityTier?: "low" | "standard" | "high" | "critical";
};

export type OpenBrainHybridQueryResponse = {
  answer: string;
  confidence: "low" | "medium" | "high";
  entities: Array<{
    xid: string;
    entityType: string;
    canonicalName: string;
  }>;
  path: Array<{
    from: string;
    edge: string;
    to: string;
  }>;
  evidence: Array<{
    edgeXid: string;
    documentXid: string | null;
    chunkXid: string | null;
  }>;
  filtersApplied: Record<string, unknown>;
  explanation: {
    exclusions: Array<{
      kind: "edge" | "entity" | "path" | "document" | "evidence";
      id: string;
      reason:
        | "entity_acl_denied"
        | "edge_acl_deny"
        | "document_acl_denied"
        | "authority_below_threshold"
        | "temporal_window_excluded"
        | "conflict_loser"
        | "missing_entity"
        | "missing_evidence"
        | "unknown";
      detail?: string;
    }>;
  };
};

export type OpenBrainEntityMemoryClient = {
  hybridQuery(
    input: OpenBrainHybridQueryRequest,
  ): Promise<OpenBrainHybridQueryResponse>;
};