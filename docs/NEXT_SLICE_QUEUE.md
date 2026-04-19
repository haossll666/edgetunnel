# Next Slice Queue

Update it after every shipped slice.

## [WIP] S1-4 — E3 构建 tag 注入

Status: next.

Goal: `git describe --tags --dirty` 注入 `_worker.js` 常量 + `/admin/diagnostics` 回显（不改 RL）。

## NOW

（空）

## NEXT

- Stage 2：A5 / B2 / B1 / E1 / F1+F3 …

## Done

### S1-3 — C2 登录失败指数退避

Status: Done — `_worker.js` 登录退避、`tests/worker.test.js` C2 用例。

### S1-2 — C1 登录 Token IP 绑定

Status: Done.

- `ADMIN_IP_BIND`：`off` / `relaxed`（默认）/ `strict`；Cookie 哈希含 IP 前缀或 ASN；无新增 KV。

### S1-1 — A2a URL 伪装页文档化

Status: Done — [`docs/URL_DISGUISE_OPTIONS.md`](URL_DISGUISE_OPTIONS.md)

### S0-1 — D3 测试底座

Status: Done — `tests/_kv-mock.mjs`、相关测试与 `请求日志记录` 导出。

---

### 归档：Q8-8 Cloudflare usage cache（历史）

Status: superseded.
