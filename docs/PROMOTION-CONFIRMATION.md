# PROMOTION-CONFIRMATION.md

## Promotion status

Outage-impact hybrid memory is live in promoted posture.

## Effective scope

Promotion applies only to:

- outage-impact queries

Examples:
- Was Alice's project affected by Tuesday's outage?
- Which projects were affected by the Postgres outage?
- Which workflows were affected by the failed service?

Promotion does not apply to:

- general dependency reasoning
- policy linkage
- customer exposure
- workflow lineage outside outage-impact framing
- any second query class

## Verification summary

The following issues were found and fixed during verification before confirming promotion:

1. The limited-active router was not wired into the live query flow.
   - Routing decisions existed in the adapter layer.
   - `/query/hybrid` was going directly to the hybrid query service.
   - Fix: `decideLimitedActiveRouting()` now runs before hybrid execution.

2. Boolean environment variables were parsed incorrectly.
   - The prior parsing behavior treated the string `"false"` as truthy.
   - Fix: replaced boolean coercion with explicit string comparison logic.

3. `semanticCandidates` was required on the hybrid query schema.
   - This blocked valid outage-impact queries without explicit semantic context.
   - Fix: made `semanticCandidates` optional.

4. Monitoring endpoints were verified live.
   - Confirmed:
     - shadow-audit
     - canary-dashboard
     - thresholds
     - source-health
     - alerts
     - dashboard summary

## Live posture

Current runtime posture:

- `ENABLE_OUTAGE_IMPACT_ACTIVE=true`
- `ENTITY_MEMORY_ROLLBACK_ENABLED=false`

## Runtime confirmation

Confirmed behavior:

- outage-impact question → hybrid path
- non-outage question → semantic path
- routing boundary enforced
- monitoring live
- rollback path remains config-driven

## Service status

- service running on port 4017
- promotion posture confirmed active

## Controls still in force

The following controls remain active after promotion:

- semantic comparison logging remains active
- shadow audit remains active
- dashboard remains active
- threshold and alert review remain active
- source-health remains reviewable
- rollback remains config-driven
- no second query class is approved

## Rollback rule

If any of the following occur, revert immediately:

- false positives
- ACL or evidence visibility concerns
- unstable exclusions
- source-health degradation
- unexpected routing behavior
- operator confidence degradation

Rollback settings:

- `ENABLE_OUTAGE_IMPACT_ACTIVE=false`
- `ENTITY_MEMORY_ROLLBACK_ENABLED=true`

## Review date

- next review: 2026-04-23

## Expansion rule

Do not expand to a second query class before the next review and an explicit approval decision.