## Slice
Tightened deployment defaults and operator guidance for personal free-tier deployments without touching subscription behavior.

## Changed
- `README.md` - made the personal-use defaults more explicit, including `OFF_LOG` guidance for free-tier deployments
- `docs/NEXT_SLICE_QUEUE.md` - promoted the next low-risk slice and marked deployment guidance work as complete

## Release Marker
- Commit: `c79bac9`
- Tag: `q1-deployment-defaults-20260417`

## Verified
- `git diff --check` - pass

## Risks / Open Questions
- `docs/SYSTEM_DESIGN.md` has unrelated pre-existing changes and was intentionally left untouched

## Next Slice
- Reduce non-`/sub` logging pressure in `_worker.js` with targeted tests and docs if behavior changes
