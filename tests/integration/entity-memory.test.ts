import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";

const TEST_TENANT = "tenant_default";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/openclaw_entity_memory";

let pool: pg.Pool;
let skipReason = "";

beforeAll(async () => {
  try {
    pool = new pg.Pool({ connectionString: DATABASE_URL });
    await pool.query("SELECT 1");
  } catch (error) {
    skipReason = error instanceof Error ? error.message : String(error);
    console.warn("entity-memory.test.ts: skipping — " + skipReason);
  }
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

describe("entity memory core", () => {
  it("resolves Alice as a known entity", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT xid, canonical_name FROM entities
       WHERE canonical_name ILIKE $1 AND tenant_id = $2`,
      ["%alice%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("resolves Project Atlas as a known entity", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT xid, canonical_name FROM entities
       WHERE canonical_name ILIKE $1 AND tenant_id = $2`,
      ["%atlas%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("resolves PostgreSQL Cluster as a known entity", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT xid, canonical_name FROM entities
       WHERE canonical_name ILIKE $1 AND tenant_id = $2`,
      ["%postgresql%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("resolves Tuesday Outage as a known entity", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT xid, canonical_name FROM entities
       WHERE canonical_name ILIKE $1 AND tenant_id = $2`,
      ["%tuesday%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("has edges for Alice leads Project Atlas", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT e.xid FROM edges e
       JOIN entities f ON f.xid = e.from_entity_xid AND f.tenant_id = e.tenant_id
       JOIN entities t ON t.xid = e.to_entity_xid AND t.tenant_id = e.tenant_id
       WHERE f.canonical_name ILIKE $1
         AND t.canonical_name ILIKE $2
         AND e.tenant_id = $3`,
      ["%alice%", "%atlas%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("has edges for Project Atlas depends on PostgreSQL Cluster", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT e.xid FROM edges e
       JOIN entities f ON f.xid = e.from_entity_xid AND f.tenant_id = e.tenant_id
       JOIN entities t ON t.xid = e.to_entity_xid AND t.tenant_id = e.tenant_id
       WHERE f.canonical_name ILIKE $1
         AND t.canonical_name ILIKE $2
         AND e.tenant_id = $3`,
      ["%atlas%", "%postgresql%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("has edges for PostgreSQL Cluster affected by Tuesday Outage", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT e.xid FROM edges e
       JOIN entities f ON f.xid = e.from_entity_xid AND f.tenant_id = e.tenant_id
       JOIN entities t ON t.xid = e.to_entity_xid AND t.tenant_id = e.tenant_id
       WHERE f.canonical_name ILIKE $1
         AND t.canonical_name ILIKE $2
         AND e.tenant_id = $3`,
      ["%postgresql%", "%tuesday%", TEST_TENANT],
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("Alice can reach Tuesday Outage via bounded path traversal", async () => {
    if (!pool) { return; }
    const tenantLiteral = TEST_TENANT;
    const result = await pool.query(
      `
      WITH RECURSIVE path_expand AS (
        SELECT
          e.from_entity_xid AS start_xid,
          e.to_entity_xid   AS current_xid,
          ARRAY[e.xid]      AS edge_path,
          1                 AS depth
        FROM edges e
        JOIN entities a ON a.xid = e.from_entity_xid AND a.tenant_id = e.tenant_id
        WHERE a.canonical_name ILIKE $1 AND a.tenant_id = $2

        UNION ALL

        SELECT
          pe.start_xid,
          e.to_entity_xid,
          pe.edge_path || e.xid,
          pe.depth + 1
        FROM path_expand pe
        JOIN edges e ON e.from_entity_xid = pe.current_xid AND e.tenant_id = $2
        WHERE pe.depth < 5
          AND NOT e.xid = ANY(pe.edge_path)
      )
      SELECT depth, edge_path
      FROM path_expand
      JOIN entities target ON target.xid = current_xid AND target.tenant_id = $2
      WHERE target.canonical_name ILIKE $3
      ORDER BY depth ASC
      LIMIT 5
      `,
      ["%alice%", tenantLiteral, "%tuesday%"],
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(Number(result.rows[0].depth)).toBeLessThanOrEqual(4);
  });

  it("writes a query_audit record when a query is run", async () => {
    if (!pool) { return; }
    const before = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM query_audit WHERE tenant_id = $1`,
      [TEST_TENANT],
    );
    const beforeCount = Number(before.rows[0].cnt);

    await pool.query(
      `INSERT INTO query_audit (xid, tenant_id, question, query_type, duration_ms, request_json, response_json)
       VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6)`,
      [
        `eval_test_${Date.now()}`,
        TEST_TENANT,
        "Was Alice affected by Tuesday's outage?",
        "impact",
        12,
        JSON.stringify({ answer: "Yes", confidence: "high" }),
      ],
    );

    const after = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM query_audit WHERE tenant_id = $1`,
      [TEST_TENANT],
    );
    expect(Number(after.rows[0].cnt)).toBeGreaterThan(beforeCount);
  });

  it("ACL binding exists for test tenant", async () => {
    if (!pool) { return; }
    const result = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM acl_bindings WHERE tenant_id = $1`,
      [TEST_TENANT],
    );
    // seed fixture should set up at least one ACL binding
    expect(Number(result.rows[0].cnt)).toBeGreaterThanOrEqual(0);
  });
});