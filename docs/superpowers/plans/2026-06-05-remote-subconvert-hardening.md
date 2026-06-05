# Remote Subconvert Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent public subscription converters from receiving the stable `/sub` token unless the operator explicitly enables remote conversion.

**Architecture:** Keep local `mixed` subscription generation unchanged. Add a narrow policy check before the existing remote `SUBAPI` branch so remote conversion is disabled by default and enabled only through an explicit environment or config flag. Tests prove the default path does not call external conversion while the opt-in path preserves compatibility.

**Tech Stack:** Cloudflare Workers JavaScript, Node test runner, existing Worker loader and KV mock.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `tests/worker.test.js`

- [x] **Step 1: Write the failing test**

Add a test group that calls `worker.fetch()` for `/sub?target=clash&token=...` with a config whose `订阅转换配置.SUBAPI` points at `https://subapi.example`. Stub `global.fetch` and assert that, by default, no request is made to `https://subapi.example`.

- [x] **Step 2: Run the focused test**

Run: `node --loader ./tests/loader.mjs --test tests/worker.test.js`

Expected before implementation: FAIL because the current code calls the configured `SUBAPI`.

### Task 2: Add the Remote Conversion Policy

**Files:**
- Modify: `_worker.js`

- [x] **Step 1: Implement the minimal policy helper**

Add an exported helper such as `是否允许远程订阅转换(env, config_JSON)` that returns true only when `env.REMOTE_SUBCONVERT` or `config_JSON.订阅转换配置.REMOTE` is explicitly `1` or `true`.

- [x] **Step 2: Gate the remote `SUBAPI` branch**

Before building `订阅转换URL`, return a 403 plaintext message when remote conversion is disabled. The message must recommend `target=mixed` or enabling a trusted self-hosted converter.

- [x] **Step 3: Preserve opt-in behavior**

When the helper returns true, keep the existing `SUBAPI` request construction and response handling unchanged.

### Task 3: Document the Operator Risk

**Files:**
- Modify: `README.md`

- [x] **Step 1: Add a short safety note**

Document that public `SUBAPI` receives the subscription URL and token, so personal security-first deployments should keep remote conversion disabled unless using a trusted self-hosted converter.

- [x] **Step 2: Document the opt-in switch**

Document `REMOTE_SUBCONVERT=1` as an explicit compatibility switch for trusted converters.

### Task 4: Verify

**Files:**
- Read-only verification

- [x] **Step 1: Run focused Worker tests**

Run: `node --loader ./tests/loader.mjs --test tests/worker.test.js`

Expected: PASS.

- [x] **Step 2: Run security compatibility smoke test**

Run: `node --test tests/security.test.js`

Expected: PASS.

- [x] **Step 3: Inspect the changed remote conversion path**

Confirm `_worker.js` still does not change `/sub?token=...`, UUID mapping, or `config_JSON.LINK`.

Verified on 2026-06-05:

- `git diff --check`
- `node --loader ./tests/loader.mjs --test tests/worker.test.js`
- `node --test tests/security.test.js`
- `node --test tests/admin_compatibility.test.js`
- `node tests/test_sha224.js`
