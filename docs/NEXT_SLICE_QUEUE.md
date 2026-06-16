# Next Slice Queue

Update it after every shipped slice.

## Stage 2 — 国内 AI 可用性诊断（按用户确认目标）

Status: done.

Goal：先做“国内 AI 服务可用性 runbook + diagnostics 只读增强”，不改变订阅输出和二维码兼容性。

## NOW

（空）

## NEXT

- B2：手动按钮式 ProxyIP / ADD.txt 健康刷新（每次 ≤ 15 个候选，避免外部 subrequest 和 KV 写放大）。
- A5：非业务路径收敛为 404（需 method/header gate 测试先行）。
- F1/F3：客户端策略和规则集优化（订阅内容变更，必须契约先行）。

## Done

### S2-1 — 国内 AI 服务可用性 runbook + diagnostics 只读增强

Status: Done — 新增 `docs/RUNBOOK-CN-AI-ACCESS.md`，把国内 ChatGPT / X / Claude / Gemini 可用性拆成客户端分流规则、Cloudflare 优选 IP、PROXYIP / ADD.txt 自动池三层；`/admin/diagnostics` 新增只读 `aiAccess` 诊断段，展示 AI 服务域名组、出口策略来源、最近出口状态、DNS 建议与下一步建议；未触碰 `/sub` 输出、token、UUID、`config_JSON.LINK` 或二维码兼容行为。

### S1-6 — 自动反代出口地域展示

Status: Done — `_worker.js` 记录最近一次成功命中的反代出口并通过外部 Geo API + 内存缓存补全国家/地区信息；`/admin/diagnostics` 新增 `proxyExit` 诊断段，展示最近命中出口、国家/地区标签、城市与缓存状态；`tests/worker.test.js` 补了 geo 缓存和诊断回归用例。

### S1-5 — A5 本地自动反代池替代公共默认兜底

Status: Done — `_worker.js` 新增 `选择反代策略()`；优先 `PROXYIP`，其次 `KV/ADD.txt` 自动池；未配置时不再默认回退 `cmliussss` 公共域名，并对自动池做去重、限长、按 `host/colo` 稳定打散，叠加基于真实连接结果的被动健康分短时重排、随时间向 0 温和衰减、同向结果短冷却、按目标站点维度隔离健康分，并且只对自动池候选记录健康分；自动池入口会默认过滤异常格式和非常见端口，并在 `/admin/diagnostics` 暴露聚合过滤诊断、通过率、最近一次自动池大小、状态摘要、健康分概览摘要和诊断建议文案。

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
