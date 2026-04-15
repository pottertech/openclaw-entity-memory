import { AclRepository } from "../db/postgres/repositories/acl-repository.js";

export class AclService {
  constructor(private readonly aclRepository: AclRepository) {}

  async canReadEntity(input: {
    tenantId: string;
    subjectType?: string;
    subjectId?: string;
    entityXid: string;
  }): Promise<boolean> {
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