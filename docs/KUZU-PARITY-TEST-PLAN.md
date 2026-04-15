# KUZU-PARITY-TEST-PLAN.md

## Purpose

Define how to compare Kuzu graph execution against the current in-memory backend.

## Goal

Kuzu should not become active until it demonstrates acceptable parity with in-memory results on core query types.

## Query types to test

- neighbors query
- bounded path query
- top path query
- outage-impact relationship chain
- direct dependency chain

## Parity dimensions

Compare:
- path existence
- path length
- edge sequence
- top path choice
- latency
- repeatability

## Minimum test cases

- Alice -> Project Atlas -> PostgreSQL Cluster -> Tuesday Outage
- auth-repo -> Auth Service
- Order Workflow -> Auth Service

## Success criteria

Kuzu is acceptable for broader testing when:
- core path existence matches in-memory
- core edge sequence matches in-memory
- no obvious missing neighbors
- latency is acceptable for test scale

## Rule

Keep in-memory as baseline until Kuzu parity is documented.