# OPENBRAIN-INTEGRATION

## Purpose

Describe how Open-Brain should call openclaw-entity-memory in shadow mode first, then optionally in production mode for relationship-shaped questions.

## Recommended role split

Open-Brain:
- semantic retrieval
- query normalization
- candidate chunk selection
- answer assembly orchestration

openclaw-entity-memory:
- entity resolution
- relationship traversal
- authority filtering
- ACL-aware path selection
- explanation of exclusions
- provenance-backed relationship evidence

## Shadow mode flow

1. Open-Brain receives the user question
2. Open-Brain classifies whether the question is relationship-shaped
3. Open-Brain retrieves semantic candidates from A-RAG or internal semantic layer
4. Open-Brain calls entity-memory /v1/query/hybrid
5. Open-Brain stores both:
   - its normal answer path
   - the hybrid relationship answer
6. Open-Brain compares:
   - answer agreement
   - evidence count
   - path availability
   - exclusions
   - latency

## Initial production trigger candidates

Use entity-memory for questions involving:
- dependency
- ownership
- outage impact
- policy linkage
- repo-service mapping
- customer exposure
- blocked-by relationships
- workflow lineage

## Important rule

Do not call entity-memory for every semantic question.
Reserve it for relationship-shaped queries or cases where semantic retrieval alone is weak.

## Request contract

Open-Brain should send:
- tenantId
- question
- semanticCandidates
- actor
- asOf where relevant
- minAuthorityTier where relevant

## Response handling

Open-Brain should inspect:
- answer
- confidence
- path
- evidence
- filtersApplied
- explanation.exclusions

If path is empty but exclusions are present, Open-Brain should retain those exclusions for observability and shadow comparison.

## Shadow caller example

Open-Brain should create two clients:
- semantic baseline client
- entity-memory hybrid client

Then for selected relationship-shaped questions:

1. retrieve semantic candidates
2. call semantic baseline
3. call hybrid entity-memory
4. compare results
5. log differences
6. keep semantic path as the production answer until promotion criteria are met

## First concrete integration step

Use the shadow runner pattern first.

For each selected question:
- semantic answer is generated normally
- hybrid answer is generated in parallel
- semantic answer remains the returned answer
- hybrid answer is logged for review
- promotion reports are generated on a case pack

Only promote by query class after thresholds are met.

## Real baseline integration target

The long-term semantic baseline should come from the same Open-Brain or A-RAG retrieval path used in production.

Do not rely on the mock baseline past early development.
Use the real production retrieval stack for meaningful shadow evaluation.

## Limited active step

After shadow criteria are met for outage impact questions:

- semantic and hybrid both still run
- hybrid may become the returned answer for approved outage-impact class
- semantic answer remains logged for comparison
- rollback must be config-driven
- ENTITY_MEMORY_ROLLBACK_ENABLED and ENABLE_OUTAGE_IMPACT_ACTIVE control promotion
- Use shadow_audit table for dual-write comparison records
