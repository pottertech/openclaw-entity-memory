# CANARY-DASHBOARD-SPEC

## Purpose

Define the first dashboard for limited-active outage-impact canary monitoring.

## Top metrics

- total outage-impact queries
- semantic chosen count
- hybrid chosen count
- rollback enabled state
- hybrid preference rate
- same-answer rate
- average hybrid latency
- average semantic latency
- exclusion count by reason

## Breakdown sections

### Routing summary
- active true or false
- query class
- chosen path counts

### Quality summary
- semantic correctness estimate
- hybrid correctness estimate
- same-answer rate
- preferred-path rate

### Exclusion summary
Show counts for:
- entity_acl_denied
- edge_acl_deny
- document_acl_denied
- authority_below_threshold
- temporal_window_excluded
- conflict_loser
- missing_evidence

### Audit summary
- recent shadow audit rows
- recent verdict trends
- rollback state history

## Decision panel

Show one of:
- stay shadow
- continue canary
- promote class
- rollback now

## Minimum API source for dashboard

The dashboard should be backed by:
- shadow_audit
- query_audit
- threshold calculations
- exclusion summaries