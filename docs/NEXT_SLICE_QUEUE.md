# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q4: Improve local worker verification entrypoint

Goal:
Make the safe local test command obvious so future sessions do not drift.

Scope:

- `tests/loader.mjs`
- worker-related tests
- docs

Guardrails:

- keep the worker-compatible local test command documented
- keep route-level regression coverage in place

## NEXT

### Q5: Redesign config-loading split for `/sub`

Status:
Blocked until the contract and verification story are stronger.

### Q6: Reduce `/sub` KV logging cost directly

Status:
Blocked behind Q5 because the previous attempt caused runtime regression.

## LATER

### Q7: Broaden admin/static local fallback coverage

Status:
Only after the narrow admin fallback path is fully covered and stable.
