export class OpenBrainShadowRunner {
    semanticClient;
    hybridClient;
    constructor(semanticClient, hybridClient) {
        this.semanticClient = semanticClient;
        this.hybridClient = hybridClient;
    }
    async run(input) {
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
                hybridHasMoreEvidence: hybrid.evidence.length > semantic.evidence.length,
            },
        };
    }
}
