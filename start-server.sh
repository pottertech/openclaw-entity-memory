#!/bin/bash
cd ~/.openclaw/workspace/repos/openclaw-entity-memory
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openclaw_entity_memory"
exec node dist/src/index.js