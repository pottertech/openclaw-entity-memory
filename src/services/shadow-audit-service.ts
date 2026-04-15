import { ShadowAuditRepository } from "../db/postgres/repositories/shadow-audit-repository.js";

export class ShadowAuditService {
  constructor(private readonly repository: ShadowAuditRepository) {}

  async record(input: {
    tenantId: string;
    queryClass: string;
    question: string;
    semanticJson: Record<string, unknown>;
    hybridJson: Record<string, unknown>;
    comparisonJson: Record<string, unknown>;
    chosenPath: string;
    rollbackState: string;
  }): Promise<void> {
    await this.repository.insert({
      xid: `sha_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: input.tenantId,
      queryClass: input.queryClass,
      question: input.question,
      semanticJson: input.semanticJson,
      hybridJson: input.hybridJson,
      comparisonJson: input.comparisonJson,
      chosenPath: input.chosenPath,
      rollbackState: input.rollbackState,
    });
  }
}