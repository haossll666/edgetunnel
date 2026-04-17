# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-2: Hot-path observability and KV pressure review

Status:
Completed.

Goal:
Reduce hot-path KV reads and keep operator-facing logging useful without paying unnecessary repetition cost.

Scope:

- `/sub` logging pressure
- Telegram config read caching
- route-level diagnostics and recovery notes

Done when:

- repeated `tg.json` reads are cached in memory
- tests cover the cache boundary
- the onboarding contract remains intact

## NEXT

### Q8-3: Route diagnostics and recovery notes

Status:
Planned.

Goal:
Decide whether the next gain should come from lighter `/sub` diagnostics or from operator-facing recovery guidance.

Scope:

- route-level diagnostics
- operator recovery notes
- potential follow-up logging refinements
