# ARCHITECTURE

## Purpose

openclaw-entity-memory adds relationship-aware memory to the OpenClaw stack.

It handles questions that require explicit connections across entities, systems, and events.

This service complements:
- A-RAG: semantic recall
- Open-Brain: memory orchestration
- PostgreSQL / pg-memory: provenance, authority, ACL, lifecycle

## Problem

Flat semantic retrieval is good at finding related text.
It is weak at answering multi-hop questions.

Example:
- Alice leads Project Atlas
- Project Atlas depends on PostgreSQL
- PostgreSQL had an outage on Tuesday

Question:
Was Alice's project affected?

Correct answer requires:
Alice -> Project Atlas -> PostgreSQL -> Tuesday outage

This service exists to represent and traverse that chain.

## Service role

This repo owns:
- canonical entities
- aliases
- typed relationships
- edge evidence
- graph traversal
- relationship-centric query logic

This repo does not own:
- general-purpose semantic chunk retrieval
- primary embedding generation
- full memory orchestration
- all continuity state

## Storage model

### PostgreSQL

PostgreSQL is the durable system of record.

It stores:
- entities
- entity aliases
- edges
- edge evidence
- ingestion runs
- source references
- temporal validity
- tenant boundaries
- ACL-compatible metadata

### Graph adapter

Phase 1 uses an in-memory graph adapter for:
- local traversal
- contract testing
- evaluation harness

Later, a swappable backend such as Kuzu can be added.

## Query model

### Path query

Use when the caller wants to know whether one entity connects to another.

Examples:
- Does Project Atlas depend on PostgreSQL?
- Does Repo A implement Service B?

### Impact query

Use when the caller wants to know what is affected by an entity or event.

Examples:
- Which projects were affected by the Tuesday outage?
- Which workflows depend on this connector?

### Hybrid query

Use when semantic evidence must be combined with structural reasoning.

Examples:
- Was Alice's project affected by Tuesday's outage?
- Which policy governs the repo mentioned in this incident report?

Hybrid flow:
1. caller provides semantic candidates or upstream retrieval context
2. resolve candidate entities
3. traverse graph
4. apply tenant, ACL, temporal, and authority filters
5. return answer with path and evidence

## Tenancy and ACL

Every entity and edge must be tenant-aware.
Query execution must support access filtering.

Phase 1 can keep ACL logic simple, but the API and schema must be designed so stronger policy can be added later.

## Temporal model

Entities and edges must support time-aware validity.

Required fields:
- valid_from
- valid_to
- created_at
- updated_at

This allows later support for:
- historical queries
- supersession
- stale edge detection
- time-scoped impact analysis

## Provenance

No edge should exist without evidence.

Evidence should reference:
- source record
- document if available
- chunk if available
- supporting span or note

This keeps graph answers grounded and debuggable.

## Integration shape

Phase 1:
standalone service

Phase 2:
Open-Brain calls hybrid endpoints for relationship-style queries

Phase 3:
A-RAG emits richer entity hints during retrieval or ingest

Phase 4:
orchestrator routes graph-shaped questions here automatically

## Design constraints

- additive to current stack
- no deep rewrite of A-RAG
- no broad graph extraction of every noun
- only stable operational entities
- clean service contracts
- XID-first identifiers where possible