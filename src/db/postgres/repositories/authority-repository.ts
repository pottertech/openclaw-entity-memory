import type pg from "pg";

type AuthorityTierRow = {
  tier: string;
  rank: number;
  description: string;
};

export class AuthorityRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getRankForTier(tierName: string): Promise<number | null> {
    const result = await this.pool.query<AuthorityTierRow>(
      `
      SELECT tier, rank, description
      FROM authority_tiers
      WHERE tier = $1
      LIMIT 1
      `,
      [tierName],
    );

    if (!result.rowCount) {
      return null;
    }

    return result.rows[0].rank;
  }

  async listTiers(): Promise<
    Array<{
      tier: string;
      rank: number;
      description: string;
    }>
  > {
    const result = await this.pool.query<AuthorityTierRow>(
      `
      SELECT tier, rank, description
      FROM authority_tiers
      ORDER BY rank ASC
      `,
    );

    return result.rows.map((row) => ({
      tier: row.tier,
      rank: row.rank,
      description: row.description,
    }));
  }
}