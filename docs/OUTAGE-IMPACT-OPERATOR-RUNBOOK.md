# OUTAGE-IMPACT-OPERATOR-RUNBOOK

## Purpose

One-page runbook for monitoring and operating the outage-impact canary.

## What this canary does

For outage-impact questions:
- semantic baseline still exists
- hybrid entity-memory may run in shadow or limited active mode
- routing choice is observable
- rollback is config-driven

## Daily checks

1. Check dashboard endpoint: GET /v1/canary-dashboard/outage-impact
2. Check threshold endpoint: GET /v1/shadow-report/thresholds
3. Review recent shadow audit: GET /v1/shadow-audit?tenant_id=...&limit=20
4. Review exclusion distribution: GET /v1/review/exclusions
5. Confirm rollback state: ENTITY_MEMORY_ROLLBACK_ENABLED env var

## Endpoints to check

- /v1/canary-dashboard/outage-impact
- /v1/shadow-report/verdicts
- /v1/shadow-report/thresholds
- /v1/shadow-audit
- /v1/review/exclusions

## Healthy signs

- hybrid preference rate is stable
- same-answer rate is stable
- exclusions are understandable
- no ACL leakage concerns
- rollback state is as expected

## Warning signs

- sudden drop in same-answer rate
- sharp increase in exclusions
- frequent conflict_loser or missing_evidence patterns
- hybrid chosen too often without good evidence
- latency rising unexpectedly

## Immediate action if risk appears

1. set ENTITY_MEMORY_ROLLBACK_ENABLED=true
2. set ENABLE_OUTAGE_IMPACT_ACTIVE=false
3. verify returned path is semantic
4. continue shadow if safe
5. review latest audit and dashboard data

## Production consolidation check

Before treating outage-impact as production-supported:
- run readiness report
- run signoff check
- review known limitations
- confirm ownership
- confirm audit retention plan