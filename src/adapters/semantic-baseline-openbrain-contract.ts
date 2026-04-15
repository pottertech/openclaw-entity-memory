export type OpenBrainSemanticBaselineRequest = {
  tenantId: string;
  question: string;
  actor?: {
    subjectType?: string;
    subjectId?: string;
  };
  maxCandidates?: number;
  asOf?: string;
};

export type OpenBrainSemanticBaselineResponse = {
  answer: string;
  confidence: "low" | "medium" | "high";
  evidence: Array<{
    documentXid?: string;
    chunkXid?: string;
    text?: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>;
  notes?: string[];
};

export type OpenBrainSemanticBaselineProvider = {
  query(
    input: OpenBrainSemanticBaselineRequest,
  ): Promise<OpenBrainSemanticBaselineResponse>;
};
