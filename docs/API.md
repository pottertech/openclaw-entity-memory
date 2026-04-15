# API

## Purpose

This document defines the phase 1 API for openclaw-entity-memory.

All endpoints are internal service endpoints.

## Conventions

- identifiers use XID-style strings where possible
- all responses are JSON
- all write endpoints are tenant-scoped
- all query endpoints must support tenant filtering
- timestamps use ISO-8601 UTC

## GET /v1/health

Simple health check.

Response:
```json
{ "ok": true }
```

## GET /v1/ready

Dependency readiness check.

Response:
```json
{ "ok": true, "postgres": "up", "graph_adapter": "up" }
```

## GET /v1/entities/:xid

Return canonical entity by ID.

Response:
```json
{
  "entity": {
    "xid": "ent_xxx",
    "tenant_id": "tenant_default",
    "entity_type": "Project",
    "canonical_name": "Project Atlas",
    "status": "active",
    "created_at": "2026-04-15T00:00:00Z",
    "updated_at": "2026-04-15T00:00:00Z"
  }
}
```

## GET /v1/entities/resolve?name=...

Resolve alias or name to canonical entity.

Response:
```json
{
  "match": {
    "xid": "ent_xxx",
    "entity_type": "Datastore",
    "canonical_name": "PostgreSQL Cluster",
    "matched_alias": "postgres"
  },
  "confidence": 0.96
}
```

## GET /v1/entities/:xid/neighbors

Return connected edges and adjacent entities.

Query params:
- edge_type optional
- depth optional, default 1
- as_of optional timestamp

Response:
```json
{
  "center": { "xid": "ent_xxx", "canonical_name": "Project Atlas" },
  "neighbors": [
    {
      "edge_xid": "edge_xxx",
      "edge_type": "DEPENDS_ON",
      "direction": "out",
      "entity": {
        "xid": "ent_pg",
        "entity_type": "Datastore",
        "canonical_name": "PostgreSQL Cluster"
      }
    }
  ]
}
```

## POST /v1/query/path

Find path between entities.

Request:
```json
{
  "tenantId": "tenant_default",
  "from": { "name": "Alice" },
  "to": { "name": "Tuesday Outage" },
  "maxDepth": 4,
  "asOf": "2026-04-15T00:00:00Z"
}
```

Response:
```json
{
  "found": true,
  "path": [
    { "from": "Alice", "edge": "LEADS", "to": "Project Atlas" },
    { "from": "Project Atlas", "edge": "DEPENDS_ON", "to": "PostgreSQL Cluster" },
    { "from": "PostgreSQL Cluster", "edge": "AFFECTED_BY", "to": "Tuesday Outage" }
  ],
  "evidence": [
    { "edge_xid": "edge_1", "document_xid": "doc_1", "chunk_xid": "chk_1" },
    { "edge_xid": "edge_2", "document_xid": "doc_2", "chunk_xid": "chk_8" },
    { "edge_xid": "edge_3", "document_xid": "doc_3", "chunk_xid": "chk_4" }
  ]
}
```

## POST /v1/query/impact

Return affected entities from a source entity or incident.

Request:
```json
{
  "tenantId": "tenant_default",
  "source": { "name": "Tuesday Outage" },
  "targetTypes": ["Project", "Workflow"],
  "maxDepth": 3,
  "asOf": "2026-04-15T00:00:00Z"
}
```

Response:
```json
{
  "source": { "xid": "inc_xxx", "canonical_name": "Tuesday Outage" },
  "affected": [
    {
      "entity": { "xid": "proj_xxx", "entity_type": "Project", "canonical_name": "Project Atlas" },
      "path": [
        { "from": "Project Atlas", "edge": "DEPENDS_ON", "to": "PostgreSQL Cluster" },
        { "from": "PostgreSQL Cluster", "edge": "AFFECTED_BY", "to": "Tuesday Outage" }
      ]
    }
  ]
}
```

## POST /v1/query/hybrid

Combine semantic candidates with entity resolution and graph traversal.

Request:
```json
{
  "tenantId": "tenant_default",
  "question": "Was Alice's project affected by Tuesday's outage?",
  "semanticCandidates": [
    {
      "documentXid": "doc_1",
      "chunkXid": "chk_1",
      "text": "Alice is the tech lead on Project Atlas"
    },
    {
      "documentXid": "doc_2",
      "chunkXid": "chk_8",
      "text": "Project Atlas uses PostgreSQL for its primary datastore"
    },
    {
      "documentXid": "doc_3",
      "chunkXid": "chk_4",
      "text": "The PostgreSQL cluster went down on Tuesday"
    }
  ],
  "asOf": "2026-04-15T00:00:00Z"
}
```

Response:
```json
{
  "answer": "Yes",
  "confidence": "high",
  "entities": [
    { "xid": "usr_alice", "entity_type": "User", "canonical_name": "Alice" },
    { "xid": "proj_atlas", "entity_type": "Project", "canonical_name": "Project Atlas" },
    { "xid": "db_pg", "entity_type": "Datastore", "canonical_name": "PostgreSQL Cluster" },
    { "xid": "inc_tuesday", "entity_type": "Incident", "canonical_name": "Tuesday Outage" }
  ],
  "path": [
    { "from": "Alice", "edge": "LEADS", "to": "Project Atlas" },
    { "from": "Project Atlas", "edge": "DEPENDS_ON", "to": "PostgreSQL Cluster" },
    { "from": "PostgreSQL Cluster", "edge": "AFFECTED_BY", "to": "Tuesday Outage" }
  ],
  "evidence": [
    { "documentXid": "doc_1", "chunkXid": "chk_1" },
    { "documentXid": "doc_2", "chunkXid": "chk_8" },
    { "documentXid": "doc_3", "chunkXid": "chk_4" }
  ],
  "filtersApplied": {
    "tenantId": "tenant_default",
    "acl": true,
    "asOf": "2026-04-15T00:00:00Z"
  }
}
```