# KUZU-ADAPTER-PLAN

## Purpose

Define the concrete implementation sequence for replacing the in-memory graph execution backend with Kuzu.

## Phase 1

Implement bootstrap:
- create Entity node table
- create relationship tables for core edge types
- load node data
- load edge data

## Phase 2

Implement graph reads:
- neighbors(xid)
- bounded path search
- top-N path search

## Phase 3

Integrate scoring:
- path score properties
- authority-aware filters
- temporal predicates where possible

## Query examples

### Neighbor query
Find edges adjacent to an entity xid.

### Path query
Find paths from Project Atlas to Tuesday Outage within max depth 4.

### Top path query
Find top 5 weighted paths from Alice to Tuesday Outage.

## Rule

PostgreSQL stays authoritative for:
- provenance
- ACL
- audit
- authority tiers

Kuzu is execution-oriented, not the source of truth.