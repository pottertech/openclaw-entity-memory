import type pg from "pg";

export class QueryAuditRepository {
  constructor(private readonly pool: pg.Pool) {}

  async insert(record: {
    xid: string;
    tenantId: string;
    queryType: string;
    queryText?: string | null;
    requestJson: Record<string, unknown>;
    responseJson: Record<string, unknown>;
    status: "ok" | "error";
    durationMs?: number | null;
  }): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO query_audit (
        xid, tenant_id, query_type, query_text, request_json,
        response_json, status, duration_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        record.xid,
        record.tenantId,
        record.queryType,
        record.queryText ?? null,
        record.requestJson,
        record.responseJson,
        record.status,
        record.durationMs ?? null,
      ],
    );
  }
}