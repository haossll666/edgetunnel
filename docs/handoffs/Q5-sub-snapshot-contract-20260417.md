## Slice
Q5 snapshot-contract sub-slice: make `/sub` run on an explicit subscription snapshot that excludes admin-only credentials and config fields.

## Changed
- `_worker.js`: added `提取订阅配置快照` and switched `/sub` to operate on the snapshot after loading the base subscription config.
- `tests/worker.test.js`: added snapshot-shape coverage to confirm the object keeps `/sub`-needed fields and drops admin credentials.
- `docs/NEXT_SLICE_QUEUE.md`: updated the queue to record the snapshot boundary and pause the next deeper Q5 step.

## Release Marker
- Commit: pending
- Tag: pending

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`

## Risks / Open Questions
- The remaining `/sub` code still depends on the snapshot carrying the right transport and output-shaping fields, so any further split needs another contract check before wiring it in.

## Next Slice
- Inspect whether any remaining `/sub` branches can be split from the snapshot without changing response semantics, then gate that with focused tests before editing the worker again.
