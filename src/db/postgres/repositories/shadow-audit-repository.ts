import type pg from "pg";

export class ShadowAuditRepository {
  constructor(private readonly pool: pg.Pool) {}

  async insert(input: {
    xid: string;
    tenantId: string;
    queryClass: string;
    question: string;
    semanticJson: Record<string, unknown>;
    hybridJson: Record<string, unknown>;
    comparisonJson: Record<string, unknown>;
    chosenPath: string;
    rollbackState: string;
  }): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO shadow_audit (
        xid, tenant_id, query_class, question,
        semantic_json, hybrid_json, comparison_json,
        chosen_path, rollback_state
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        input.xid,
        input.tenantId,
        input.queryClass,
        input.question,
        input.semanticJson,
        input.hybridJson,
        input.comparisonJson,
        input.chosenPath,
        input.rollbackState,
      ],
    );
  }
}