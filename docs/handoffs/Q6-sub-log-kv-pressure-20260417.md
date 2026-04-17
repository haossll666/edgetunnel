## Slice
Reduced `/sub` KV logging pressure by short-circuiting repeated `Get_SUB` log writes in memory before they hit KV, while keeping the first hit observable and leaving subscription content unchanged.

## Changed
- `_worker.js` - added a dedicated `Get_SUB` repeat-log cache and skipped redundant KV reads/writes for repeated subscription logs
- `tests/worker.test.js` - added regression coverage for the `Get_SUB` cache path and the existing non-sub log dedupe helper
- `README.md` - documented the new `Get_SUB` log de-duplication behavior for operators
- `docs/NEXT_SLICE_QUEUE.md` - promoted the next admin/static fallback slice

## Release Marker
- Commit: `7659c10`
- Tag: `q6-sub-log-kv-pressure-20260417`

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js` - pass
- `node --test tests/security.test.js` - pass
- `node --test tests/admin_compatibility.test.js` - pass
- `git diff --check` - pass

## Risks / Open Questions
- The cache is isolate-local, so cold starts still fall back to the existing KV-backed path
- Repeated `Get_SUB` events are now less noisy in KV, which is intentional but should be called out if an operator expects every duplicate hit to be persisted
- `docs/SYSTEM_DESIGN.md` still has unrelated pre-existing changes and was intentionally left untouched

## Next Slice
- Q7: Broaden admin/static local fallback coverage without touching subscription output
