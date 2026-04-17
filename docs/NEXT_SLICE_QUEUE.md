# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-8: Keep Cloudflare usage cache coherent on admin saves

Status:
In progress.

Goal:
Keep the Cloudflare usage cache coherent when the operator updates `cf.json`, so the admin dashboard does not keep stale usage state.

Scope:

- `cf.json` save path
- Cloudflare usage cache invalidation
- tests for cache reset behavior

Done when:

- saving `cf.json` clears Cloudflare usage cache
- tests cover the cache reset behavior
- subscription onboarding remains unchanged

## NEXT

### Hold the line after cache invalidation

Status:
Planned.

Goal:
Hold the line here unless a new, clearly beneficial low-risk slice appears.
