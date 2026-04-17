# Next Slice Queue

Update it after every shipped slice.

## [WIP] S1-3 — C2 登录失败指数退避

Status: next.

Goal: 仅在状态跃迁时写 KV；当日 KV 写入计数 ≥800 时退化为同 isolate 内存跟踪（UTC 日切恢复）。

## NOW

（空）

## NEXT

- S1-4 E3 构建 tag 注入
- Stage 2：A5 / B2 / B1 / E1 / F1+F3 …

## Done

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
