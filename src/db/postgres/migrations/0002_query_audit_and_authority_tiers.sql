BEGIN;

CREATE TABLE IF NOT EXISTS authority_tiers (
  tier         TEXT PRIMARY KEY,
  rank         INTEGER NOT NULL UNIQUE,
  description  TEXT NOT NULL DEFAULT ''
);

INSERT INTO authority_tiers (tier, rank, description) VALUES
  ('low',      1,    'Low-confidence automated source'),
  ('standard', 2,    'Standard confidence source'),
  ('high',     3,    'High-confidence source'),
  ('critical', 4,   'Authoritative source')
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS query_audit (
  xid          TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  query_type   TEXT NOT NULL,
  question     TEXT NULL,
  source_ref   TEXT NULL,
  request_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status       TEXT NOT NULL DEFAULT 'ok',
  result_count INTEGER NOT NULL DEFAULT 0,
  duration_ms  INTEGER NOT NULL DEFAULT 0,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT query_audit_query_type_check CHECK (
    query_type IN ('path', 'hybrid', 'impact', 'entity_lookup', 'semantic_search')
  ),
  CONSTRAINT query_audit_status_check CHECK (
    status IN ('ok', 'error')
  )
);

CREATE INDEX IF NOT EXISTS idx_query_audit_tenant_created
  ON query_audit (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_audit_query_type
  ON query_audit (query_type);

COMMIT;