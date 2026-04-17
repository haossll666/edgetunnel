# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q5: Redesign config-loading split for `/sub`

Status:
Blocked until the contract and verification story are stronger.

Goal:
Redesign config-loading so the subscription path can stay lean without risking `/sub` compatibility.

Scope:

- `_worker.js`
- contract-first tests
- supporting docs once the contract is clear

## NEXT

### Q6: Reduce `/sub` KV logging cost directly

Status:
Blocked behind Q5 because the previous attempt caused runtime regression.

## LATER

### Q7: Broaden admin/static local fallback coverage

Status:
Only after the narrow admin fallback path is fully covered and stable.
