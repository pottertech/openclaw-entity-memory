# ORCHESTRATOR-ROUTING

## Purpose

Define when the orchestrator should call openclaw-entity-memory.

## Routing principle

Use entity-memory for questions that require explicit multi-hop reasoning across entities.

## Strong routing signals

Route to entity-memory when the question includes:
- depends on
- affected by
- impacted by
- who owns
- what connects
- governed by
- blocked by
- related to
- which projects
- which repos
- which customers
- incident
- outage
- policy
- control evidence
- superseded by

## Weak routing signals

Use shadow mode only when:
- one relationship term is present but query may still be semantic
- the question mentions multiple named entities
- the question appears to ask for structural reasoning

## Non-target queries

Do not route to entity-memory first for:
- broad summarization
- single-document Q&A
- pure semantic similarity
- drafting
- translation
- simple fact recall with no multi-hop structure

## Fallback rule

If entity-memory returns:
- no path
- low confidence
- strong exclusions
then orchestrator should keep the semantic answer path and record the hybrid result for review.