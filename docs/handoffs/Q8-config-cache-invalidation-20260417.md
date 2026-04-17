## Slice
Config cache invalidation after admin saves

## Changed
- Cleared the in-memory TG and CF config caches after admin saves to `config.json`, `cf.json`, and `tg.json`.
- Kept the existing short-lived KV read caching while removing stale-value windows after operator updates.
- Added a regression test to confirm cache cleanup invalidates both cached config objects.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- This stays admin-side and does not alter `/sub` content or QR onboarding.

## Next Slice
- Stop unless a new low-risk optimization slice shows a clear benefit.
