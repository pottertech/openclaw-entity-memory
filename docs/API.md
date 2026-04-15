# API Reference

Base URL: `http://localhost:4017/v1`

## Health

### GET /v1/health

Returns service health status.

## Entities

### GET /v1/entities/:xid

Get entity by xid.

Query params:
- tenant_id required
- actor_subject_type optional
- actor_subject_id optional

### GET /v1/entities/resolve

Resolve entity by name.

Query params:
- tenant_id required
- name required
- actor_subject_type optional
- actor_subject_id optional

### GET /v1/entities/:xid/neighbors

Get entity neighbors.

Query params:
- tenant_id required
- actor_subject_type optional
- actor_subject_id optional

## Ingest

### POST /v1/ingest/entities

Ingest entities batch.

Body:
```json
{
  "entities": [
    {
      "xid": "entity_xid",
      "tenantId": "tenant_id",
      "entityType": "Project",
      "canonicalName": "Project Name",
      "status": "active",
      "metadata": {},
      "aliases": [
        { "xid": "alias_1", "alias": "alias name", "aliasType": "name_variant" }
      ]
    }
  ]
}
```

### POST /v1/ingest/edges

Ingest edges batch with evidence.

Body:
```json
{
  "edges": [
    {
      "xid": "edge_xid",
      "tenantId": "tenant_id",
      "edgeType": "DEPENDS_ON",
      "fromEntityXid": "entity_a",
      "toEntityXid": "entity_b",
      "confidence": 0.95,
      "validFrom": "2026-01-01T00:00:00Z",
      "validTo": null,
      "metadata": {},
      "authorityTier": "standard",
      "conflictKey": null,
      "conflictStatus": "active",
      "acl": [
        {
          "xid": "acl_1",
          "subjectType": "agent",
          "subjectId": "brodie",
          "permission": "read",
          "effect": "allow"
        }
      ],
      "evidence": [
        {
          "xid": "ev_1",
          "sourceRef": "doc:source",
          "documentXid": "doc_1",
          "chunkXid": "chk_1",
          "evidenceSpan": {},
          "confidence": 0.95,
          "authorityTier": "standard"
        }
      ]
    }
  ]
}
```

## Query

### POST /v1/query/path

Find path between two entities.

Body:
```json
{
  "tenantId": "tenant_default",
  "from": { "name": "Alice" },
  "to": { "name": "Tuesday Outage" },
  "maxDepth": 4,
  "asOf": "2026-04-15T00:00:00Z",
  "actor": { "subjectType": "agent", "subjectId": "brodie" },
  "minAuthorityTier": "standard"
}
```

### POST /v1/query/hybrid

Answer a natural-language relationship question.

Body:
```json
{
  "tenantId": "tenant_default",
  "question": "Was Alice's project affected by Tuesday's outage?",
  "semanticCandidates": [
    { "text": "Alice is the tech lead on Project Atlas", "documentXid": "doc_1", "chunkXid": "chk_1" },
    { "text": "Project Atlas uses PostgreSQL for its primary datastore", "documentXid": "doc_2", "chunkXid": "chk_8" },
    { "text": "The PostgreSQL cluster went down on Tuesday", "documentXid": "doc_3", "chunkXid": "chk_4" }
  ],
  "actor": { "subjectType": "agent", "subjectId": "brodie" },
  "minAuthorityTier": "standard"
}
```

### POST /v1/query/impact

Find all entities affected by a source through graph traversal.

Body:
```json
{
  "tenantId": "tenant_default",
  "source": { "name": "Tuesday Outage" },
  "targetTypes": ["Project"],
  "maxDepth": 3,
  "asOf": null,
  "actor": { "subjectType": "agent", "subjectId": "brodie" },
  "minAuthorityTier": "standard"
}
```

## Audit

### GET /v1/audit/queries

Return recent query audit records.

Query params:
- tenant_id required
- limit optional, default 25, max 100

Response:
```json
{
  "queries": [
    {
      "xid": "qa_xxx",
      "tenantId": "tenant_default",
      "queryType": "hybrid",
      "queryText": "Was Alice's project affected by Tuesday's outage?",
      "requestJson": {},
      "responseJson": {},
      "status": "ok",
      "durationMs": 14,
      "createdAt": "2026-04-15T00:00:00Z"
    }
  ]
}
```

## Provenance

### GET /v1/provenance/edges/:edgeXid

Return visible provenance for an edge.

Query params:
- tenant_id required
- actor_subject_type optional
- actor_subject_id optional

Response:
```json
{
  "provenance": [],
  "exclusions": []
}
```

### GET /v1/provenance/entities/:entityXid/neighborhood

Return edge neighborhood around an entity.

Query params:
- tenant_id required

Response:
```json
{
  "neighborhood": []
}
```

## Review

### GET /v1/review/conflicts

Return edges participating in conflict groups.

Query params:
- tenant_id required
- conflict_key optional
- limit optional

Response:
```json
{
  "conflicts": []
}
```

## Query Explanation

Both hybrid and impact responses include an explanation field:

```json
{
  "explanation": {
    "exclusions": [
      {
        "kind": "edge",
        "id": "edge_secret_1",
        "reason": "edge_acl_deny",
        "detail": "edge_acl_deny"
      },
      {
        "kind": "entity",
        "id": "entity_hidden",
        "reason": "entity_acl_denied"
      },
      {
        "kind": "document",
        "id": "doc_confidential",
        "reason": "document_acl_denied"
      }
    ]
  }
}
```

Exclusion reasons:
- entity_acl_denied
- edge_acl_deny
- document_acl_denied
- authority_below_threshold
- temporal_window_excluded
- conflict_loser
- missing_entity
- missing_evidence
- unknown