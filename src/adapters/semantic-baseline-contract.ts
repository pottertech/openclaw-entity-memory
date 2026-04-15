export type SemanticBaselineQueryRequest = {
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
};

export type SemanticBaselineQueryResponse = {
  answer: string;
  confidence: "low" | "medium" | "high";
  evidence: Array<{
    documentXid?: string;
    chunkXid?: string;
    text?: string;
  }>;
  notes?: string[];
};

export type SemanticBaselineClient = {
  query(
    input: SemanticBaselineQueryRequest,
  ): Promise<SemanticBaselineQueryResponse>;
};