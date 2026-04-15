import type pg from "pg";

export class DocumentAclService {
  constructor(private readonly pool: pg.Pool) {}

  async canReadDocument(input: {
    tenantId: string;
    documentXid: string | null;
    actor?: {
      subjectType?: string;
      subjectId?: string;
    };
  }): Promise<boolean> {
    if (!input.documentXid) {
      return true;
    }

    if (!input.actor?.subjectType || !input.actor?.subjectId) {
      return true;
    }

    const deny = await this.pool.query(
      `
      SELECT 1
      FROM document_acl_bindings
      WHERE tenant_id = $1
        AND document_xid = $2
        AND subject_type = $3
        AND subject_id = $4
        AND permission = 'read'
        AND effect = 'deny'
      LIMIT 1
      `,
      [
        input.tenantId,
        input.documentXid,
        input.actor.subjectType,
        input.actor.subjectId,
      ],
    );

    if (deny.rowCount && deny.rowCount > 0) {
      return false;
    }

    const allow = await this.pool.query(
      `
      SELECT 1
      FROM document_acl_bindings
      WHERE tenant_id = $1
        AND document_xid = $2
        AND subject_type = $3
        AND subject_id = $4
        AND permission = 'read'
        AND effect = 'allow'
      LIMIT 1
      `,
      [
        input.tenantId,
        input.documentXid,
        input.actor.subjectType,
        input.actor.subjectId,
      ],
    );

    return (allow.rowCount ?? 0) > 0;
  }
}