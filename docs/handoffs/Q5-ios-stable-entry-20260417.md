## Slice
Q5 iOS import stability fix: prefer a stable host-based subscription node before random Cloudflare IP candidates.

## Changed
- `_worker.js`: added `构建稳定订阅入口优先列表` and used it in the local `/sub` generation path so the subscription starts with the current host on the default TLS port.
- `tests/worker.test.js`: added focused coverage for the stable-entry ordering helper while preserving the existing loader and compatibility contracts.

## Release Marker
- Commit: 19219d2a628c979467228a6e4255ea6f77277966
- Tag: q5-ios-stable-entry-20260417

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- live pre-push inspection confirmed the current public subscription still starts with random CF IP nodes, so this slice needs publish/deploy before rechecking client behavior

## Risks / Open Questions
- This intentionally changes `/sub` node ordering for locally generated subscriptions, but it keeps the same token route, headers, and node format.

## Next Slice
- After deploy, verify the public subscription starts with the stable host entry and retest iOS import before attempting any deeper `/sub` behavior changes.
