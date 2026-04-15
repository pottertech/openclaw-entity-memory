export type PathQueryRequest = {
  tenantId: string;
  from: { name?: string; xid?: string };
  to: { name?: string; xid?: string };
  maxDepth?: number;
  asOf?: string;
};

export type HybridSemanticCandidate = {
  documentXid?: string;
  chunkXid?: string;
  text: string;
};

export type HybridQueryRequest = {
  tenantId: string;
  question: string;
  semanticCandidates: HybridSemanticCandidate[];
  asOf?: string;
};

export type ImpactQueryRequest = {
  tenantId: string;
  source: { name?: string; xid?: string };
  targetTypes?: string[];
  maxDepth?: number;
  asOf?: string;
};