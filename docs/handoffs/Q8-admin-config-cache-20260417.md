## Slice
Admin config KV cache

## Changed
- Added in-memory caching for `cf.json` alongside the existing `tg.json` cache.
- Kept admin/config loading behavior intact while reducing repeat KV reads on admin-heavy paths.
- Added regression coverage for both TG and CF cache boundaries, with explicit cache cleanup for test isolation.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- This only reduces admin-side KV pressure; it does not change `/sub` output or onboarding flow.

## Next Slice
- Stop unless a new low-risk stability or bandwidth slice appears.
