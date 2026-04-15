export class EdgeAclService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async canTraverseEdge(input) {
        if (!input.actor?.subjectType || !input.actor?.subjectId) {
            return {
                allowed: true,
                reason: null,
            };
        }
        const bindings = await this.repository.listBindingsForActor({
            tenantId: input.tenantId,
            edgeXid: input.edgeXid,
            subjectType: input.actor.subjectType,
            subjectId: input.actor.subjectId,
            permission: "read",
        });
        if (bindings.some((item) => item.effect === "deny")) {
            return {
                allowed: false,
                reason: "edge_acl_deny",
            };
        }
        if (bindings.some((item) => item.effect === "allow")) {
            return {
                allowed: true,
                reason: null,
            };
        }
        return {
            allowed: true,
            reason: null,
        };
    }
}
