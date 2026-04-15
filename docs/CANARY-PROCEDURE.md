# CANARY-PROCEDURE

## Purpose

Run limited-active routing for one approved query class with tight observation and immediate rollback.

## First canary class

- outage impact

## Entry conditions

Before starting the canary:
- shadow reports reviewed
- rollback drill completed
- limited-active test passing
- query class approved
- rollback config verified

## Canary scope

Start with:
- one tenant or test environment
- one query class
- low request volume
- semantic result still logged in parallel

## During canary

For each request capture:
- returned path
- semantic shadow result
- hybrid shadow result
- exclusions
- evidence count
- latency
- any operator notes

## Dashboard review

Before continuing the canary each review cycle:
- check threshold endpoint (/v1/shadow-report/thresholds)
- check verdict summary (/v1/shadow-report/verdicts)
- check exclusion distribution (/v1/review/exclusions)
- confirm rollback state (ENTITY_MEMORY_ROLLBACK_ENABLED)

## Stop conditions

Stop canary immediately if:
- false positives appear
- ACL behavior is suspect
- exclusions become unstable
- latency is materially worse
- confidence degrades

## Rollback

Set:
- ENABLE_OUTAGE_IMPACT_ACTIVE=false
- ENTITY_MEMORY_ROLLBACK_ENABLED=true

Confirm:
- returned path switches back to semantic
- shadow still records if desired

## Source freshness check

Before trusting the latest canary results:
- confirm case-pack refresh succeeded
- confirm connected source adapters returned recent data