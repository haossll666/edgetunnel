# Continuous Execution System

This document turns `edgetunnel` work into a repo-driven execution loop instead of a chat-driven loop.

## Objective

Keep project momentum without requiring the operator to issue a new instruction after every small change.

The system should:

- keep shipping low-risk slices automatically
- preserve Cloudflare free-tier constraints
- protect the `/admin` QR onboarding experience
- stop only when a real decision or high-risk change appears

## Default Loop

Every substantial session should use this loop:

1. Read:
   - [AGENTS.md](/Users/rock.xu/github/projects/ai-ml/edgetunnel/AGENTS.md)
   - [docs/IMPLEMENTATION_PLAN.md](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/IMPLEMENTATION_PLAN.md)
   - [docs/NEXT_SLICE_QUEUE.md](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/NEXT_SLICE_QUEUE.md)
2. Choose the highest-priority unblocked item in `NOW`
3. Complete one bounded slice end-to-end
4. Verify only the tests relevant to that slice
5. Commit, create an annotated tag, and push
6. Update the queue and handoff notes
7. If the next slice is still low risk and unblocked, continue automatically

## What Counts As Low Risk

Low-risk slices are allowed to continue without fresh user input when they stay inside one or more of these areas:

- docs and deployment guidance
- tests that strengthen an existing contract
- admin-only resilience work that does not change subscription outputs
- logging and observability changes outside `/sub`
- local verification and handoff tooling

## Mandatory Pause Conditions

Stop and ask the operator before proceeding when any of these is true:

- `/sub` behavior or output may change
- token generation or UUID mapping may change
- `config_JSON.LINK` or `/admin/config.json` may change
- the operator may need to re-add subscriptions
- a new paid Cloudflare feature or external always-on service would be introduced
- tests fail in a way that creates ambiguity about runtime safety

## Queue Ownership

The repository queue is the source of truth for what happens next.

Rules:

- there must be exactly one `NOW` slice
- `NEXT` should contain only the next 2 to 4 meaningful slices
- `LATER` can hold broader or blocked work
- after each shipped slice, promote or reorder items based on risk and dependencies

## Handoff Discipline

Every shipped slice should leave enough information for a new session to continue immediately.

Minimum handoff content:

- what changed
- what was verified
- current `NOW`
- current `NEXT`
- any blockers or pause conditions
- commit SHA and tag

## Current Project Bias

For this repository, the execution system should bias toward:

1. protecting admin QR onboarding
2. reducing operator confusion in deployment defaults
3. hardening admin fallback behavior
4. improving tests before retrying risky `/sub` refactors
5. shrinking free-tier KV pressure only when the contract is clear
