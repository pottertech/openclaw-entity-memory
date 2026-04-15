BEGIN;

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS authority_tier TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS conflict_key TEXT NULL;

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS superseded_by_edge_xid TEXT NULL REFERENCES edges(xid) ON DELETE SET NULL;

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS conflict_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE edges
  ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE edges
  ADD CONSTRAINT edges_conflict_status_check CHECK (
    conflict_status IN ('active', 'superseded', 'conflicted', 'inactive')
  );

CREATE INDEX IF NOT EXISTS idx_edges_authority_tier
  ON edges (tenant_id, authority_tier);

CREATE INDEX IF NOT EXISTS idx_edges_conflict_key
  ON edges (tenant_id, conflict_key);

CREATE INDEX IF NOT EXISTS idx_edges_conflict_status
  ON edges (tenant_id, conflict_status);

COMMIT;