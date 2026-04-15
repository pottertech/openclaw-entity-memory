export class AuthorityRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getRankForTier(tierName) {
        const result = await this.pool.query(`
      SELECT xid, tier_name, rank_value, description, created_at
      FROM authority_tiers
      WHERE tier_name = $1
      LIMIT 1
      `, [tierName]);
        if (!result.rowCount) {
            return null;
        }
        return result.rows[0].rank_value;
    }
    async listTiers() {
        const result = await this.pool.query(`
      SELECT xid, tier_name, rank_value, description, created_at
      FROM authority_tiers
      ORDER BY rank_value ASC
      `);
        return result.rows.map((row) => ({
            xid: row.xid,
            tierName: row.tier_name,
            rankValue: row.rank_value,
            description: row.description,
            createdAt: row.created_at.toISOString(),
        }));
    }
}
