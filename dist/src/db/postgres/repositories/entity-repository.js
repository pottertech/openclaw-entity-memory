function mapEntityRow(row) {
    return {
        xid: row.xid,
        tenantId: row.tenant_id,
        entityType: row.entity_type,
        canonicalName: row.canonical_name,
        status: row.status,
        metadata: row.metadata_json,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
export class EntityRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getByXid(tenantId, xid) {
        const result = await this.pool.query(`
      SELECT
        xid,
        tenant_id,
        entity_type,
        canonical_name,
        status,
        metadata_json,
        created_at,
        updated_at
      FROM entities
      WHERE tenant_id = $1 AND xid = $2
      LIMIT 1
      `, [tenantId, xid]);
        if (!result.rowCount) {
            return null;
        }
        return mapEntityRow(result.rows[0]);
    }
    async resolveByName(tenantId, name) {
        // Direct match on canonical name
        const exact = await this.pool.query(`
      SELECT
        xid,
        tenant_id,
        entity_type,
        canonical_name,
        status,
        metadata_json,
        created_at,
        updated_at
      FROM entities
      WHERE tenant_id = $1 AND canonical_name ILIKE $2
      LIMIT 1
      `, [tenantId, name]);
        if (exact.rowCount) {
            return {
                entity: mapEntityRow(exact.rows[0]),
                matchedAlias: null,
                score: 1.0,
            };
        }
        // Alias match
        const aliasResult = await this.pool.query(`
      SELECT
        a.xid AS alias_xid,
        a.tenant_id,
        a.entity_xid,
        a.alias,
        a.alias_type,
        a.created_at AS alias_created_at,
        e.xid,
        e.tenant_id,
        e.entity_type,
        e.canonical_name,
        e.status,
        e.metadata_json,
        e.created_at,
        e.updated_at
      FROM entity_aliases a
      JOIN entities e ON e.xid = a.entity_xid
      WHERE a.tenant_id = $1 AND a.alias ILIKE $2
      LIMIT 1
      `, [tenantId, name]);
        if (!aliasResult.rowCount) {
            return null;
        }
        const row = aliasResult.rows[0];
        return {
            entity: mapEntityRow(row),
            matchedAlias: row.alias,
            score: 0.9,
        };
    }
    async listByTenant(tenantId) {
        const result = await this.pool.query(`
      SELECT
        xid,
        tenant_id,
        entity_type,
        canonical_name,
        status,
        metadata_json,
        created_at,
        updated_at
      FROM entities
      WHERE tenant_id = $1
      ORDER BY canonical_name ASC
      `, [tenantId]);
        return result.rows.map(mapEntityRow);
    }
    async exists(tenantId, xid) {
        const result = await this.pool.query(`
      SELECT 1
      FROM entities
      WHERE tenant_id = $1 AND xid = $2
      LIMIT 1
      `, [tenantId, xid]);
        return (result.rowCount ?? 0) > 0;
    }
    async getNeighbors(tenantId, xid) {
        const outResult = await this.pool.query(`
      SELECT
        e.xid AS edge_xid,
        e.edge_type,
        ent.xid,
        ent.tenant_id,
        ent.entity_type,
        ent.canonical_name,
        ent.status,
        ent.metadata_json,
        ent.created_at,
        ent.updated_at
      FROM edges e
      JOIN entities ent ON ent.xid = e.to_entity_xid
      WHERE e.tenant_id = $1 AND e.from_entity_xid = $2
      `, [tenantId, xid]);
        const inResult = await this.pool.query(`
      SELECT
        e.xid AS edge_xid,
        e.edge_type,
        ent.xid,
        ent.tenant_id,
        ent.entity_type,
        ent.canonical_name,
        ent.status,
        ent.metadata_json,
        ent.created_at,
        ent.updated_at
      FROM edges e
      JOIN entities ent ON ent.xid = e.from_entity_xid
      WHERE e.tenant_id = $1 AND e.to_entity_xid = $2
      `, [tenantId, xid]);
        const neighbors = [];
        for (const row of outResult.rows) {
            neighbors.push({
                edgeXid: row.edge_xid,
                edgeType: row.edge_type,
                direction: "out",
                entity: mapEntityRow(row),
            });
        }
        for (const row of inResult.rows) {
            neighbors.push({
                edgeXid: row.edge_xid,
                edgeType: row.edge_type,
                direction: "in",
                entity: mapEntityRow(row),
            });
        }
        return neighbors;
    }
}
