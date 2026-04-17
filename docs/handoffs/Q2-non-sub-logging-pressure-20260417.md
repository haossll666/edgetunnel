## Slice
Reduced non-`/sub` logging pressure by short-circuiting repeated admin/security log writes before they hit KV, while keeping first-seen visibility intact.

## Changed
- `_worker.js` - added an in-memory cache for repeated non-`Get_SUB` log signatures and skipped redundant KV reads/writes within the cache window
- `tests/worker.test.js` - added regression coverage for the new non-sub log skip helper
- `docs/NEXT_SLICE_QUEUE.md` - promoted the next low-risk slice

## Release Marker
- Commit: `baf3111`
- Tag: `q2-non-sub-logging-pressure-20260417`

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js` - pass
- `node --test tests/security.test.js` - pass
- `git diff --check` - pass

## Risks / Open Questions
- The cache is isolate-local, so cold starts still fall back to the existing KV-backed dedupe path
- `docs/SYSTEM_DESIGN.md` still has unrelated pre-existing changes and was intentionally left untouched

## Next Slice
- Extend admin fallback coverage for login/noADMIN/noKV routes without changing auth semantics
