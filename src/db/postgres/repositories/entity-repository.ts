import type pg from "pg";
import type { EntityType } from "../../../types/entities.js";

type EntityRow = {
  xid: string;
  tenant_id: string;
  entity_type: string;
  canonical_name: string;
  status: string;
  metadata_json: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

type AliasRow = {
  xid: string;
  tenant_id: string;
  entity_xid: string;
  alias: string;
  alias_type: string;
  created_at: Date;
};

function mapEntityRow(row: EntityRow) {
  return {
    xid: row.xid,
    tenantId: row.tenant_id,
    entityType: row.entity_type as EntityType,
    canonicalName: row.canonical_name,
    status: row.status,
    metadata: row.metadata_json,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class EntityRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getByXid(tenantId: string, xid: string): Promise<ReturnType<typeof mapEntityRow> | null> {
    const result = await this.pool.query<EntityRow>(
      `
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
      `,
      [tenantId, xid],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapEntityRow(result.rows[0]);
  }

  async resolveByName(tenantId: string, name: string): Promise<{
    entity: ReturnType<typeof mapEntityRow>;
    matchedAlias: string | null;
    score: number;
  } | null> {
    // Direct match on canonical name
    const exact = await this.pool.query<EntityRow>(
      `
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
      `,
      [tenantId, name],
    );

    if (exact.rowCount) {
      return {
        entity: mapEntityRow(exact.rows[0]),
        matchedAlias: null,
        score: 1.0,
      };
    }

    // Alias match
    const aliasResult = await this.pool.query<AliasRow & EntityRow>(
      `
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
      `,
      [tenantId, name],
    );

    if (!aliasResult.rowCount) {
      return null;
    }

    const row = aliasResult.rows[0];
    return {
      entity: mapEntityRow(row as unknown as EntityRow),
      matchedAlias: row.alias,
      score: 0.9,
    };
  }

  async listByTenant(tenantId: string): Promise<ReturnType<typeof mapEntityRow>[]> {
    const result = await this.pool.query<EntityRow>(
      `
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
      `,
      [tenantId],
    );

    return result.rows.map(mapEntityRow);
  }

  async exists(tenantId: string, xid: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      SELECT 1
      FROM entities
      WHERE tenant_id = $1 AND xid = $2
      LIMIT 1
      `,
      [tenantId, xid],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async getNeighbors(tenantId: string, xid: string): Promise<
    Array<{
      edgeXid: string;
      edgeType: string;
      direction: "out" | "in";
      entity: ReturnType<typeof mapEntityRow>;
    }>
  > {
    const outResult = await this.pool.query<EntityRow & { edge_xid: string; edge_type: string }>(
      `
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
      `,
      [tenantId, xid],
    );

    const inResult = await this.pool.query<EntityRow & { edge_xid: string; edge_type: string }>(
      `
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
      `,
      [tenantId, xid],
    );

    const neighbors: Array<{
      edgeXid: string;
      edgeType: string;
      direction: "out" | "in";
      entity: ReturnType<typeof mapEntityRow>;
    }> = [];

    for (const row of outResult.rows) {
      neighbors.push({
        edgeXid: row.edge_xid,
        edgeType: row.edge_type,
        direction: "out",
        entity: mapEntityRow(row as unknown as EntityRow),
      });
    }

    for (const row of inResult.rows) {
      neighbors.push({
        edgeXid: row.edge_xid,
        edgeType: row.edge_type,
        direction: "in",
        entity: mapEntityRow(row as unknown as EntityRow),
      });
    }

    return neighbors;
  }
}