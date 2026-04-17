# edgetunnel Agent Guide

This file gives repository-local guidance for AI coding agents working on `edgetunnel`.

## Mission

Keep `edgetunnel` safe, reliable, and easy to recover for **personal use** on **Cloudflare Workers free tier**.

## Product Direction

Prioritize:

1. Reliability of the core tunnel path
2. Low dependency on third-party services in hot paths
3. Fast diagnosis and recovery when something breaks
4. Predictable behavior on Cloudflare free resources
5. Good operator experience for a single owner

Do **not** prioritize:

1. High concurrency at the cost of complexity
2. Paid-only Cloudflare features
3. More optional features on the critical request path
4. External always-on infrastructure

## Non-Negotiable Constraints

- Stay within Cloudflare Workers free-tier assumptions
- Do not require Durable Objects, D1, Queues, paid Workers, or external long-running services
- Do not add new hot-path network dependencies unless there is a strong reliability win
- Prefer fewer KV writes and fewer external fetches on `/sub`, WebSocket, XHTTP, and gRPC paths
- Default to safe and conservative behavior

## Subscription UX Compatibility

The current operator-critical UX that must not be broken is:

- after logging into `/admin`, the operator can directly scan a QR code on a phone and add the subscription

Treat the following as high-risk compatibility surfaces:

- `/admin/config.json`
- `config_JSON.LINK`
- `/sub?token=...`
- token generation
- UUID mapping
- host/path/protocol fields used for node generation

Rules:

- Do not modify these surfaces without an explicit compatibility check
- Prefer adding tests and documentation before touching implementation
- If a change would require the operator to re-add subscriptions, escalate before merging

## Known Project Risks

Current codebase realities future agents should account for:

1. `_worker.js` is a large monolith, so scope discipline matters
2. `/sub` currently depends on logic that also enriches admin-oriented data
3. Admin/static pages currently depend on external hosted content
4. KV logging is heavier than ideal for a free-tier personal deployment
5. Tests are lightweight and Cloudflare runtime compatibility is only partially modeled

## Flow Engineering Workflow

Every non-trivial session should follow this sequence:

1. Define the session objective
   - One clear slice only
   - Write success criteria before edits
2. Load minimal context
   - Read this file
   - Read [docs/IMPLEMENTATION_PLAN.md](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/IMPLEMENTATION_PLAN.md)
   - Read the relevant ADR in `docs/decisions/`
   - Read only the source/test files needed for the slice
3. Choose the execution lane
   - Core path
   - Admin/resilience
   - Test harness
   - Docs/operator UX
4. Assign ownership
   - One agent owns one write set
   - Shared contracts are defined before parallel work starts
5. Implement incrementally
   - One vertical slice at a time
   - Verify before widening scope
6. Leave a handoff
   - What changed
   - What passed
   - What remains
   - Next recommended slice

## Multi-Agent Coordination Rules

### Roles

- **Integrator agent**
  - Owns plans, ADRs, sequencing, and final integration
  - Resolves file ownership conflicts
- **Worker agent**
  - Owns one bounded implementation slice
  - Must not modify files outside its assigned write set
- **Explorer agent**
  - Reads code/docs and reports findings
  - Does not edit files

### Write Sets

Use disjoint write scopes whenever possible:

- **Lane A: Core data path**
  - `_worker.js`
  - Route and config-loading tests
- **Lane B: Admin and resilience UX**
  - `_worker.js`
  - admin/static fallback docs
- **Lane C: Test harness**
  - `tests/loader.mjs`
  - `tests/*.test.js`
- **Lane D: Docs and operator guidance**
  - `README.md`
  - `docs/**`
  - `AGENTS.md`

Because `_worker.js` is shared, do not run two editing agents against it at the same time unless one is limited to a clearly isolated section and the contract is already agreed.

### Parallelization Rules

Safe to parallelize:

- docs + ADR work
- tests for an already-defined behavior contract
- implementation in different files with no overlapping ownership

Must stay sequential:

- changes that alter `/sub` request semantics
- changes that alter auth/session behavior
- changes that alter the config-loading contract
- changes that can affect admin QR-based subscription onboarding

Needs contract-first coordination:

- splitting `读取config_JSON()` behavior
- changing logging policy
- changing admin/static page serving strategy

## Current Preferred Execution Order

1. Define contract for reliability-first behavior
2. Slim the `/sub` path and config-loading path
3. Reduce admin/static external dependency risk
4. Reduce KV write amplification and sharpen observability
5. Strengthen local test harness
6. Refresh operator docs and deployment defaults

## Context Pack for New Agents

When starting a fresh session, load context in this order:

1. `AGENTS.md`
2. `docs/IMPLEMENTATION_PLAN.md`
3. `docs/decisions/ADR-001-reliability-first-on-cf-free-tier.md`
4. The smallest relevant code slice in `_worker.js`
5. Only the test files related to that slice

Do not dump the whole repository into context if only one route or helper is changing.

## Commands

Current locally verified commands:

- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node tests/test_sha224.js`

Use targeted verification first. Widen only when the changed behavior requires it.

## Git And Rollback Discipline

- Every commit must have a corresponding annotated git tag
- Create the tag immediately after the commit and before or together with pushing
- Tags are mandatory because rollback must be possible within seconds if a slice breaks the system
- Prefer tags that identify both the slice and the date, for example:
  - `p1-t2-sub-logging-20260417`
  - `admin-fallback-20260417`
- Handoffs must record both:
  - commit SHA
  - tag name
- Do not leave important changes in remote history without a tag anchor
- When in doubt, favor smaller commits with smaller tags over large mixed changes

## Handoff Template

Use this exact structure in substantial handoffs:

```markdown
## Slice
[what session objective was completed]

## Changed
- [file and change summary]

## Release Marker
- Commit: [sha]
- Tag: [tag-name]

## Verified
- [command]
- [result]

## Risks / Open Questions
- [item]

## Next Slice
- [recommended next task]
```

## Success Standard

A change is only "done" when:

- it improves reliability, clarity, or operator UX for the personal-use free-tier target
- verification actually exercised the changed behavior
- no paid-resource dependency was introduced
- the next session can resume without reconstructing the entire mental model
