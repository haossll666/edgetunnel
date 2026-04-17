## Slice
Route diagnostics and recovery notes

## Changed
- Added a mainland-oriented troubleshooting tip to `README.md` that walks through `/admin`, `/admin/config.json`, and `/sub?token=...` in order.
- Updated `docs/NEXT_SLICE_QUEUE.md` to mark the route diagnostics slice complete and queue follow-up logging refinements.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- Documentation-only change; no runtime verification required.

## Risks / Open Questions
- The next slice should stay inside operator guidance or logging refinements unless a concrete runtime benefit is clear.
- We still should avoid changing `/sub` output or onboarding semantics without a fresh contract check.

## Next Slice
- Review whether any remaining logging refinements are worth the hot-path cost before touching runtime again.
