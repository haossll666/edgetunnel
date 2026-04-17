## Slice
Clarified the safe local worker verification entrypoint so future sessions can keep using the documented Cloudflare-compatible test command.

## Changed
- `tests/loader.mjs` - added a one-line comment pointing at the documented worker-compatible local test command
- `docs/IMPLEMENTATION_PLAN.md` - documented the exact worker test command in Task 5
- `docs/NEXT_SLICE_QUEUE.md` - moved the queue past the completed low-risk slices and into the remaining blocked work

## Release Marker
- Commit: `ea8398c`
- Tag: `q4-worker-test-entrypoint-20260417`

## Verified
- `node --loader ./tests/loader.mjs --test tests/worker.test.js` - pass
- `node --test tests/security.test.js` - pass
- `git diff --check` - pass

## Risks / Open Questions
- Remaining queue items are blocked behind `/sub` contract work or broader admin fallback coverage
- `docs/SYSTEM_DESIGN.md` still has unrelated pre-existing changes and was intentionally left untouched

## Next Slice
- Q5: Redesign config-loading split for `/sub` once the contract and verification story are ready
