# Next Slice Queue

Update it after every shipped slice.

## [WIP] S1-1 — A2a URL 伪装页文档化

Status: next.

Goal: 新增 `docs/URL_DISGUISE_OPTIONS.md`，5~8 个伪装站点候选与风险说明。

## NOW

（空 — 上一项 WIP 完成后在此填入）

## NEXT

- S1-2 C1 登录 Token IP 绑定
- S1-3 C2 登录失败指数退避
- S1-4 E3 构建 tag 注入

## Done

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

Status: superseded by improvement plan queue; 若需追溯见 git 历史。
