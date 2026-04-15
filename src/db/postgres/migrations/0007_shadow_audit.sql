BEGIN;

CREATE TABLE IF NOT EXISTS shadow_audit (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  query_class TEXT NOT NULL,
  question TEXT NOT NULL,
  semantic_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  hybrid_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparison_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  chosen_path TEXT NOT NULL,
  rollback_state TEXT NOT NULL DEFAULT 'enabled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shadow_audit_tenant_class
  ON shadow_audit (tenant_id, query_class);

CREATE INDEX IF NOT EXISTS idx_shadow_audit_created
  ON shadow_audit (created_at);

COMMIT;