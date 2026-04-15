export class ShadowAuditService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async record(input) {
        await this.repository.insert({
            xid: `sha_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            tenantId: input.tenantId,
            queryClass: input.queryClass,
            question: input.question,
            semanticJson: input.semanticJson,
            hybridJson: input.hybridJson,
            comparisonJson: input.comparisonJson,
            chosenPath: input.chosenPath,
            rollbackState: input.rollbackState,
        });
    }
}
