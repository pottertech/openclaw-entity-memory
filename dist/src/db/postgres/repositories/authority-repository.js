export class AuthorityRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getRankForTier(tierName) {
        const result = await this.pool.query(`
      SELECT tier, rank, description
      FROM authority_tiers
      WHERE tier = $1
      LIMIT 1
      `, [tierName]);
        if (!result.rowCount) {
            return null;
        }
        return result.rows[0].rank;
    }
    async listTiers() {
        const result = await this.pool.query(`
      SELECT tier, rank, description
      FROM authority_tiers
      ORDER BY rank ASC
      `);
        return result.rows.map((row) => ({
            tier: row.tier,
            rank: row.rank,
            description: row.description,
        }));
    }
}
