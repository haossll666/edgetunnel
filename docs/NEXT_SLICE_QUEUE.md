# Next Slice Queue

This queue is the project-level memory for continuous execution.

Update it after every shipped slice.

## NOW

### Q5: Define `/sub` snapshot contract

Status:
Completed for the snapshot-contract slice. The next Q5 sub-slice is paused because any deeper split can affect `/sub` output semantics.

Goal:
Make the `/sub` and admin config-loading contracts explicit before any deeper `/sub` redesign.

Scope:

- `_worker.js` subscription snapshot helper
- targeted snapshot contract tests
- queue/handoff updates for the next Q5 pause point

Done when:

- `/sub` runs against a snapshot that excludes admin credentials and admin-only config fields
- tests verify the snapshot keeps all `/sub`-needed fields and preserves output-compatible data
- admin QR onboarding and `/sub` output remain untouched

## NEXT

### Q5 follow-up: deeper `/sub` slimming beyond the snapshot boundary

Status:
Paused pending the next high-risk review point. The next slice should decide whether the remaining `/sub` fields can be split further without affecting output.

### Q6: keep `/sub` logging pressure changes stable behind the new boundary

Status:
Shipped earlier, but do not widen `/sub` changes again until the next Q5 contract slice is agreed and verified.
