# MONTHLY-GOVERNANCE-REVIEW.md

## Purpose

Provide a monthly governance review template for the canary and any limited-active query classes.

## Inputs

- weekly canary review notes
- dashboard trends
- alert history
- threshold summaries
- shadow audit summaries
- rollback drill status
- source refresh health
- backend comparison status

## Review questions

1. Is the approved query class still healthy?
2. Are alerts recurring or isolated?
3. Are exclusions stable and understandable?
4. Are source mappings reliable?
5. Has Kuzu parity improved enough for more testing?
6. Is a second class ready for shadow?
7. Is any active class showing signs of regression?

## Decisions

Choose one or more:
- continue unchanged
- keep in shadow only
- expand second class in shadow
- expand limited active
- pause expansion
- rollback active class