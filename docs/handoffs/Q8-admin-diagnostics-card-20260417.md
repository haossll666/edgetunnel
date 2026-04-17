## Slice
Admin diagnostics card entry

## Changed
- Added a `/admin/diagnostics` card to the local admin shell fallback.
- Added a regression test to keep the diagnostics card visible in the fallback UI.
- Kept the change admin-only and out of the `/sub` contract path.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- The queue is intentionally exhausted for low-risk slices; anything beyond this should go through a fresh contract check.

## Next Slice
- Stop unless a new low-risk admin-only improvement appears with clear value.
