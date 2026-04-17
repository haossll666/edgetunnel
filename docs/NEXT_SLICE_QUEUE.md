# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-6: Review whether any remaining optimization is worth the complexity

Status:
Completed.

Goal:
Decide whether there is still a worthwhile optimization slice that does not re-open subscription risk.

Scope:

- docs, logging, or operator-UX refinements only
- avoid reopening `/sub` contract or admin QR onboarding risk

Done when:

- the repository has an explicit stop point for remaining low-risk work
- the queue only retains work that clearly earns its complexity
- the onboarding contract remains intact

## NEXT

### No further low-risk optimization slices

Status:
Planned.

Goal:
Hold the line here unless a new, clearly beneficial low-risk slice appears.
