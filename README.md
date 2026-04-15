# openclaw-entity-memory

Relationship-aware memory service for OpenClaw.

This repo adds canonical entities, typed relationships, provenance-backed edges, and multi-hop reasoning to the existing memory stack.

It is additive to:
- A-RAG for semantic retrieval
- Open-Brain for unified memory orchestration
- PostgreSQL / pg-memory for provenance, authority, ACL, and lifecycle state

It does not replace A-RAG or Open-Brain.

## What it does

This service is built for questions that flat semantic retrieval often misses.

Examples:
- Which projects were affected by a database outage?
- Which repos depend on a service that changed?
- Which policy governs this workflow?
- Which tasks are blocked by an incident?
- Which customers are exposed by a failing connector?

## Core responsibilities

- store canonical entities
- store typed edges between entities
- attach evidence to edges
- resolve aliases to canonical entities
- support multi-hop traversal
- support path, impact, and hybrid semantic-plus-graph queries
- enforce tenant and ACL-aware filtering
- support temporal validity windows

## Phase 1 scope

Phase 1 focuses on:
- TypeScript service skeleton
- PostgreSQL schema and migrations
- in-memory graph adapter
- entity resolver
- edge service
- basic APIs
- evaluation fixtures

Phase 1 does not include:
- deep A-RAG ingest changes
- full Open-Brain integration
- production graph backend dependency
- autonomous extraction of every possible entity
- production cutover

## Architecture summary

- PostgreSQL: durable system of record
- In-memory graph adapter: local traversal and contract validation
- Future graph backend: optional Kuzu
- Future callers: Open-Brain, orchestrator, selected services

Query shape:
semantic candidates -> entity resolution -> graph traversal -> provenance / ACL / time filters -> answer with evidence

## Initial entity types

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

## Initial edge types

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

## API goals

Phase 1 endpoints:
- GET /v1/health
- GET /v1/ready
- GET /v1/entities/:xid
- GET /v1/entities/resolve?name=...
- GET /v1/entities/:xid/neighbors
- POST /v1/query/path
- POST /v1/query/impact
- POST /v1/query/hybrid

## Design rules

- every edge must have evidence
- every entity and edge must be tenant-aware
- time validity fields exist from day one
- ACL checks must be part of query flow
- use XID-style identifiers where possible
- only graph stable operational entities
- do not replace semantic retrieval
- do not merge this into A-RAG in phase 1

## Local development

Expected environment:
- Node.js 20+
- PostgreSQL 15+
- Docker optional

Basic flow:
1. start PostgreSQL
2. apply migrations
3. start service
4. seed fixtures
5. run evaluation tests

## Success criteria for phase 1

- service boots cleanly
- migrations apply cleanly
- entity alias resolution works
- path queries return correct multi-hop answers
- impact queries return correct affected entities
- hybrid queries accept semantic candidates and return evidence-backed paths
- evaluation fixtures report correctness and evidence coverage

## Status

Phase 1 baseline repo.