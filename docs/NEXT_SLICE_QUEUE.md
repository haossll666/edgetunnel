# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q5: Separate route-intent config-loading entrypoints

Status:
Completed for the explicit entrypoint slice. The next Q5 sub-slice is paused because it can affect `/sub` output semantics.

Goal:
Make the `/sub` and admin config-loading contracts explicit before any deeper `/sub` redesign.

Scope:

- `_worker.js` route-intent config loader entrypoints
- targeted config-loading contract tests
- queue/handoff updates for the next Q5 pause point

Done when:

- `/sub` calls a named base-config entrypoint instead of passing boolean flags inline
- admin and admin reset paths call named admin-config entrypoints
- tests verify the base/admin/reset loading boundaries without changing subscription output

## NEXT

### Q5 follow-up: define a `/sub` snapshot contract for deeper config slimming

Status:
Paused pending the next high-risk review point. The next slice should define what `/sub` still needs from `读取config_JSON()` before any further split of CF usage or admin-oriented fields.

### Q6: keep `/sub` logging pressure changes stable behind the new boundary

Status:
Shipped earlier, but do not widen `/sub` changes again until the next Q5 contract slice is agreed and verified.
