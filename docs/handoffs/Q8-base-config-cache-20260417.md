## Slice
Base config KV cache

## Changed
- Added a short-lived in-memory cache for `config.json` reads in `读取config_JSON()`.
- Cleared the base config cache after admin saves to `config.json`, `cf.json`, and `tg.json` so stale values do not linger.
- Added a regression test to confirm repeated base config loads reuse memory within the cache window.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- This is still a cache, so it should remain invalidated on any future admin-side config write path.
- It does not change `/sub` output or onboarding semantics.

## Next Slice
- Stop unless a new low-risk optimization slice appears with clear value.
