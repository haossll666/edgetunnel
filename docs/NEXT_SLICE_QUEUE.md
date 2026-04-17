# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q7: Broaden admin/static local fallback coverage

Status:
Completed.

Goal:
Broaden the local fallback story for admin/static routes without touching subscription output.

Scope:

- admin/static fallback routes
- tests and docs for the fallback contract

Done when:

- `/admin` falls back to a usable local shell when Pages is unavailable
- the existing login/noADMIN/noKV local fallbacks remain intact
- admin QR onboarding and `/sub` output remain untouched

## NEXT

### No active low-risk slices

Status:
Q5/Q6 are blocked behind the `/sub` contract boundary and the current queue has no further low-risk unblocked work.
