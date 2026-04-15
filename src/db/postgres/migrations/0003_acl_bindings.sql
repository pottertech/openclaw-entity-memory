BEGIN;

CREATE TABLE IF NOT EXISTS acl_bindings (
  xid           TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  subject_type  TEXT NOT NULL,
  subject_id    TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  permission    TEXT NOT NULL,
  effect        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT acl_bindings_permission_check CHECK (
    permission IN ('read', 'write', 'deny')
  ),
  CONSTRAINT acl_bindings_effect_check CHECK (
    effect IN ('allow', 'deny')
  )
);

CREATE INDEX IF NOT EXISTS idx_acl_bindings_tenant_subject
  ON acl_bindings (tenant_id, subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_acl_bindings_resource
  ON acl_bindings (tenant_id, resource_type, resource_id);

COMMIT;