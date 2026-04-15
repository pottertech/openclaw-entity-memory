import type pg from "pg";

type EdgeAclRow = {
  xid: string;
  tenant_id: string;
  subject_type: string;
  subject_id: string;
  edge_xid: string;
  permission: string;
  effect: "allow" | "deny";
  created_at: Date;
};

export class EdgeAclRepository {
  constructor(private readonly pool: pg.Pool) {}

  async upsertBindings(input: {
    tenantId: string;
    edgeXid: string;
    bindings: Array<{
      xid: string;
      subjectType: string;
      subjectId: string;
      permission: string;
      effect: "allow" | "deny";
    }>;
  }): Promise<void> {
    for (const binding of input.bindings) {
      await this.pool.query(
        `
        INSERT INTO edge_acl_bindings (
          xid, tenant_id, subject_type, subject_id, edge_xid, permission, effect
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (xid) DO UPDATE
        SET
          tenant_id = EXCLUDED.tenant_id,
          subject_type = EXCLUDED.subject_type,
          subject_id = EXCLUDED.subject_id,
          edge_xid = EXCLUDED.edge_xid,
          permission = EXCLUDED.permission,
          effect = EXCLUDED.effect
        `,
        [
          binding.xid,
          input.tenantId,
          binding.subjectType,
          binding.subjectId,
          input.edgeXid,
          binding.permission,
          binding.effect,
        ],
      );
    }
  }

  async listBindingsForActor(input: {
    tenantId: string;
    edgeXid: string;
    subjectType?: string;
    subjectId?: string;
    permission: string;
  }): Promise<EdgeAclRow[]> {
    if (!input.subjectType || !input.subjectId) {
      return [];
    }

    const result = await this.pool.query<EdgeAclRow>(
      `
      SELECT
        xid,
        tenant_id,
        subject_type,
        subject_id,
        edge_xid,
        permission,
        effect,
        created_at
      FROM edge_acl_bindings
      WHERE tenant_id = $1
        AND edge_xid = $2
        AND subject_type = $3
        AND subject_id = $4
        AND permission = $5
      ORDER BY created_at ASC
      `,
      [
        input.tenantId,
        input.edgeXid,
        input.subjectType,
        input.subjectId,
        input.permission,
      ],
    );

    return result.rows;
  }
}