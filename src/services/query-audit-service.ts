import { QueryAuditRepository } from "../db/postgres/repositories/query-audit-repository.js";

export class QueryAuditService {
  constructor(private readonly repository: QueryAuditRepository) {}

  async record(input: {
    tenantId: string;
    queryType: string;
    queryText?: string | null;
    requestJson: Record<string, unknown>;
    responseJson: Record<string, unknown>;
    status: "ok" | "error";
    durationMs?: number | null;
  }): Promise<void> {
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