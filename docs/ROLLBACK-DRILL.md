# ROLLBACK-DRILL

## Purpose

Practice disabling limited active routing for entity-memory without redeploy.

## Trigger examples

Run the drill if any of the following are observed:
- hybrid false positives
- unstable exclusions
- ACL leakage concerns
- latency spike
- benchmark regression

## Procedure

1. Set:
   - ENABLE_OUTAGE_IMPACT_ACTIVE=false
   - ENTITY_MEMORY_ROLLBACK_ENABLED=true

2. Restart or reload the calling service if needed

3. Confirm routing decision:
   - outage impact queries return semantic path
   - hybrid still runs only in shadow if desired
   - chosenPath in shadow audit returns semantic

4. Review:
   - recent shadow_audit records
   - recent query_audit records
   - review endpoints for exclusions and conflicts

## Success condition

The system returns to semantic-authoritative behavior without code changes and without redeploying new logic.