# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q2: Reduce non-`/sub` logging pressure

Goal:
Keep security-relevant and admin-relevant visibility while avoiding unnecessary KV churn outside the subscription hot path.

Scope:

- `_worker.js`
- targeted tests
- docs if behavior changes

Done when:

- `/sub` output is unchanged
- admin/security visibility remains intact
- unnecessary KV writes are reduced outside the subscription hot path

## NEXT

### Q3: Extend admin fallback coverage

Goal:
Reduce operator lockout risk when external static pages are unavailable.

Scope:

- login/noADMIN/noKV fallback strategy
- tests and docs tied to those routes

Guardrails:

- keep auth semantics stable
- keep `/admin` QR onboarding intact

### Q4: Improve local worker verification entrypoint

Goal:
Make the safe local test command obvious so future sessions do not drift.

Scope:

- `tests/loader.mjs`
- worker-related tests
- docs

## LATER

### Q5: Redesign config-loading split for `/sub`

Status:
Blocked until the contract and verification story are stronger.

### Q6: Reduce `/sub` KV logging cost directly

Status:
Blocked behind Q5 because the previous attempt caused runtime regression.

### Q7: Broaden admin/static local fallback coverage

Status:
Only after the narrow admin fallback path is fully covered and stable.
