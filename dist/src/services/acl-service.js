export class AclService {
    aclRepository;
    constructor(aclRepository) {
        this.aclRepository = aclRepository;
    }
    async canReadEntity(input) {
        if (!input.subjectType || !input.subjectId) {
            return true;
        }
        const deny = await this.aclRepository.hasAccess({
            tenantId: input.tenantId,
            subjectType: input.subjectType,
            subjectId: input.subjectId,
            resourceType: "entity",
            resourceId: input.entityXid,
            permission: "deny",
        });
        if (deny) {
            return false;
        }
        const allow = await this.aclRepository.hasAccess({
            tenantId: input.tenantId,
            subjectType: input.subjectType,
            subjectId: input.subjectId,
            resourceType: "entity",
            resourceId: input.entityXid,
            permission: "read",
        });
        return allow;
    }
}
