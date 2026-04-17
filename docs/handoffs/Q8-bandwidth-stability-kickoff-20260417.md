## Slice
Bandwidth and stability optimization kickoff

## Changed
- Updated `docs/NEXT_SLICE_QUEUE.md` to introduce Q8 as the next bounded optimization sequence.
- Defined the first planned follow-up slice around stable-default node and route behavior.
- Deferred deeper hot-path observability and KV pressure review until the stable-default direction is clarified.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- Documentation-only change; no runtime verification required yet.

## Risks / Open Questions
- The next code slice should avoid touching `/sub` onboarding semantics unless a contract check is written first.
- We still need to decide whether the first implementation slice is node ordering, route selection, or diagnostic-only.

## Next Slice
- Review the current default node strategy and pick the smallest safe optimization slice that improves first-connect stability.
