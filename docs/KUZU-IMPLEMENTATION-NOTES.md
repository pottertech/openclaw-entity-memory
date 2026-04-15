# KUZU-IMPLEMENTATION-NOTES

## Purpose

Describe how to move from the current in-memory graph backend to a real Kuzu-backed graph adapter.

## Why Kuzu

Kuzu is a strong fit for local and embedded graph workloads:
- lightweight
- fast local traversal
- clear graph schema model
- good match for typed relationships

## Initial schema model

Node tables:
- Entity

Fields:
- xid
- tenant_id
- entity_type
- canonical_name
- status

Relationship tables:
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

Relationship properties:
- xid
- tenant_id
- confidence
- authority_tier
- conflict_key
- conflict_status
- valid_from
- valid_to
- last_observed_at

## Adapter responsibilities

The Kuzu adapter must implement:
- load()
- neighbors()
- findPath()
- findTopPaths()

## Practical implementation sequence

1. build Kuzu schema bootstrap
2. implement node upsert
3. implement edge upsert
4. implement neighbors() query
5. implement bounded path query
6. implement top-path selection
7. benchmark against in-memory backend

## Important constraint

Keep PostgreSQL as the system of record.
Kuzu should be treated as a graph execution backend, not as the source of truth for provenance or ACL.
