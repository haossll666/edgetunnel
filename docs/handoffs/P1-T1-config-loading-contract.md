# Handoff: P1-T1 Separate Base Config Loading From Admin Enrichment

Status: superseded by rollback handoff `rollback-p1-t1-20260417.md`

## Slice

- Task ID: P1-T1
- Lane: A
- Objective completed: `/sub` no longer pays for admin-only config enrichment, while admin routes keep their existing enrichment behavior

## Changed

- `_worker.js` - added an explicit `包含管理扩展` switch to `读取config_JSON()`
- `_worker.js` - updated admin callers to request admin enrichment explicitly
- `_worker.js` - left the subscription path on the lean default path
- `tests/worker.test.js` - added regression tests for subscription-path vs admin-path KV access behavior

## Release Marker

- Commit: `d78f396724f9959f8960079a8b60fd44dae24865`
- Tag: `p1-t1-config-loading-contract-20260417`

## Verified

- `node --loader ./tests/loader.mjs --test tests/worker.test.js` - pass
- `node --test tests/security.test.js` - pass
- `node tests/test_sha224.js` - pass
- Manual checks:
  - confirmed subscription-path config loading only reads `config.json`
  - confirmed admin-path config loading still reads `tg.json` and `cf.json`

## Intentionally Not Touched

- logging policy changes for `Get_SUB`
- admin/static fallback page strategy
- larger `_worker.js` modularization

## Risks / Open Questions

- the new config-loading boundary is now explicit, but the surrounding `_worker.js` route logic is still monolithic
- `Get_SUB` logging still exists and remains the next highest-value hot-path optimization

## Next Slice

- Recommended next task: P1-T2 Reduce `/sub` hot-path KV/logging cost
- Recommended owner lane: A
