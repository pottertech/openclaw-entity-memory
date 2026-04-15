# PRODUCTION-READINESS-CHECKLIST

## Purpose

Checklist for moving openclaw-entity-memory from development and shadow mode toward production use.

## Query quality

- [ ] relationship cases defined
- [ ] benchmark fixture set exists
- [ ] shadow reports run consistently
- [ ] hybrid accuracy validated
- [ ] false positives reviewed
- [ ] exclusion explanations reviewed

## Governance

- [ ] tenant filtering verified
- [ ] entity ACL verified
- [ ] edge ACL verified
- [ ] document ACL verified
- [ ] deny precedence verified
- [ ] authority tiers verified
- [ ] audit trail available

## Reliability

- [ ] health endpoint stable
- [ ] ready endpoint stable
- [ ] migrations repeatable
- [ ] seed fixtures reproducible
- [ ] benchmark scripts reproducible
- [ ] error handling reviewed

## Operability

- [ ] review endpoints working
- [ ] query audit retention plan defined
- [ ] shadow logs available
- [ ] benchmark report format stable
- [ ] rollout and rollback rules defined

## Integration

- [ ] Open-Brain contract stable
- [ ] orchestrator routing rules documented
- [ ] shadow caller implemented
- [ ] semantic baseline available
- [ ] promotion criteria agreed