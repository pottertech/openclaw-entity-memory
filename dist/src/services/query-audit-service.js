export class QueryAuditService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async record(input) {
        await this.repository.insert({
            xid: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            tenantId: input.tenantId,
            queryType: input.queryType,
            queryText: input.queryText ?? null,
            requestJson: input.requestJson,
            responseJson: input.responseJson,
            status: input.status,
            durationMs: input.durationMs ?? null,
        });
    }
}
