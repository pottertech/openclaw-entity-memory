# LIMITED-ACTIVE-GATE

## Purpose

Define the first limited active routing gate for openclaw-entity-memory.

## Initial active query class

Start with one narrow class only:

- outage impact questions

Examples:
- Which projects were affected by the Tuesday outage?
- Was Alice's project affected by the Postgres outage?
- Which workflows depended on the failed connector?

## Why this class first

This class:
- is strongly relationship-shaped
- benefits from multi-hop reasoning
- is easier to validate
- has clear business value

## Activation requirements

Before enabling limited active routing for outage impact:
- shadow benchmarks show clear improvement over semantic-only
- false positives remain low
- exclusions are stable
- evidence visibility is acceptable
- rollback rule is documented

## Runtime behavior

For approved outage-impact queries:
- hybrid result may become the returned answer
- semantic result should still be logged for comparison
- query audit must record both paths
- rollback switch must exist

## Rollback trigger

Return to shadow mode if:
- hybrid answers regress
- exclusions become unstable
- ACL problems appear
- latency exceeds acceptable range
