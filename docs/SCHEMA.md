# SCHEMA

## Phase 1 tables

Phase 1 requires these tables:

- entities
- entity_aliases
- edges
- edge_evidence
- ingestion_runs

## entities

Canonical operational entities.

Fields:
- xid
- tenant_id
- entity_type
- canonical_name
- status
- metadata_json
- created_at
- updated_at

## entity_aliases

Alias map for canonical resolution.

Fields:
- xid
- tenant_id
- entity_xid
- alias
- alias_type
- created_at

## edges

Typed relationships between entities.

Fields:
- xid
- tenant_id
- edge_type
- from_entity_xid
- to_entity_xid
- confidence
- valid_from
- valid_to
- metadata_json
- created_at
- updated_at
- authority_tier
- conflict_key
- superseded_by_edge_xid
- conflict_status
- last_observed_at

Rules:
- edge_type must be explicit
- from_entity_xid and to_entity_xid must exist in entities
- no edge without tenant_id
- no edge without time fields present in schema

### edges additional fields

- authority_tier
- conflict_key
- superseded_by_edge_xid
- conflict_status
- last_observed_at

## edge_evidence

Evidence supporting an edge.

Fields:
- xid
- tenant_id
- edge_xid
- source_ref
- document_xid
- chunk_xid
- evidence_span
- confidence
- created_at
- authority_tier

Rules:
- every edge should have at least one edge_evidence row before considered queryable in production
- phase 1 may allow incomplete backfill during tests, but not silent no-evidence edges

### edge_evidence additional field

- authority_tier

## ingestion_runs

Operational tracking of ingest jobs.

Fields:
- xid
- tenant_id
- run_type
- source_ref
- status
- stats_json
- started_at
- finished_at
- created_at

## query_audit

Operational record of executed queries.

Fields:
- xid
- tenant_id
- query_type
- query_text
- request_json
- response_json
- status
- duration_ms
- created_at

Purpose:
- debug query behavior
- compare path and hybrid quality
- support shadow-mode evaluation
- measure latency and failure rate

## authority_tiers

Defines normalized authority levels used for graph reasoning and evidence filtering.

Fields:
- xid
- tier_name
- rank_value
- description
- created_at

Default tiers:
- low
- standard
- high
- critical

Use:
- edge filtering
- evidence filtering
- conflict handling
- future precedence rules

## acl_bindings

Access-control bindings for entities, edges, documents, and future resources.

Fields:
- xid
- tenant_id
- subject_type
- subject_id
- resource_type
- resource_id
- permission
- created_at

Examples:
- agent -> entity -> read
- user -> document -> read
- team -> project -> admin

Phase 2 note:
Phase 1.5 uses this as a schema placeholder. Query-time enforcement can begin with simple allow rules, then expand later.

## edge_acl_bindings

Access-control rules for specific graph edges.

Fields:
- xid
- tenant_id
- subject_type
- subject_id
- edge_xid
- permission
- effect
- created_at

Rules:
- effect is allow or deny
- deny takes precedence over allow
- edge ACL is evaluated after entity ACL
- future inheritance rules may expand subject matching

Purpose:
- prevent traversal across restricted relationships
- allow partial visibility of the graph
- support path exclusion explanations

## document_acl_bindings

Document-level access rules that can affect whether evidence is visible.

Fields:
- xid
- tenant_id
- subject_type
- subject_id
- document_xid
- permission
- effect
- created_at

Rules:
- deny takes precedence over allow
- document ACL can exclude evidence even if entity and edge are visible
- document ACL is applied when evidence is inspected or returned

Use:
- protect source documents
- control evidence visibility
- support explanation of hidden evidence

## v_edge_provenance

Convenience view joining edges to evidence.

Use:
- provenance inspection
- debugging
- review API
- Open-Brain explanation assembly

## v_entity_edge_neighbors

Convenience view of edge neighborhood per entity.

Use:
- neighborhood inspection
- graph exploration
- entity relationship overview

## Entity types

Initial allowed values:
- Agent
- User
- Team
- Project
- Repository
- Service
- Workflow
- Document
- Incident
- Datastore

## Edge types

Initial allowed values:
- LEADS
- BELONGS_TO
- OWNS
- DEPENDS_ON
- USES
- IMPLEMENTS
- GOVERNED_BY
- AFFECTED_BY
- ASSIGNED_TO
- GENERATED_FROM
- SUPERSEDES
- RELATED_TO