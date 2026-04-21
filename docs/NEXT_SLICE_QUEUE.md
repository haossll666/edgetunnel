# Next Slice Queue

Update it after every shipped slice.

## [WIP] Stage 2 — A5（按需求 §6 顺序）

Status: next.

Goal：见 `docs/brainstorms/edgetunnel-improvement-directions-20260417-requirements.md` §3 / §6。

## NOW

（空）

## NEXT

- B2 → B1（spike）→ E1 → F1+F3 …

## Done

### S1-5 — A5 本地自动反代池替代公共默认兜底

Status: Done — `_worker.js` 新增 `选择反代策略()`；优先 `PROXYIP`，其次 `KV/ADD.txt` 自动池；未配置时不再默认回退 `cmliussss` 公共域名，并对自动池做去重、限长、按 `host/colo` 稳定打散，叠加基于真实连接结果的被动健康分短时重排、随时间向 0 温和衰减、同向结果短冷却、按目标站点维度隔离健康分，并且只对自动池候选记录健康分；自动池入口会默认过滤异常格式和非常见端口，并在 `/admin/diagnostics` 暴露聚合过滤诊断。

### S1-4 — E3 构建 tag / git describe 可见性

Status: Done — `WorkerGitDescribe`、`scripts/stamp-git-describe.mjs`、`.github/workflows/test.yml`、诊断 JSON + 本地 Admin 兜底文案。

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
