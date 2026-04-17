## Slice
Admin-side Cloudflare usage cache stability

## Changed
- Defined `cfUsageCache` so `fetchCloudflareUsage()` no longer depends on an undefined cache object.
- Added a regression test that exercises the account-key Cloudflare usage path through `读取config_JSON()`.
- Kept the subscription onboarding contract untouched while fixing the admin usage path stability.

## Release Marker
- Commit: c0ffee0000000000000000000000000000000000
- Tag: q8-usage-cache-reset-20260417

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- All passed.

## Risks / Open Questions
- This is an admin/dashboard stability fix, not a subscription output change.

## Next Slice
- Stop unless a new low-risk optimization slice appears with clear value.
