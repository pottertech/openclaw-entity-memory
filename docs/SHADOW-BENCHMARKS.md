# SHADOW-BENCHMARKS

## Purpose

Define how to compare A-RAG-only and hybrid entity-memory answers during shadow mode.

## Metrics

For each case capture:
- expected answer
- hybrid answer
- semantic answer
- answer agreement
- path length
- visible evidence count
- hidden evidence count
- exclusion count
- latency ms
- confidence

## Comparison goals

The hybrid layer should outperform semantic-only retrieval on:
- multi-hop dependency questions
- outage impact analysis
- ownership chains
- policy linkage
- lineage questions

## Report format

Each benchmark row should include:
- case name
- question
- expected answer
- semantic result
- hybrid result
- verdict
- notes

## Initial threshold

Do not promote to production routing until:
- hybrid answer accuracy is materially better on relationship cases
- latency is acceptable
- exclusion explanations are stable
- false positives are low

## Side-by-side requirement

Benchmarking should compare:
- semantic-only result
- hybrid result

A benchmark is incomplete if it measures only hybrid output without a baseline.

## Expanded fixture guidance

Use a broader case pack before promotion.

Minimum recommended coverage:
- outage impact
- dependency chains
- repo to service links
- policy linkage
- team ownership
- customer exposure
