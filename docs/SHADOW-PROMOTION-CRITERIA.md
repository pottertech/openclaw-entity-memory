# SHADOW-PROMOTION-CRITERIA

## Purpose

Define when hybrid entity-memory may be promoted from shadow mode to active routing.

## Promotion requirements

Hybrid should only be promoted for a query class when all of the following are true:

1. Accuracy improvement
   Hybrid materially outperforms semantic-only on the target query class.

2. Stable exclusions
   Exclusion explanations are consistent and understandable.

3. Acceptable latency
   Hybrid latency remains within acceptable operational limits.

4. Low false positives
   Hybrid does not invent unsupported relationships.

5. Good provenance coverage
   Returned answers include sufficient visible evidence.

## Suggested thresholds

These are starting thresholds, not permanent rules.

- hybrid accuracy exceeds semantic baseline by at least 10 percentage points on relationship cases
- hybrid false positive rate stays below 3 percent
- median latency stays below 2x semantic baseline for target query class
- visible evidence exists for most returned paths
- exclusion reasons are stable across repeated runs

## Promotion method

Promote per query class, not globally.

Example classes:
- outage impact
- dependency reasoning
- ownership chains
- policy linkage
- workflow lineage

## Rollback rule

If hybrid quality regresses:
- disable active routing for the affected class
- continue shadow collection
- investigate exclusions, ACL filters, and conflict winners