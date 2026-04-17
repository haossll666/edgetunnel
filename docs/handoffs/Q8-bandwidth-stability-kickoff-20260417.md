## Slice
Hot-path observability and KV pressure review

## Changed
- Added `读取TG配置()` in `_worker.js` so repeated `/sub` Telegram notification config reads are cached in memory for five minutes.
- Kept the `/sub` output contract intact while removing one repeat KV read from the hot path.
- Added a focused test in `tests/worker.test.js` to verify the TG config cache boundary.
- Updated `docs/NEXT_SLICE_QUEUE.md` to mark the hot-path observability slice complete and queue route diagnostics next.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- The next slice should stay on the hot-path cost side and avoid re-opening the `/sub` contract.
- We should decide whether route diagnostics should be pure docs or include a tiny runtime helper.

## Next Slice
- Review route diagnostics and recovery notes with the new TG KV cache already in place.
