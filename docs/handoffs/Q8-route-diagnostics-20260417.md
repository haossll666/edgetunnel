## Slice
Route diagnostics runtime helper

## Changed
- Added `/admin/diagnostics` as a read-only admin-only JSON helper that summarizes recovery entrypoints without exposing secrets.
- Added `生成管理诊断视图()` and a focused test to lock the helper structure.
- Kept the `/sub` output and onboarding contract intact while giving the operator a faster recovery path.
- Updated `docs/NEXT_SLICE_QUEUE.md` to mark the runtime diagnostics slice complete and queue the final optimization review.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- The new helper is admin-only and read-only, but we should still keep an eye on whether it is actually used.
- The next slice should stay outside `/sub` unless a fresh contract review is performed.

## Next Slice
- Review whether any remaining optimization is worth the complexity before touching runtime again.
