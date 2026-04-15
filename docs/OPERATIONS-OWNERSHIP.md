# OPERATIONS-OWNERSHIP.md

## Purpose

Define who owns outage-impact hybrid memory in production or limited-active mode.

## Ownership areas

### Engineering owner
Responsible for:
- code changes
- migrations
- bug fixes
- backend behavior
- rollback support

### Operations owner
Responsible for:
- dashboard review
- alert review
- canary decisions
- rollback initiation
- weekly review process

### Product or policy owner
Responsible for:
- deciding whether outage-impact remains active
- approving expansion to second class
- accepting known limitations

## Rule

Do not run this capability without named ownership in all three areas.