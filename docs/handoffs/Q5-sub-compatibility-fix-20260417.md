## Slice
Q5 compatibility fix: restore `/sub` behavior for older or minimal KV configs so the admin QR subscription flow works again.

## Changed
- `_worker.js`: backfilled missing `config_JSON.反代` with a safe default shape before the subscription path reads it.
- `tests/worker.test.js`: added a regression test proving an older config without `反代` still loads and `/sub` data remains available.

## Release Marker
- Commit: b0dc72cb4eb522d6142194a4433b5de1f34e606b
- Tag: q5-sub-compat-fix-20260417

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- local smoke test: `/secret` redirect token followed by `/sub?token=...` returned a subscription payload, not the nginx fallback

## Risks / Open Questions
- The snapshot boundary still stands, but the loader now needs to keep backward-compatible defaults for older KV records.

## Next Slice
- Continue only if there is a clear `/sub` contract reason to split more fields; otherwise keep the current snapshot boundary and focus on operator-facing stability.
