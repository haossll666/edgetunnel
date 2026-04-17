# ADR-001: Reliability-First Operation on Cloudflare Workers Free Tier

## Status

Accepted

## Date

2026-04-17

## Context

`edgetunnel` is being used as a personal deployment on Cloudflare Workers free tier.

The operating constraints are:

- personal use, not multi-tenant service
- reliability and recoverability matter more than concurrency
- the deployment must stay on Cloudflare free resources
- external dependencies on critical paths increase fragility
- the user experience includes operator experience, not just client protocol support

The current codebase mixes several concerns in a single Worker:

- tunnel request handling
- subscription generation
- admin interface
- logging
- usage reporting
- external helper integrations

This makes the system flexible, but it also increases the number of ways a non-core dependency can hurt the operator.

## Decision

We will optimize the project for **reliability-first personal operation on Cloudflare free tier**.

Concretely, this means:

1. Hot paths (`/sub`, WebSocket, XHTTP, gRPC, route parsing) should avoid unrelated enrichment work
2. Admin-only features and external integrations should not be required for subscription generation to work well
3. New infrastructure requirements must not move the project outside Cloudflare free-tier assumptions
4. Advanced features should be opt-in when they add risk to the default path
5. KV writes and external fetches on frequently-hit paths should be reduced where possible
6. Tests, docs, and agent guidance are part of the architecture because they reduce recovery time and coordination errors

## Alternatives Considered

### Keep the current feature-rich default behavior

- Pros:
  - maximum flexibility
  - fewer up-front decisions
- Cons:
  - higher hot-path complexity
  - more external failure modes
  - harder to reason about safe refactors

Rejected because the target deployment is a single-owner free-tier setup where stability matters more than breadth.

### Optimize primarily for concurrency and scale

- Pros:
  - better fit for multi-user or commercial deployments
  - may support larger traffic bursts
- Cons:
  - would push the design toward more moving parts
  - likely to encourage paid-platform assumptions
  - does not directly solve the user's primary pain point

Rejected because concurrency is not the main requirement.

### Add paid or always-on external infrastructure

- Pros:
  - more control over state, health checks, and fallback infrastructure
- Cons:
  - violates the deployment constraint
  - increases operator burden and cost

Rejected because the project must remain viable on Cloudflare free resources.

## Consequences

### Positive

- clearer implementation priorities
- fewer non-core dependencies on critical requests
- easier to split work into safe execution slices
- better fit for personal deployment and recovery workflows

### Negative

- some convenience features may become secondary or opt-in
- feature-rich defaults may be reduced
- more discipline is required when changing `_worker.js`

## Implementation Notes

This ADR implies the following priority order:

1. slim the subscription and config-loading path
2. reduce admin/static fallback fragility
3. reduce KV write amplification
4. strengthen local verification
5. improve operator-facing docs

## Related Documents

- [Implementation Plan](/Users/rock.xu/github/projects/ai-ml/edgetunnel/docs/IMPLEMENTATION_PLAN.md)
- [Repository Agent Guide](/Users/rock.xu/github/projects/ai-ml/edgetunnel/AGENTS.md)
