# WEEKLY-CANARY-REVIEW.md

## Purpose

Provide a standard weekly review checklist for the outage-impact canary.

## Review cadence

Once per week during canary.

## Inputs to review

- canary dashboard
- trend endpoint
- threshold endpoint
- recent shadow audit records
- recent exclusion reasons
- rollback state
- source refresh status

## Questions to answer

1. Is hybrid still performing as expected?
2. Is same-answer rate stable?
3. Are exclusions understandable?
4. Did source refresh complete successfully?
5. Is hybrid preferred for good reasons?
6. Are there any signs of ACL or provenance instability?
7. Should the canary stay, expand, or roll back?

## Decision outcomes

Choose one:
- continue canary unchanged
- continue canary with fixes
- expand canary scope
- return to shadow only
- rollback immediately