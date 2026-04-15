BEGIN;

CREATE TABLE IF NOT EXISTS edge_acl_bindings (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  edge_xid TEXT NOT NULL REFERENCES edges(xid) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  effect TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT edge_acl_bindings_effect_check CHECK (
    effect IN ('allow', 'deny')
  )
);

CREATE INDEX IF NOT EXISTS idx_edge_acl_bindings_tenant_subject
  ON edge_acl_bindings (tenant_id, subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_edge_acl_bindings_edge
  ON edge_acl_bindings (edge_xid);

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS conflict_key TEXT NULL;

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS superseded_by_edge_xid TEXT NULL REFERENCES edges(xid) ON DELETE SET NULL;

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS conflict_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE edges ADD CONSTRAINT edges_conflict_status_check CHECK (
    conflict_status IN ('active', 'superseded', 'conflicted', 'inactive')
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_edges_conflict_key
  ON edges (tenant_id, conflict_key);

CREATE INDEX IF NOT EXISTS idx_edges_conflict_status
  ON edges (tenant_id, conflict_status);

ALTER TABLE edge_evidence
  ADD COLUMN IF NOT EXISTS authority_tier TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE edge_evidence
  ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMIT;