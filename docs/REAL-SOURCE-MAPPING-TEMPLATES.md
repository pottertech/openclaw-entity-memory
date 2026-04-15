# REAL-SOURCE-MAPPING-TEMPLATES.md

## Purpose

Provide concrete templates for mapping real OpenClaw sources into the entity-memory case-pack refresh system.

This document is for Brodie.

The goal is to replace placeholder connectors with the actual source paths used in your stack.

## Source categories

The first rollout requires four source categories:

- incidents
- repo to service mappings
- workflow dependencies
- owner to project mappings

## 1. Incidents source template

### Minimum fields needed

- incidentName
- affectedSystem
- affectedProjects
- owners
- sourceRef
- observedAt

### Example REST shape

GET /incidents/recent

Response:
```json
{
  "incidents": [
    {
      "incidentName": "Tuesday Outage",
      "affectedSystem": "PostgreSQL Cluster",
      "affectedProjects": ["Project Atlas"],
      "owners": ["Alice"],
      "sourceRef": "incident:12345",
      "observedAt": "2026-04-15T12:00:00Z"
    }
  ]
}
```

### Example SQL shape

```sql
SELECT
  incident_name AS "incidentName",
  affected_system AS "affectedSystem",
  affected_projects AS "affectedProjects",
  owners AS "owners",
  source_ref AS "sourceRef",
  observed_at AS "observedAt"
FROM incidents
WHERE observed_at >= NOW() - INTERVAL '30 days';
```

## 2. Repo to service mapping template

### Minimum fields needed

- repoName
- serviceName
- sourceRef
- observedAt

### Example REST shape

GET /repos/service-mappings

Response:
```json
{
  "mappings": [
    {
      "repoName": "auth-repo",
      "serviceName": "Auth Service",
      "sourceRef": "repo-map:auth-repo",
      "observedAt": "2026-04-15T12:00:00Z"
    }
  ]
}
```

### Example SQL shape

```sql
SELECT
  repo_name AS "repoName",
  service_name AS "serviceName",
  source_ref AS "sourceRef",
  observed_at AS "observedAt"
FROM repo_service_map;
```

## 3. Workflow dependency template

### Minimum fields needed

- workflowName
- dependsOn
- sourceRef
- observedAt

### Example REST shape

GET /workflows/dependencies

Response:
```json
{
  "dependencies": [
    {
      "workflowName": "Order Workflow",
      "dependsOn": "Auth Service",
      "sourceRef": "workflow:order-workflow",
      "observedAt": "2026-04-15T12:00:00Z"
    }
  ]
}
```

### Example SQL shape

```sql
SELECT
  workflow_name AS "workflowName",
  depends_on AS "dependsOn",
  source_ref AS "sourceRef",
  observed_at AS "observedAt"
FROM workflow_dependencies;
```

## 4. Owner to project mapping template

### Minimum fields needed

- ownerName
- projectName
- sourceRef
- observedAt

### Example REST shape

GET /owners/project-mappings

Response:
```json
{
  "mappings": [
    {
      "ownerName": "Alice",
      "projectName": "Project Atlas",
      "sourceRef": "owner-map:alice-atlas",
      "observedAt": "2026-04-15T12:00:00Z"
    }
  ]
}
```

### Example SQL shape

```sql
SELECT
  owner_name AS "ownerName",
  project_name AS "projectName",
  source_ref AS "sourceRef",
  observed_at AS "observedAt"
FROM owner_project_map;
```

## Mapping rules

Brodie should follow these rules:

- keep field names aligned with connector contracts
- normalize arrays before they enter the case generator
- include stable sourceRef whenever possible
- include observedAt whenever possible
- reject malformed records early
- do not infer missing owners or projects silently

## Rollout note

Start by wiring one real source at a time:
1. incidents
2. owners
3. repos
4. workflows