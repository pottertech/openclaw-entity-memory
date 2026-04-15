# SHADOW-EVALUATION-REPORT-TEMPLATE

## Purpose

Standard report template for reviewing semantic versus hybrid shadow results.

## Header

- report date
- tenant
- query class
- time window
- reviewer

## Summary

- total cases
- semantic accuracy
- hybrid accuracy
- delta
- median semantic latency
- median hybrid latency
- false positives observed
- major exclusion categories

## Table

For each case include:
- case name
- question
- expected answer
- semantic answer
- hybrid answer
- semantic confidence
- hybrid confidence
- semantic evidence count
- hybrid evidence count
- hybrid path length
- hybrid exclusion count
- preferred path
- verdict
- notes

## Review notes

- where hybrid was clearly better
- where semantic remained safer
- any ACL or evidence visibility concerns
- any conflict-resolution anomalies

## Decision

Choose one:
- remain in shadow mode
- promote limited active for this class
- rollback to semantic only