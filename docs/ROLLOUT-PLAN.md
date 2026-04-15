# ROLLOUT-PLAN

## Purpose

Define the rollout path for openclaw-entity-memory from shadow mode to limited active routing to broader active routing.

## Stage 1: build complete

Requirements:
- service boots cleanly
- migrations stable
- ingest stable
- traversal stable
- ACL and authority filters working
- audit and review endpoints working

Status:
development only

## Stage 2: shadow mode

Requirements:
- Open-Brain calls hybrid endpoint for selected relationship-shaped queries
- semantic path remains authoritative
- differences are logged
- benchmark and promotion reports run
- exclusions are reviewed

Status:
production safe, no active routing

## Stage 3: limited active routing

Requirements:
- promotion criteria met for a specific query class
- rollback rule documented
- low false positives
- acceptable latency
- stable provenance

Routing examples:
- outage impact
- direct dependency questions
- explicit ownership chains

Status:
active only for approved query classes

## Stage 4: broader active routing

Requirements:
- multiple query classes validated
- operational review complete
- conflict resolution stable
- document ACL behavior reviewed
- review endpoints used regularly

Status:
hybrid routing can be trusted for defined classes

## Rollback rule

If any of the following occur:
- regression in accuracy
- unexplained false positives
- ACL leakage
- unstable exclusions
- latency spike
then disable active routing for the affected class and return to shadow mode.

## Stage 3 canary entry

Before limited active expands beyond shadow:
- real case pack exists
- shadow verdict endpoint reviewed
- canary procedure approved
- outage-impact cutover checklist reviewed

## Phase 10

Production consolidation for outage-impact.

Goals:
- close the first rollout cycle
- force an explicit decision
- harden operations
- document limitations
- define ownership
