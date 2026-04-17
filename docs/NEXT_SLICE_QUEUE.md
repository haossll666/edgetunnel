# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-1: Stable-default node and route strategy

Status:
Completed.

Goal:
Keep the stable main entry first in mixed subscriptions so first-connect behavior is less likely to start on a brittle IP node.

Scope:

- stable subscription first entry ordering
- tests for the stable first-entry helper
- keep the onboarding contract unchanged

Done when:

- stable LINK is prepended before other mixed subscription entries
- tests guard the stable first-entry helper
- existing admin QR onboarding and `/sub` semantics remain intact

## NEXT

### Q8-2: Hot-path observability and KV pressure review

Status:
Planned.

Goal:
Inspect which logs or KV reads can be reduced further on hot paths once the stable-default strategy is in place.

Scope:

- `/sub` logging pressure
- route-level diagnostics
- operator recovery notes
