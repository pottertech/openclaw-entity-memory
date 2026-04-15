BEGIN;

CREATE TABLE IF NOT EXISTS document_acl_bindings (
  xid TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  document_xid TEXT NOT NULL,
  permission TEXT NOT NULL,
  effect TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT document_acl_bindings_effect_check CHECK (
    effect IN ('allow', 'deny')
  )
);

CREATE INDEX IF NOT EXISTS idx_document_acl_bindings_tenant_subject
  ON document_acl_bindings (tenant_id, subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_document_acl_bindings_document
  ON document_acl_bindings (document_xid);

CREATE OR REPLACE VIEW v_edge_provenance AS
SELECT
  e.xid AS edge_xid,
  e.tenant_id,
  e.edge_type,
  e.from_entity_xid,
  e.to_entity_xid,
  e.authority_tier AS edge_authority_tier,
  e.conflict_key,
  e.conflict_status,
  e.superseded_by_edge_xid,
  ev.xid AS evidence_xid,
  ev.source_ref,
  ev.document_xid,
  ev.chunk_xid,
  ev.authority_tier AS evidence_authority_tier,
  ev.confidence AS evidence_confidence,
  ev.created_at AS evidence_created_at
FROM edges e
JOIN edge_evidence ev
  ON ev.edge_xid = e.xid;

CREATE OR REPLACE VIEW v_entity_edge_neighbors AS
SELECT
  e.tenant_id,
  e.xid AS edge_xid,
  e.edge_type,
  e.from_entity_xid,
  ef.canonical_name AS from_entity_name,
  e.to_entity_xid,
  et.canonical_name AS to_entity_name,
  e.authority_tier,
  e.conflict_status,
  e.valid_from,
  e.valid_to
FROM edges e
JOIN entities ef ON ef.xid = e.from_entity_xid
JOIN entities et ON et.xid = e.to_entity_xid;

COMMIT;