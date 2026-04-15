BEGIN;

INSERT INTO entities (xid, tenant_id, entity_type, canonical_name)
VALUES
  ('usr_alice', 'tenant_default', 'User', 'Alice'),
  ('proj_atlas', 'tenant_default', 'Project', 'Project Atlas'),
  ('db_pg', 'tenant_default', 'Datastore', 'PostgreSQL Cluster'),
  ('inc_tuesday', 'tenant_default', 'Incident', 'Tuesday Outage')
ON CONFLICT (xid) DO NOTHING;

INSERT INTO entity_aliases (xid, tenant_id, entity_xid, alias, alias_type)
VALUES
  ('alias_pg_1', 'tenant_default', 'db_pg', 'PostgreSQL', 'name_variant'),
  ('alias_pg_2', 'tenant_default', 'db_pg', 'Postgres', 'name_variant'),
  ('alias_pg_3', 'tenant_default', 'db_pg', 'PG', 'name_variant')
ON CONFLICT (xid) DO NOTHING;

INSERT INTO edges (xid, tenant_id, edge_type, from_entity_xid, to_entity_xid, confidence)
VALUES
  ('edge_1', 'tenant_default', 'LEADS', 'usr_alice', 'proj_atlas', 0.99),
  ('edge_2', 'tenant_default', 'DEPENDS_ON', 'proj_atlas', 'db_pg', 0.98),
  ('edge_3', 'tenant_default', 'AFFECTED_BY', 'db_pg', 'inc_tuesday', 0.97)
ON CONFLICT (xid) DO NOTHING;

INSERT INTO edge_evidence (xid, tenant_id, edge_xid, source_ref, document_xid, chunk_xid, confidence)
VALUES
  ('ev_1', 'tenant_default', 'edge_1', 'seed:test', 'doc_1', 'chk_1', 0.99),
  ('ev_2', 'tenant_default', 'edge_2', 'seed:test', 'doc_2', 'chk_8', 0.98),
  ('ev_3', 'tenant_default', 'edge_3', 'seed:test', 'doc_3', 'chk_4', 0.97)
ON CONFLICT (xid) DO NOTHING;

-- Temporal test data
INSERT INTO entities (xid, tenant_id, entity_type, canonical_name)
VALUES
  ('db_legacy', 'tenant_default', 'Datastore', 'Legacy PostgreSQL Cluster')
ON CONFLICT (xid) DO NOTHING;

INSERT INTO edges (
  xid, tenant_id, edge_type, from_entity_xid, to_entity_xid, confidence, valid_from, valid_to
)
VALUES
  (
    'edge_legacy_1',
    'tenant_default',
    'DEPENDS_ON',
    'proj_atlas',
    'db_legacy',
    0.91,
    '2025-01-01T00:00:00Z',
    '2025-12-31T23:59:59Z'
  )
ON CONFLICT (xid) DO NOTHING;

INSERT INTO edge_evidence (
  xid, tenant_id, edge_xid, source_ref, document_xid, chunk_xid, confidence
)
VALUES
  (
    'ev_legacy_1',
    'tenant_default',
    'edge_legacy_1',
    'seed:temporal',
    'doc_legacy_1',
    'chk_legacy_1',
    0.91
  )
ON CONFLICT (xid) DO NOTHING;

-- ACL bindings for brodie agent
INSERT INTO acl_bindings (
  xid, tenant_id, subject_type, subject_id, resource_type, resource_id, permission
)
VALUES
  ('acl_1', 'tenant_default', 'agent', 'brodie', 'entity', 'usr_alice', 'read'),
  ('acl_2', 'tenant_default', 'agent', 'brodie', 'entity', 'proj_atlas', 'read'),
  ('acl_3', 'tenant_default', 'agent', 'brodie', 'entity', 'db_pg', 'read'),
  ('acl_4', 'tenant_default', 'agent', 'brodie', 'entity', 'inc_tuesday', 'read')
ON CONFLICT (xid) DO NOTHING;

-- Document ACL bindings
INSERT INTO document_acl_bindings (
  xid, tenant_id, subject_type, subject_id, document_xid, permission, effect
)
VALUES
  ('doc_acl_1', 'tenant_default', 'agent', 'brodie', 'doc_1', 'read', 'allow'),
  ('doc_acl_2', 'tenant_default', 'agent', 'brodie', 'doc_2', 'read', 'allow'),
  ('doc_acl_3', 'tenant_default', 'agent', 'brodie', 'doc_3', 'read', 'allow'),
  ('doc_acl_4', 'tenant_default', 'agent', 'guest_agent', 'doc_2', 'read', 'deny')
ON CONFLICT (xid) DO NOTHING;

COMMIT;