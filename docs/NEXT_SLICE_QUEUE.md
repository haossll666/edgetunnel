# Next Slice Queue

Update it after every shipped slice.

## [WIP] S1-2 — C1 登录 Token IP 绑定

Status: next.

Goal: strict / relaxed / off 三模式（默认 relaxed），IPv4 /24、IPv6 /64；KV 写入遵守 §3.C2 抑制规则（与 C2 slice 协同）。

## NOW

（空）

## NEXT

- S1-3 C2 登录失败指数退避
- S1-4 E3 构建 tag 注入
- Stage 2：A5 / B2 / B1 / E1 / F1+F3 …

## Done

### S1-1 — A2a URL 伪装页文档化

Status: Done.

Delivered: [`docs/URL_DISGUISE_OPTIONS.md`](URL_DISGUISE_OPTIONS.md)

### S0-1 — D3 测试底座

Status: Done.

Delivered:

- `tests/_kv-mock.mjs`：内存 KV mock（get/put/delete/list，`put` 支持 `expirationTtl`）
- `tests/kv-mock.test.js`：mock 行为自测
- `tests/worker.test.js`：配置读取、`请求日志记录` 等改用共享 mock；新增 `请求日志记录` KV 测试
- `_worker.js`：导出 `请求日志记录`（仅测试契约，运行时行为不变）
- `tests/loader.mjs`：补充全量测试命令注释

---

### 归档：Q8-8 Cloudflare usage cache（历史）

Status: superseded by improvement plan queue.
