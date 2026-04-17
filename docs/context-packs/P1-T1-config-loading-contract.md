# Context Pack: P1-T1 Separate Base Config Loading From Admin Enrichment

## Task

- Task ID: P1-T1
- Lane: A
- Objective: make `/sub` read only the configuration it actually needs, instead of paying for admin-oriented enrichment work on the hot path

## Success Criteria

- [ ] `/sub` no longer depends on Cloudflare usage lookup or admin-only enrichment
- [ ] the config-loading contract becomes easier to reason about than the current all-in-one `读取config_JSON()` flow
- [ ] subscription response behavior stays compatible for existing consumers

## Relevant Files

- `_worker.js`
- `tests/worker.test.js`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/decisions/ADR-001-reliability-first-on-cf-free-tier.md`

## Pattern to Follow

- Keep the change as one vertical slice
- Prefer extracting a smaller pure config path over adding more conditionals to the current monolith
- Follow the repo rule that a slice should stay mergeable and verifiable on its own

## Constraints

- Stay on Cloudflare Workers free tier
- Do not introduce Durable Objects, D1, or external always-on services
- Do not change auth behavior in the same slice
- Do not change admin page fallback behavior in the same slice
- Avoid widening the surface area of `_worker.js` if a simpler contract split works

## Suggested Ownership

- Builder agent:
  - `_worker.js`
- Reviewer / verifier agent:
  - `tests/worker.test.js`
  - review notes only, unless a new test is explicitly assigned

## Verification

- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- targeted code inspection of the `/sub` path around config loading

## Out of Scope

- admin page fallback rewrite
- README restructuring
- large-scale `_worker.js` modularization
- logging policy changes beyond what is strictly required for the contract split

## Expected Artifact

- a small code change that separates base config loading from admin enrichment
- minimal test coverage or updated verification notes proving the new boundary

## Handoff Required

Use [docs/handoffs/TEMPLATE.md](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/handoffs/TEMPLATE.md)
