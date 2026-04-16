# POST-CANARY-DECISION.md

## Query class

- outage-impact

## Current state

- limited-active

## Decision

- promote

## Reason

Outage-impact hybrid memory is approved for production-supported use for the outage-impact query class only.

This decision is based on completion of the Phase 10 gate, passing rollback and production-gate tests, and the presence of the required operational controls. The routing boundary remains narrow, the rollback path is config-driven, and the monitoring surface is in place. Promotion is approved with continued monitoring, continued semantic comparison logging, and no immediate expansion to additional query classes.

This is a controlled promotion, not a broad expansion.

## Evidence reviewed

- Phase 10 readiness report
- Phase 10 signoff check
- rollback drill test
- outage-impact production-gate test
- shadow audit review
- canary dashboard review
- threshold review
- source-health review

## Promotion scope

Promotion applies only to:

- outage-impact questions

Examples include:

- Was Alice's project affected by Tuesday's outage?
- Which projects were affected by the Postgres outage?
- Which workflows were affected by the failed service?
- Was this project affected by the incident?

Promotion does not apply to:

- general dependency reasoning
- broad policy linkage
- customer exposure
- workflow lineage outside outage-impact framing
- any second query class

## Operational conditions

The following conditions remain in force after promotion:

- semantic comparison logging remains active
- dashboard review remains active
- threshold review remains active
- exclusions remain reviewable
- source-health remains reviewable
- rollback remains config-driven
- no second query class is approved at this time

## Rollback rule

If any of the following occur, revert outage-impact to semantic-authoritative behavior immediately:

- false positives appear
- ACL or evidence visibility concerns appear
- source-health becomes unreliable
- exclusions become unstable
- same-answer rate degrades materially
- operator confidence degrades

Rollback mechanism:

- set `ENABLE_OUTAGE_IMPACT_ACTIVE=false`
- set `ENTITY_MEMORY_ROLLBACK_ENABLED=true`

## Owner

- Brodie for engineering implementation and stabilization
- Operations owner as assigned for dashboard review, alert review, and rollback initiation
- Product or policy owner as assigned for scope control and expansion approval

## Next review date

- one week from promotion

## Post-promotion rule

Do not expand to a second query class until outage-impact remains stable through at least one full review cycle and the next expansion is explicitly approved.