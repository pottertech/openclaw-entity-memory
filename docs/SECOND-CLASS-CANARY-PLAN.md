# SECOND-CLASS-CANARY-PLAN.md

## Purpose

Plan the first expansion beyond outage-impact canary.

## Chosen second class

- direct dependency questions

Examples:
- Does auth-repo implement Auth Service?
- Does Order Workflow depend on Auth Service?
- Which repos depend on Auth Service?

## Why this class

- relationship-shaped
- easier to validate than policy or customer exposure
- lower ambiguity
- lower risk than broader graph reasoning

## Entry conditions

Only start after outage-impact canary is stable:
- threshold endpoint healthy
- alert history stable
- weekly reviews complete
- rollback drill already practiced
- source refresh healthy

## Shadow-first rule

Second class begins in shadow only.

Do not start second class in limited active immediately.

## Promotion path

1. shadow only
2. compare semantic and hybrid
3. review exclusions
4. define thresholds
5. limited active only after approval