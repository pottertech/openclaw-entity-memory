# SOURCE-ADAPTER-CONFIG-TEMPLATES.md

## Purpose

Show Brodie how to configure real source adapters for OpenClaw environments.

## General rules

- keep secrets in environment variables
- do not hardcode source URLs
- keep one config block per source category
- prefer read-only credentials
- validate connectivity before scheduled refresh is enabled

## Incidents source template

Environment:
- OPENCLAW_INCIDENTS_BASE_URL
- OPENCLAW_INCIDENTS_API_KEY

Example:
```
OPENCLAW_INCIDENTS_BASE_URL=https://internal.example.com
OPENCLAW_INCIDENTS_API_KEY=...
```

Expected endpoint:
GET /api/incidents/recent

## Repos source template

Environment:
- OPENCLAW_REPOS_BASE_URL
- OPENCLAW_REPOS_API_KEY

Expected endpoint:
GET /api/repos/service-mappings

## Workflows source template

Environment:
- OPENCLAW_WORKFLOWS_BASE_URL
- OPENCLAW_WORKFLOWS_API_KEY

Expected endpoint:
GET /api/workflows/dependencies

## Owners source template

Environment:
- OPENCLAW_OWNERS_BASE_URL
- OPENCLAW_OWNERS_API_KEY

Expected endpoint:
GET /api/owners/project-mappings

## Fallback rule

If source-specific URLs are not set:
- fall back to OPENCLAW_SOURCE_BASE_URL
- fall back to OPENCLAW_SOURCE_API_KEY

## Validation checklist

Before enabling a real source:
- endpoint reachable
- response shape validated
- required fields present
- observedAt present where possible
- sourceRef stable