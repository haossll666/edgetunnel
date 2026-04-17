# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8-4: Follow-up logging refinements

Status:
Completed.

Goal:
Keep the hot path small by gating unnecessary log work as early as possible.

Scope:

- log-recording gate
- early OFF_LOG short-circuit
- tests for the logging gate

Done when:

- OFF_LOG disables both repeated KV logging and Telegram notification work
- tests cover the logging gate
- the onboarding contract remains intact

## NEXT

### Q8-5: Evaluate whether route diagnostics need runtime helpers

Status:
Planned.

Goal:
Decide whether route diagnostics should remain docs-only or justify a tiny runtime helper.

Scope:

- docs-only diagnostics refinement
- tiny runtime helper only if there is a measurable recovery benefit
