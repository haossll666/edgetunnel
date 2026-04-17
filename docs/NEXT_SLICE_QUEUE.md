# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q8: Bandwidth and stability optimization kickoff

Status:
Planned.

Goal:
Define the first low-risk optimization slice for bandwidth and connection stability without changing the working subscription onboarding contract.

Scope:

- queue and handoff for the optimization sequence
- contract notes for stable-default node strategy
- observability and recovery guidance

Done when:

- the next slice is explicitly bounded
- the project keeps the current working `/sub` onboarding path intact
- the optimization queue prioritizes stability over aggressive node breadth

## NEXT

### Q8-1: Stable-default node and route strategy

Status:
Planned.

Goal:
Review the current default node ordering and route behavior from a stability-first perspective, then define the smallest safe change that can improve first-connect reliability.

Scope:

- node ordering and default entry selection
- iOS-friendly first-hop behavior
- tests that protect the onboarding contract

## LATER

### Q8-2: Hot-path observability and KV pressure review

Status:
Deferred.

Goal:
Inspect which logs or KV reads can be reduced further on hot paths once the stable-default strategy is in place.

Scope:

- `/sub` logging pressure
- route-level diagnostics
- operator recovery notes
