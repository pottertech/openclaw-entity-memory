# REAL-SEMANTIC-BASELINE-NOTES

## Purpose

Describe how the semantic baseline should be sourced from the real Open-Brain or A-RAG retrieval path.

## Rule

The semantic baseline must come from the same retrieval and ranking path used in production.

Do not use:
- hand-written answers
- mock candidates
- alternate retrieval systems not used in production

## Recommended shape

The baseline endpoint should:
1. retrieve top semantic candidates
2. produce a semantic-only answer
3. return evidence used for that answer
4. avoid graph traversal
5. avoid entity-memory reasoning

## Why this matters

Promotion decisions are only trustworthy if semantic and hybrid are compared against the real production semantic path.