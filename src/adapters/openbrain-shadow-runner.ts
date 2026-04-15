import type {
  OpenBrainEntityMemoryClient,
  OpenBrainHybridQueryRequest,
} from "./openbrain-contract.js";
import type { SemanticBaselineClient } from "./semantic-baseline-contract.js";

export type ShadowComparisonResult = {
  question: string;
  semantic: {
    answer: string;
    confidence: string;
    evidenceCount: number;
  };
  hybrid: {
    answer: string;
    confidence: string;
    pathLength: number;
    evidenceCount: number;
    exclusionCount: number;
  };
  comparison: {
    sameAnswer: boolean;
    hybridHasPath: boolean;
    hybridHasMoreEvidence: boolean;
  };
};

export class OpenBrainShadowRunner {
  constructor(
    private readonly semanticClient: SemanticBaselineClient,
    private readonly hybridClient: OpenBrainEntityMemoryClient,
  ) {}

  async run(
    input: OpenBrainHybridQueryRequest,
  ): Promise<ShadowComparisonResult> {
    const semantic = await this.semanticClient.query({
      tenantId: input.tenantId,
      question: input.question,
      semanticCandidates: input.semanticCandidates,
      actor: input.actor,
    });

    const hybrid = await this.hybridClient.hybridQuery(input);

    return {
      question: input.question,
      semantic: {
        answer: semantic.answer,
        confidence: semantic.confidence,
        evidenceCount: semantic.evidence.length,
      },
      hybrid: {
        answer: hybrid.answer,
        confidence: hybrid.confidence,
        pathLength: hybrid.path.length,
        evidenceCount: hybrid.evidence.length,
        exclusionCount: hybrid.explanation.exclusions.length,
      },
      comparison: {
        sameAnswer: semantic.answer === hybrid.answer,
        hybridHasPath: hybrid.path.length > 0,
        hybridHasMoreEvidence:
          hybrid.evidence.length > semantic.evidence.length,
      },
    };
  }
}