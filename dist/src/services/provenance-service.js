export class ProvenanceService {
    repository;
    documentAclService;
    constructor(repository, documentAclService) {
        this.repository = repository;
        this.documentAclService = documentAclService;
    }
    async getVisibleEdgeProvenance(input) {
        const rows = await this.repository.getEdgeProvenance(input.tenantId, input.edgeXid);
        const visible = [];
        const exclusions = [];
        for (const row of rows) {
            const allowed = await this.documentAclService.canReadDocument({
                tenantId: input.tenantId,
                documentXid: row.documentXid,
                actor: input.actor,
            });
            if (!allowed) {
                exclusions.push({
                    kind: "document",
                    id: row.documentXid ?? "unknown_document",
                    reason: "document_acl_denied",
                });
                continue;
            }
            visible.push(row);
        }
        return {
            provenance: visible,
            exclusions,
        };
    }
    async getEntityNeighborhood(input) {
        return this.repository.getEntityNeighborhood(input.tenantId, input.entityXid);
    }
}
