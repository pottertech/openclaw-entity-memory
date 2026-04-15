import type pg from "pg";
import type { Entity } from "../../../types/entities.js";

type EntityRow = {
  xid: string;
  tenant_id: string;
  entity_type: Entity["entityType"];
  canonical_name: string;
  status: string;
  metadata_json: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

function mapEntityRow(row: EntityRow): Entity {
  return {
    xid: row.xid,
    tenantId: row.tenant_id,
    entityType: row.entity_type,
    canonicalName: row.canonical_name,
    status: row.status,
    metadata: row.metadata_json ?? {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class EntityRepository {
  constructor(private readonly pool: pg.Pool) {}

  async getByXid(tenantId: string, xid: string): Promise<Entity | null> {
    const result = await this.pool.query<EntityRow>(
      `
      SELECT xid, tenant_id, entity_type, canonical_name, status, metadata_json, created_at, updated_at
      FROM entities
      WHERE tenant_id = $1 AND xid = $2
      LIMIT 1
      `,
      [tenantId, xid],
    );

    return result.rowCount ? mapEntityRow(result.rows[0]) : null;
  }

  async resolveByName(
    tenantId: string,
    rawName: string,
  ): Promise<{ entity: Entity; matchedAlias?: string; score: number } | null> {
    const name = rawName.trim();

    // Direct canonical name match
    const direct = await this.pool.query<EntityRow>(
      `
      SELECT xid, tenant_id, entity_type, canonical_name, status, metadata_json, created_at, updated_at
      FROM entities
      WHERE tenant_id = $1 AND lower(canonical_name) = lower($2)
      LIMIT 1
      `,
      [tenantId, name],
    );

    if (direct.rowCount) {
      return {
        entity: mapEntityRow(direct.rows[0]),
        matchedAlias: undefined,
        score: 1.0,
      };
    }

    // Alias match
    const alias = await this.pool.query<EntityRow & { matched_alias: string }>(
      `
      SELECT
        e.xid,
        e.tenant_id,
        e.entity_type,
        e.canonical_name,
        e.status,
        e.metadata_json,
        e.created_at,
        e.updated_at,
        a.alias AS matched_alias
      FROM entity_aliases a
      JOIN entities e ON e.xid = a.entity_xid
      WHERE a.tenant_id = $1
        AND e.tenant_id = $1
        AND lower(a.alias) = lower($2)
      LIMIT 1
      `,
      [tenantId, name],
    );

    if (!alias.rowCount) {
      return null;
    }

    return {
      entity: mapEntityRow(alias.rows[0]),
      matchedAlias: alias.rows[0].matched_alias,
      score: 0.96,
    };
  }

  async getNeighbors(
    tenantId: string,
    xid: string,
  ): Promise<
    Array<{
      edgeXid: string;
      edgeType: string;
      direction: "out" | "in";
      entity: Entity;
    }>
  > {
    const result = await this.pool.query<
      EntityRow & {
        edge_xid: string;
        edge_type: string;
        direction: "out" | "in";
      }
    >(
      `
      SELECT
        e2.xid,
        e2.tenant_id,
        e2.entity_type,
        e2.canonical_name,
        e2.status,
        e2.metadata_json,
        e2.created_at,
        e2.updated_at,
        ed.xid AS edge_xid,
        ed.edge_type,
        CASE
          WHEN ed.from_entity_xid = $2 THEN 'out'
          ELSE 'in'
        END AS direction
      FROM edges ed
      JOIN entities e2
        ON e2.xid = CASE
          WHEN ed.from_entity_xid = $2 THEN ed.to_entity_xid
          ELSE ed.from_entity_xid
        END
      WHERE ed.tenant_id = $1
        AND e2.tenant_id = $1
        AND ($2 IN (ed.from_entity_xid, ed.to_entity_xid))
      ORDER BY ed.created_at ASC
      `,
      [tenantId, xid],
    );

    return result.rows.map((row) => ({
      edgeXid: row.edge_xid,
      edgeType: row.edge_type,
      direction: row.direction,
      entity: mapEntityRow(row),
    }));
  }
}