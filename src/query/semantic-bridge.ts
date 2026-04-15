export type SemanticCandidate = {
  documentXid?: string;
  chunkXid?: string;
  text: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

export interface SemanticBridge {
  normalizeCandidates(input: SemanticCandidate[]): SemanticCandidate[];
}

export class DefaultSemanticBridge implements SemanticBridge {
  normalizeCandidates(input: SemanticCandidate[]): SemanticCandidate[] {
    return input
      .filter((item) => item.text.trim().length > 0)
      .map((item) => ({
        ...item,
        text: item.text.trim(),
        score: item.score ?? 0.5,
        metadata: item.metadata ?? {},
      }));
  }
}