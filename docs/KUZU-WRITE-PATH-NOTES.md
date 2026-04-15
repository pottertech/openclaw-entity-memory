# KUZU-WRITE-PATH-NOTES.md

## Purpose

Document how Brodie should approach the Kuzu write path for graph execution.

## Rule

PostgreSQL remains the source of truth.
Kuzu is a graph execution backend.

## Write path stages

### 1. Bootstrap schema
- Entity node table
- relationship tables for core edge types

### 2. Load nodes
For each canonical entity:
- xid
- tenant_id
- entity_type
- canonical_name
- status

### 3. Load edges
For each active edge:
- xid
- tenant_id
- edge type
- confidence
- authority_tier
- conflict_key
- conflict_status
- valid_from
- valid_to
- last_observed_at

### 4. Refresh strategy
Start with full refresh.
Do not optimize incremental sync first.

### 5. Filtering rule
Do not encode ACL or full provenance into Kuzu first.
Apply those in PostgreSQL-backed filtering before or after graph execution.

## First milestone

A good first milestone is:
- Kuzu loads nodes and edges
- neighbors query works
- bounded path query works
- result set matches in-memory backend for small cases