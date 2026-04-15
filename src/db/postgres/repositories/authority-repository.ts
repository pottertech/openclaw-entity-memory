import type pg from "pg";

type AuthorityTierRow = {
  xid: string;
  tier_name: string;
  rank_value: number;
  description: string;
  created_at: Date;
};

export class AuthorityRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getRankForTier(tierName: string): Promise<number | null> {
    const result = await this.pool.query<AuthorityTierRow>(
      `
      SELECT xid, tier_name, rank_value, description, created_at
      FROM authority_tiers
      WHERE tier_name = $1
      LIMIT 1
      `,
      [tierName],
    );

    if (!result.rowCount) {
      return null;
    }

    return result.rows[0].rank_value;
  }

  async listTiers(): Promise<
    Array<{
      xid: string;
      tierName: string;
      rankValue: number;
      description: string;
      createdAt: string;
    }>
  > {
    const result = await this.pool.query<AuthorityTierRow>(
      `
      SELECT xid, tier_name, rank_value, description, created_at
      FROM authority_tiers
      ORDER BY rank_value ASC
      `,
    );

    return result.rows.map((row) => ({
      xid: row.xid,
      tierName: row.tier_name,
      rankValue: row.rank_value,
      description: row.description,
      createdAt: row.created_at.toISOString(),
    }));
  }
}