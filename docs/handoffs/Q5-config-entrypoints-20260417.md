## Slice
Q5 contract-first sub-slice: replace inline boolean config-loading calls with explicit route-intent entrypoints for `/sub`, `/admin`, and `admin/init`.

## Changed
- `_worker.js`: added `读取订阅基础配置`, `读取管理配置`, and `重置并读取管理配置`, then switched the `/sub`, `/admin`, and `admin/init` call sites to those named entrypoints.
- `tests/worker.test.js`: moved the contract tests onto the named entrypoints and added reset-path coverage while preserving a direct internal-loader assertion.
- `docs/NEXT_SLICE_QUEUE.md`: recorded this shipped slice and paused the next Q5 step at the next `/sub` contract boundary.

## Release Marker
- Commit: 1c54aa1619f7808e7aa9bcae26369576375a9e2e
- Tag: q5-config-entrypoints-20260417

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`

## Risks / Open Questions
- The next Q5 slice is higher risk because any deeper split of `读取config_JSON()` can change `/sub` output semantics if the remaining required fields are not contract-tested first.

## Next Slice
- Define and test the minimal `/sub` snapshot contract that still has to come from `读取config_JSON()` before attempting a deeper separation of admin-oriented CF usage and subscription generation data.
