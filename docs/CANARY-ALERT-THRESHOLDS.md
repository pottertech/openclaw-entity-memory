# CANARY-ALERT-THRESHOLDS.md

## Purpose

Define the first alert thresholds for the outage-impact canary.

These are operating thresholds, not final policy.

## Alert conditions

Trigger operator review if any of the following occur:

### 1. Same-answer rate drops
- same-answer rate below 0.80 over the most recent review window

### 2. Hybrid preference collapses unexpectedly
- hybrid preference rate drops sharply from prior baseline
- or hybrid becomes preferred with weak evidence patterns

### 3. Exclusion spike
- sudden increase in:
  - missing_evidence
  - document_acl_denied
  - conflict_loser

### 4. Query latency increase
- average hybrid-related query latency materially worse than baseline review window

### 5. Rollback state mismatch
- limited active intended off, but hybrid still chosen
- limited active intended on, but semantic unexpectedly dominates due to config drift

## Severity guidance

### Warning
- threshold crossed once
- continue canary with review

### Action required
- threshold crossed in repeated windows
- review dashboard, shadow audit, exclusions, and recent source refresh

### Rollback recommended
- threshold crossed with false positives or ACL concerns