## Slice
Stable-default node and route strategy

## Changed
- Added `生成订阅稳定首项()` in `_worker.js` so mixed subscriptions now prepend the stable `config_JSON.LINK` entry.
- Kept the `/sub` subscription contract intact while making first-connect behavior less likely to start on a brittle IP node.
- Added a focused test in `tests/worker.test.js` to lock the stable-first-entry contract.
- Updated `docs/NEXT_SLICE_QUEUE.md` to mark the stable-default slice complete and queue the next hot-path observability review.

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
- We should decide whether the next optimization is logging pressure or route diagnostics first.

## Next Slice
- Review `/sub` logging and KV pressure with the new stable-first ordering already in place.
