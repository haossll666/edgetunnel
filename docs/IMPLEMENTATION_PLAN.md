# Implementation Plan: Reliability-First edgetunnel on CF Free Tier

## Overview

This plan turns `edgetunnel` into a more dependable personal-use Cloudflare Workers deployment without pushing the project toward paid infrastructure or feature-heavy complexity.

The operating theme is:

- keep the hot path lean
- reduce third-party dependencies on critical requests
- lower KV write pressure
- improve recovery and operator clarity

## Session Focus

This document is for **sequenced, multi-agent execution**, not for trying to complete the whole project in one session.

Work should move in small vertical slices with explicit checkpoints.

## Architecture Decisions

- Reliability is more important than feature breadth
- `/sub` and tunnel request handling should avoid admin-only enrichment work
- Advanced integrations should be opt-in, not hot-path defaults
- Tests and docs are first-class workstreams because they enable safe parallelism

See [ADR-001](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/decisions/ADR-001-reliability-first-on-cf-free-tier.md).

## Dependency Graph

```text
Reliability contract / ADR
        |
        +-- Config-loading contract
        |       |
        |       +-- /sub path slimming
        |       +-- logging policy changes
        |
        +-- Admin/static fallback strategy
        |
        +-- Test harness upgrades
                |
                +-- safer iterative refactors in _worker.js
```

## Execution Lanes

### Lane A: Core Path Reliability

Goal:
Make `/sub` and tunnel-adjacent logic cheaper, more deterministic, and less dependent on unrelated admin features.

Primary files:

- `_worker.js`
- `tests/worker.test.js`
- new targeted tests if added

### Lane B: Admin and Resilience UX

Goal:
Keep admin access and fallback pages usable even when external static dependencies are unhealthy.

Primary files:

- `_worker.js`
- `README.md`
- docs if needed

Current safest slice:

- add an admin-page fetch fallback only
- preserve the authenticated redirect and QR onboarding contract
- do not touch `/sub`, token generation, UUID mapping, or `config_JSON.LINK`

### Lane C: Test Harness and Verification

Goal:
Make behavior changes safer by improving local verification around Cloudflare-specific code paths.

Primary files:

- `tests/loader.mjs`
- `tests/*.test.js`

### Lane D: Operator Docs and Handoffs

Goal:
Make future sessions and future agents fast to onboard with accurate constraints, decision records, and slice tracking.

Primary files:

- `AGENTS.md`
- `docs/**`
- `README.md`

## Phases

### Phase 0: Foundation and Contract

Status:

- Completed in this session

Objective:

- capture constraints
- define sequencing
- make multi-agent work safe

Tasks:

- [x] Add repository-local agent guidance
- [x] Record architecture decision for free-tier reliability
- [x] Create phased implementation plan with lane ownership

Checkpoint:

- [x] Future agents can start from repo files alone
- [x] Current priorities are explicit and stable

### Phase 1: Slim the `/sub` Path

Why first:

This is the highest-leverage slice because it affects the operator's day-to-day stability and request cost.

## Task 1: Separate base config loading from admin enrichment

**Description:** Refactor configuration loading so the subscription path can read only what it needs, while Cloudflare usage, Telegram display data, and other admin-oriented enrichment stay out of the hot path.

**Acceptance criteria:**
- [ ] `/sub` no longer requires admin-only enrichment work
- [ ] `读取config_JSON()` behavior is split or replaced by a clearer contract
- [ ] Response behavior stays compatible for existing subscription consumers

**Verification:**
- [ ] Relevant tests pass
- [ ] Targeted route smoke checks pass for the config-loading contract boundary
- [ ] Self-review confirms no new paid/external dependency was introduced

**Dependencies:** Phase 0

**Files likely touched:**
- `_worker.js`
- `tests/worker.test.js`

**Estimated scope:** Medium

**Lane:** A

**Status:** Reverted after runtime regression report; needs redesign before retry

## Task 2: Reduce `/sub` hot-path KV/logging cost

**Description:** Change subscription logging strategy so personal-use deployments do not pay unnecessary KV read/write costs on every subscription request.

**Acceptance criteria:**
- [ ] `Get_SUB` logging is lighter, sampled, disabled by default, or otherwise reduced
- [ ] Admin/security-relevant events remain observable
- [ ] Logging behavior is documented

**Verification:**
- [ ] Targeted tests pass
- [ ] Manual code inspection confirms fewer KV operations in the `/sub` flow

**Dependencies:** Task 1

**Files likely touched:**
- `_worker.js`
- `docs/**`
- relevant tests

**Estimated scope:** Small to Medium

**Lane:** A

Checkpoint after Phase 1:

- [ ] `/sub` is leaner than before
- [ ] No unrelated admin fetches or usage queries are left on the subscription path
- [ ] Tests still pass

### Phase 2: Reduce Admin and Fallback Fragility

## Task 3: Define fallback strategy for login/admin/noADMIN/noKV pages

**Description:** Replace or harden the current dependence on external hosted static pages so the operator retains a usable control surface during partial outages.

**Acceptance criteria:**
- [ ] A documented fallback strategy exists
- [ ] At least minimal local fallback behavior is implemented or staged behind a clearly defined next slice
- [ ] The hot path is not made heavier by the change

**Verification:**
- [ ] Manual route checks or tests cover the fallback behavior
- [ ] Docs explain the operator-facing behavior

**Dependencies:** Phase 0

**Files likely touched:**
- `_worker.js`
- `README.md`
- docs

**Estimated scope:** Medium

**Lane:** B

## Task 4: Make deployment defaults match the real security model

**Description:** Align documentation and code expectations for `ADMIN`, `KEY`, and related deployment variables so the operator is not surprised by implicit fallbacks.

**Acceptance criteria:**
- [ ] Docs reflect actual required variables
- [ ] Security-sensitive fallback behavior is documented or tightened
- [ ] Personal-use recommended defaults are explicit
- [ ] The `/admin` QR-based subscription onboarding flow remains the documented default operator path

**Verification:**
- [ ] README and code behavior are consistent
- [ ] Security review of the affected branch is complete

**Dependencies:** Task 3 can be parallel if contracts do not conflict

**Files likely touched:**
- `README.md`
- `_worker.js`
- docs

**Estimated scope:** Small to Medium

**Lane:** B or D depending on whether code changes are needed

Checkpoint after Phase 2:

- [ ] Admin/operator UX is more resilient
- [ ] Deployment guidance is less error-prone

### Phase 3: Strengthen Verification

## Task 5: Add a clearer local worker test entrypoint

**Description:** Make Cloudflare-runtime-compatible tests easier to run and extend so agents do not accidentally rely on broken local commands.

**Acceptance criteria:**
- [ ] One documented command exists for worker-compatible local tests
- [ ] Tests cover at least one route-level behavior tied to Phase 1 or Phase 2
- [ ] Future behavior changes have an obvious place to add guard tests

**Verification:**
- [ ] Local tests pass
- [ ] Documentation references the working command

**Dependencies:** Phase 1 or 2 depending on the behavior covered

**Files likely touched:**
- `tests/loader.mjs`
- `tests/*.test.js`
- docs

**Estimated scope:** Small

**Lane:** C

## Task 6: Add guard tests for config-loading and logging policy

**Description:** Create focused regression tests around the new hot-path contract and logging behavior.

**Acceptance criteria:**
- [ ] Tests fail if admin enrichment leaks back into `/sub`
- [ ] Tests fail if logging policy regresses into heavy hot-path writes

**Verification:**
- [ ] New tests pass
- [ ] The test names clearly describe the intended contract

**Dependencies:** Tasks 1 and 2

**Files likely touched:**
- `tests/*.test.js`

**Estimated scope:** Small

**Lane:** C

Checkpoint after Phase 3:

- [ ] The next refactor has meaningful guardrails

### Phase 4: Operator Experience and Final Hardening

## Task 7: Publish a personal-use deployment profile

**Description:** Document the recommended settings, disabled features, and operator checklist for the intended single-owner free-tier deployment style.

**Acceptance criteria:**
- [ ] Docs explain recommended variables and disabled-by-default features
- [ ] Docs explain what to check first when service quality drops
- [ ] Docs avoid suggesting paid-only scaling paths as the default answer

**Verification:**
- [ ] README or a dedicated doc is updated
- [ ] Guidance is consistent with the ADR and AGENTS file

**Dependencies:** Phase 1 and Phase 2

**Files likely touched:**
- `README.md`
- docs

**Estimated scope:** Small

**Lane:** D

## Parallelization Guidance

Safe pairings:

- Lane D with any other lane
- Lane C with Lane A after the contract for a slice is defined
- Lane C with Lane B after route behavior is agreed

Avoid parallel edits:

- two editing agents inside `_worker.js` without an explicit non-overlapping section boundary
- changing config-loading behavior and admin route behavior at the same time without a written contract

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `_worker.js` conflicts between agents | High | Single-owner write sets, integrator controls merges |
| behavior drift while slimming the hot path | High | contract-first tasks and targeted tests |
| docs diverge from code again | Medium | update docs in the same slice as behavior changes |
| free-tier assumptions accidentally broken | High | ADR + AGENTS constraints + review checkpoint |

## Now / Next / Later

### Now

- finish the planning scaffolding
- begin Phase 1 Task 1

### Next

- Task 2 or Task 3 depending on where the first slice lands cleanly

### Later

- broader `_worker.js` modularization only after guardrails exist
- optional UX polishing after stability work is complete
