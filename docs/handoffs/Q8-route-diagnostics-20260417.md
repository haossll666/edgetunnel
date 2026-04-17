## Slice
Follow-up logging refinements

## Changed
- Added `是否启用日志记录()` in `_worker.js` so OFF_LOG now short-circuits the `/sub` logging path before `tg.json` is read.
- Added a test to make sure OFF_LOG disables logging at the gate level.
- Kept the `/sub` output and onboarding contract intact while removing a repeat hot-path log branch.
- Updated `docs/NEXT_SLICE_QUEUE.md` to mark the follow-up logging slice complete and queue the next diagnostics decision.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- The next slice should stay inside operator guidance or logging refinements unless a concrete runtime benefit is clear.
- We still should avoid changing `/sub` output or onboarding semantics without a fresh contract check.

## Next Slice
- Decide whether route diagnostics need any runtime helper at all, or should remain docs-only.
