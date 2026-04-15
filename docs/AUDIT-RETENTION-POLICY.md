# AUDIT-RETENTION-POLICY.md

## Purpose

Define how long query_audit and shadow_audit records should be retained.

## Minimum policy

### query_audit
Retain enough data for:
- debugging
- trend review
- exclusion review
- latency review

### shadow_audit
Retain enough data for:
- semantic vs hybrid comparison
- canary review
- promotion and rollback evidence

## Recommended operating rule

Keep:
- recent detailed records hot
- older records summarized or archived

## Rule

Retention must support:
- weekly review
- rollback investigation
- production readiness evidence