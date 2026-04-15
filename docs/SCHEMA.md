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

Rules:
- edge_type must be explicit
- from_entity_xid and to_entity_xid must exist in entities
- no edge without tenant_id
- no edge without time fields present in schema

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

Rules:
- every edge should have at least one edge_evidence row before considered queryable in production
- phase 1 may allow incomplete backfill during tests, but not silent no-evidence edges

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