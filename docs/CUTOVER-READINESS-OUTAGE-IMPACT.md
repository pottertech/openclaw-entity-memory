# CUTOVER-READINESS-OUTAGE-IMPACT

## Purpose

Checklist for deciding whether outage-impact queries are ready for limited active routing.

## Data quality

- [ ] real incident cases collected
- [ ] real project dependency cases collected
- [ ] real owner-to-project cases collected
- [ ] fixture pack reviewed
- [ ] known-good answers documented

## Benchmarking

- [ ] semantic baseline is real (not mock)
- [ ] hybrid benchmark run on real case pack
- [ ] shadow reports reviewed
- [ ] preferred path distribution understood
- [ ] false positives reviewed

## Governance

- [ ] entity ACL verified
- [ ] edge ACL verified
- [ ] document ACL verified
- [ ] audit records present
- [ ] exclusions understandable

## Operability

- [ ] canary plan documented
- [ ] rollback drill completed
- [ ] rollback config tested
- [ ] review endpoints exercised
- [ ] support notes written

## Threshold review

Before promoting outage-impact beyond canary:
- [ ] shadow-report thresholds reviewed
- [ ] real case pack refreshed recently
- [ ] canary dashboard reviewed

## Decision

Choose one:
- remain shadow-only
- begin limited active canary
- block promotion and fix issues

## Phase 10 exit criteria

Before declaring outage-impact production-supported:
- real source adapters in use
- real semantic baseline in use
- rollback proven
- readiness report reviewed
- signoff check passing
- post-canary decision recorded