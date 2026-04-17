# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-5: Evaluate whether route diagnostics need runtime helpers

Status:
Completed.

Goal:
Provide an admin-only read-only diagnostics view so recovery does not depend on memory.

Scope:

- admin diagnostics route
- route and recovery notes
- tests for the diagnostics view

Done when:

- `/admin/diagnostics` returns a safe read-only summary
- tests cover the diagnostics view structure
- the onboarding contract remains intact

## NEXT

### Q8-6: Review whether any remaining optimization is worth the complexity

Status:
Planned.

Goal:
Decide whether there is still a worthwhile optimization slice that does not re-open subscription risk.

Scope:

- docs, logging, or operator-UX refinements only
- avoid reopening `/sub` contract or admin QR onboarding risk
