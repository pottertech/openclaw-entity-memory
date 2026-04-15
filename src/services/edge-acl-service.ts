import { EdgeAclRepository } from "../db/postgres/repositories/edge-acl-repository.js";

export class EdgeAclService {
  constructor(private readonly repository: EdgeAclRepository) {}

  async canTraverseEdge(input: {
    tenantId: string;
    edgeXid: string;
    actor?: {
      subjectType?: string;
      subjectId?: string;
    };
  }): Promise<{
    allowed: boolean;
    reason: string | null;
  }> {
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