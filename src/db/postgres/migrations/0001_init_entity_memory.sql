-- 0001_init_entity_memory.sql

BEGIN;

CREATE TABLE IF NOT EXISTS entities (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT entities_entity_type_check CHECK (
    entity_type IN (
      'Agent',
      'User',
      'Team',
      'Project',
      'Repository',
      'Service',
      'Workflow',
      'Document',
      'Incident',
      'Datastore'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_entities_tenant_type
  ON entities (tenant_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_entities_tenant_name
  ON entities (tenant_id, canonical_name);

CREATE TABLE IF NOT EXISTS entity_aliases (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_xid TEXT NOT NULL REFERENCES entities(xid) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'name_variant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_aliases_tenant_alias
  ON entity_aliases (tenant_id, alias);

CREATE INDEX IF NOT EXISTS idx_entity_aliases_entity
  ON entity_aliases (entity_xid);

CREATE TABLE IF NOT EXISTS edges (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  from_entity_xid TEXT NOT NULL REFERENCES entities(xid) ON DELETE CASCADE,
  to_entity_xid TEXT NOT NULL REFERENCES entities(xid) ON DELETE CASCADE,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
  valid_from TIMESTAMPTZ NULL,
  valid_to TIMESTAMPTZ NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT edges_edge_type_check CHECK (
    edge_type IN (
      'LEADS',
      'BELONGS_TO',
      'OWNS',
      'DEPENDS_ON',
      'USES',
      'IMPLEMENTS',
      'GOVERNS_BY',
      'AFFECTED_BY',
      'ASSIGNED_TO',
      'GENERATED_FROM',
      'SUPERSEDES',
      'RELATED_TO'
    )
  ),
  CONSTRAINT edges_confidence_range CHECK (
    confidence >= 0 AND confidence <= 1
  ),
  CONSTRAINT edges_valid_window_check CHECK (
    valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from
  ),
  CONSTRAINT edges_no_self_loop_check CHECK (
    from_entity_xid <> to_entity_xid
  )
);

CREATE INDEX IF NOT EXISTS idx_edges_tenant_type
  ON edges (tenant_id, edge_type);

CREATE INDEX IF NOT EXISTS idx_edges_from
  ON edges (from_entity_xid);

CREATE INDEX IF NOT EXISTS idx_edges_to
  ON edges (to_entity_xid);

CREATE INDEX IF NOT EXISTS idx_edges_valid_window
  ON edges (valid_from, valid_to);

CREATE TABLE IF NOT EXISTS edge_evidence (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  edge_xid TEXT NOT NULL REFERENCES edges(xid) ON DELETE CASCADE,
  source_ref TEXT NOT NULL,
  document_xid TEXT NULL,
  chunk_xid TEXT NULL,
  evidence_span JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT edge_evidence_confidence_range CHECK (
    confidence >= 0 AND confidence <= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_edge_evidence_edge
  ON edge_evidence (edge_xid);

CREATE INDEX IF NOT EXISTS idx_edge_evidence_tenant
  ON edge_evidence (tenant_id);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_type TEXT NOT NULL,
  source_ref TEXT NULL,
  status TEXT NOT NULL,
  stats_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NULL,
  finished_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingestion_runs_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'partial')
  )
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_tenant_status
  ON ingestion_runs (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_created
  ON ingestion_runs (created_at);

COMMIT;