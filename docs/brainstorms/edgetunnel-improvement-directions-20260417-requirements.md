# edgetunnel 可提升方向梳理（GFW / 带宽 / 安全 / 稳定）

- Date: 2026-04-17
- Scope: Requirements / brainstorm 级方向清单（不是实现计划）
- Owner: 个人部署者（单用户）
- Status: Draft（待用户评审待裁决问题后可进入排期）

---

## 1. Context & Constraints

本项目 [edgetunnel](../../README.md) 当前定位已由 [AGENTS.md](../../AGENTS.md) 与 [docs/decisions/ADR-001-reliability-first-on-cf-free-tier.md](../decisions/ADR-001-reliability-first-on-cf-free-tier.md) 明确锁定：

- **单用户个人部署**，不做多租户或 SaaS 化
- 运行在 **Cloudflare Workers 免费层**，不依赖 Durable Objects / D1 / Queues / Paid Workers / 外部长跑服务
- **可靠性 / 可恢复性 > 并发 / 功能数量**
- 热路径（`/sub`、WebSocket、XHTTP、gRPC）**不允许**新增第三方依赖或 admin-only enrichment
- `/admin` 登录后扫码加订阅这条主路径是操作契约的核心

### 1.1 Contract Red Lines（全文统一定义）

以下五项称为**红线**，本文档所有 `Compatibility` 行均对照这组成员：

1. `/sub?token=...` 的行为与返回内容契约
2. `/admin/config.json` 的读写契约
3. `config_JSON.LINK`（QR 下发的订阅 URL 字段）
4. `KEY` / token 生成算法
5. `UUID` → 订阅 token 映射关系

AGENTS.md 指明任何修改这五项的 slice 必须**契约先行**（先补 test、评估 re-scan 影响、明确沟通）。

本文档在以上约束之上，额外聚焦三个使用场景特征：

1. **中国大陆 GFW 网络环境**：订阅入口、WebSocket path、伪装 URL 会被主动/被动阻断
2. **安全基线**：个人场景不能依赖 CF 付费 WAF，但必须能抵御常规爆破、指纹、token 泄露场景
3. **带宽尽可能大**：在 CF 免费层约束（详见 §1.3）内榨取到极限

### 1.2 Non-goals

- 不考虑任何付费 CF 计划（Workers Paid、Durable Objects、D1、Queues）
- 不考虑多租户、商用化、对外服务
- 不引入需要长跑运行的外部服务（如自建 API 健康检查器）
- 不为了追求覆盖面而破坏 QR 扫码加订阅契约
- 不追求"全量审计日志"，日志以可恢复性为目标

### 1.3 Cloudflare Workers 免费层真实约束

以下数字为 2026-04 当前实测 / 官方生效值，用于本文档所有后续推理：

- **CPU 时间：10 ms / 请求**（非 50 ms；50 ms 是 Paid）
- **外部 subrequest：50 / invocation**（非 100；2026-02 生效更新，Paid 默认 10000）
- **Cloudflare 内部 subrequest：1000 / invocation**（KV 属此类）
- **WebSocket idle：~100s**
- **KV 写入：1000 / 天（免费）**，eventual consistency
- **不可用**：Durable Objects、D1、Queues、Cron 长期持续高频、Paid Workers

所有涉及"probe / poll / 健康检查"的方向必须按 10 ms CPU + 50 外部 subrequest 设计（`ctx.waitUntil` 只延长 wall-time，**不放宽** CPU 配额）。

### 1.4 与既有文档的关系

- **替代** [docs/ARCHITECTURE_AND_LEARNINGS.md](../ARCHITECTURE_AND_LEARNINGS.md) 中 Phase 3（Hono.js 替换）与 Phase 4（Durable Objects / D1）部分激进方案 —— 本文档只保留与免费层兼容的子集
- **替代** [docs/SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) 第 3 节中需要 Paid Plan 或外部服务器的方向（B.2 Workers 升杯、C.1 REALITY 需要付费域名/服务器等）
- **不替代** [docs/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) 与 [docs/NEXT_SLICE_QUEUE.md](../NEXT_SLICE_QUEUE.md) —— 本文档只是未来 slice 的候选池，不改变现有执行系统

---

## 2. Success Criteria（WHAT）

本文档覆盖的方向整体上应让以下指标在 3-5 个 slice 后可观察到改善：

1. **订阅可达性**：大陆网络下 `/admin` 扫码加订阅的成功率稳定 > 90%；加订阅失败时能在 `/admin/diagnostics` 或本地兜底页快速定位原因
2. **带宽与连接稳定性**：在免费层额度内，客户端端到端吞吐（典型流媒体/下载）**不会因为 Worker 侧配置而额外折损**；idle 断开后客户端能快速重连
3. **安全基线**：爆破 / token 泄露 / 指纹扫描 这三类常见攻击在"无付费 WAF"条件下被延缓到"对个人威胁可忽略"水平
4. **可恢复性**：任意时刻，操作者能在 3 分钟内完成"检查 → 判定 → 回滚/修复"，不需要离开 `/admin` 或命令行 git 操作
5. **约束合规**：每条方向落地后 **零付费依赖、零外部长跑依赖**；涉及红线（§1.1）的变更必须经过契约先行流程，未契约先行的 QR 订阅破坏视为不合规

---

## 3. 方向清单

每条方向按如下结构描述：

- Motivation：为什么这条值得做
- Core idea：关键想法
- Compatibility：对 §1.1 五条红线的影响
- Risk：潜在风险
- Initial priority：Now / Next / Later / Maybe-never（详见第 4 节排序）

### A. GFW 抗阻断与订阅可达性

这是大陆场景下**体验下限**的决定因素。A 组优先级最高。

#### A1. 订阅入口多样化（主备 path + 可配置别名）

- Motivation：单一 `/sub?token=...` 一旦在运营商层面被特征识别，会直接导致"加订阅失败"的黑屏问题
- Core idea：
  - 允许为 `/sub` 配置 alias path（例如 `/s`、`/subscription`、或随机后缀）
  - `/admin` QR 下发时生成主备两条 URL，客户端侧自动 fallback
- Compatibility：**高敏感** —— 任何 token 生成或路由变动都会影响 QR 契约；必须契约先行（先写 test，再动实现）
- Risk：若仅在服务端加别名，老客户端需要 re-scan 一次才能拿到备用 URL；若要做到无感，只能在 QR 生成时下发两条 URL，不动旧 token
- Initial priority：**Later**（契约先行 + 需要用户明确接受重扫决定）

#### A2. 默认伪装 URL 的可选集合

- Motivation：当前默认 `URL = cloudflare-error-page-3th.pages.dev` 在大陆的可达性/未被污染概率会随时间漂移
- Core idea（拆为两个子项以避免"文档 + 代码"混在一条）：
  - **A2a（文档）**：不改默认值行为，在 README 提供 2-3 组"近期验证可达"的候选值和挑选原则 — **Done**：详见 [`docs/URL_DISGUISE_OPTIONS.md`](../URL_DISGUISE_OPTIONS.md)
  - **A2b（代码，可选）**：在 `/admin/diagnostics` 加一次性"伪装 URL 可达性探测"按钮（只在按下时触发一次 `fetch`）
- Compatibility：零红线影响
- Risk：A2a 极低；A2b 为极轻量只读按钮，须设单按钮冷却（例如 30s）防误触耗 subrequest
- Initial priority：A2a **Now**；A2b **Next**

#### A3. WebSocket / gRPC path 轮换池

- Motivation：固定 path（例如 `/?ed=2560`）长期存在会被 DPI 指纹识别
- Core idea：
  - 把 path 放入 KV 中的一个小池（例如 5 条）
  - 订阅生成时轮换选取；path 池变更时由 `/admin` 主动触发 QR 重下发
- Compatibility：**高敏感** —— 影响客户端已有订阅；默认必须关闭，作为 opt-in
- Risk：用户切换 path 池后，老订阅直接失效
- Initial priority：**Later**（必须契约先行 + 默认 opt-in）

#### A4. Fragment / SNI 分片参数默认下发

- Motivation：大陆 TLS 握手 SNI 阻断日益普遍，Fragment（TLS 握手分片）是当前绕过成本最低的客户端侧技术
- Core idea：
  - Clash / Sing-box 订阅模板默认注入合理 Fragment 参数
  - 分协议单独评估（VLESS、Trojan、SS 兼容度不一）
- Compatibility：**影响订阅内容** —— 属于 AGENTS.md 中明确点名的高风险区
- Risk：部分客户端版本不支持 Fragment 字段，可能导致静默失败
- Initial priority：**Later**（契约先行 + 单独 ADR）

#### A5. 非业务路径收敛为 404（替换当前服务端反代伪装页）

- Motivation：当前对未识别路径不是 302，而是**服务端 fetch 反代 `env.URL`**（见 `_worker.js` 中反代 URL 的 `fetch(...)` 分支）。每次扫描至少消耗 1 个外部 subrequest，对 50/invocation 的免费层是白白浪费
- Core idea：
  - 把"是否走反代"的判定**提到协议 dispatch 之后**：只有 `GET` 且无 `Upgrade` 头、且 method+header 不是 WS / XHTTP / gRPC 握手时才进入此分支
  - 对非业务路径直接返回 404（或极简 cf-error 样式）
  - 业务白名单：`/admin*`、`/login`、`/logout`、`/sub*`、`/locations`、`/robots.txt`、`/version`、以及用户配置的短链路径
  - **WS / XHTTP / gRPC 走 method+header gate，不受路径白名单约束**（否则会破坏 A3 的随机 path 场景）
- Compatibility：保留协议握手路径自由，不动红线
- Risk：白名单遗漏会锁死后台；必须在 D3 的路径审计 test 中穷举覆盖
- Initial priority：**Next**（前置 D3，落地前必须有 method+header gate 的 test）

---

### B. 带宽 & 稳定性（免费层内极限利用）

CF 免费层的硬性约束见 §1.3（10 ms CPU、50 外部 subrequest、WS idle ~100s）。这组方向的目标是**不突破约束也能让客户端体验更稳**。

#### B1. 默认下发 Mux / 复用参数

- Motivation：Mux / gRPC 复用可以让同一个 TCP 承载多个逻辑流，降低 CF 外部 subrequest 和新 WS 握手次数（每 invocation 只有 50 外部 subrequest）
- Core idea：
  - Clash / Sing-box 订阅模板里为 VLESS-WS / VLESS-gRPC 默认启用合理 concurrency（例如 8）
  - 不改服务端行为，仅改订阅模板
- Compatibility：订阅内容变更（§1.1 #1），契约先行
- Risk：部分客户端的 Mux 实现有兼容性 bug；需给出明确开关
- Initial priority：**Later**（需要单独分协议验证）

#### B2. ProxyIP 池健康感知（无 Cron 版，仅边缘可达性）

- Motivation：`ADD.txt` 中的优选 IP 随时间存活率下滑，订阅里混入死节点
- 明确 B2 测量的对象：**Worker → 候选 CF 边缘 IP 的 TLS/HTTP 可达性**。它**不能**代表"大陆客户端 → CF 边缘"的真实可达性（那才是 A1/A3 解决的问题）。B2 只提供"这个 IP 是否完全下线"这一最低层信号
- Core idea：
  - **不**引入常驻 Cron Triggers
  - `/admin` 增加"刷新 ProxyIP 健康度"按钮，一次点击内探测 ≤ **15 个候选**（为 50 subrequest 预算留缓冲）
  - 硬限：CPU ≤ 10 ms / 请求 —— 实际 probe 由 `await fetch(..., { signal: AbortSignal.timeout(1500) })` 主导，I/O 不计 CPU
  - 多次点击累加状态，不强求一次盘完；结果写入 KV 单键（JSON array，每次写 1 次）
  - 订阅生成时按健康度排序；健康信息缺失时 fallback 到原顺序
- Compatibility：只影响 `/sub` 排序，不改节点本身，不改 token
- Risk：超出 subrequest 预算会引发其他路径失败；必须在实现里 cap 硬值
- Initial priority：**Next**（前置 E1，以便按钮反馈可见）

#### B3. 客户端 keepalive / idle 参数调优

- Motivation：CF 在 100s 左右会断开无活动 WS，客户端默认 timeout 可能更短/更长导致误判
- Core idea：订阅模板中为各协议输出合理心跳间隔（例如 WS 30-60s ping）与重连策略
- Compatibility：**订阅内容变更**，契约先行
- Risk：低，但需要按客户端版本分档
- Initial priority：**Later**

#### B4. ADD.txt 按地区 / 运营商分段

- Motivation：大陆不同运营商（电信/联通/移动）到 CF 不同 IP 段的质量差别巨大
- Core idea：
  - `ADD.txt` 支持按段标注（例如 `[cn-telecom]`、`[cn-mobile]`、`[cn-unicom]`、`[default]`）
  - 订阅生成时按客户端声明的地区/自选过滤；默认关闭以保持现有行为
- Compatibility：订阅内容变更，但仅在用户主动开启时触发
- Risk：KV 格式变更要兼容老数据
- Initial priority：**Later**（opt-in 永久默认关闭）

#### B5. H3 / ALPN 偏好显式下发

- Motivation：CF 已广泛支持 QUIC/H3；部分运营商下 H3 对连接稳定性有显著帮助
- Core idea：在 Clash/Sing-box 订阅模板中显式声明 `alpn: [h3, h2]` 优先顺序
- 作用面说明：B5 只影响 **客户端 → CF 边缘** 的握手选择；Worker 内部仍是 WS/HTTPS。它是客户端-边缘的优化，而不是 Worker 侧变化
- Compatibility：订阅内容变更（§1.1 #1），但只是参数偏好；需契约先行并给出回退开关
- Risk：部分客户端对 h3 支持不完整
- Initial priority：**Next**（验证成本低，且一旦有问题可一键回滚）

---

### C. 安全基线（个人场景实用加固）

目标不是做"企业级安全"，而是把常见攻击面收敛到"对个人部署威胁可忽略"水平。

#### C1. 登录 token 绑定 IP / IP 段

- Motivation：admin cookie 若被泄露，目前可以跨 IP 直接使用
- Core idea：
  - 登录时把 `CF-Connecting-IP` 的前缀写入 cookie 载荷：IPv4 按 `/24`，**IPv6 按 `/64`**（同一移动/家宽子网），避免 v6 场景下静默 no-op
  - 后续请求校验前缀；不匹配则要求重登
  - 三档开关：
    - `strict`：默认严格校验
    - `relaxed`：只校验是否同一 ASN（使用 `request.cf.asn`，注意 anycast/代理会偶发）
    - `off`：完全禁用（CGNAT 地区或漫游场景）
- Compatibility：只影响 admin 登录流程，不影响 `/sub` 与订阅
- Risk：大陆 CGNAT / 移动网络切换场景下可能误杀；必须提供 `off` 降级开关
- Initial priority：**Next**（降级开关先行）

#### C2. 爆破惩罚指数退避

- Motivation：现有 5 次/5 分钟 + 300s 锁定对低频长期爆破效果有限
- Core idea：
  - 在现有策略上叠加"连续锁定时长加倍"（第 1 次 5min、第 2 次 10min、第 3 次 20min，上限 24h）
  - 保留锁定历史
- **KV 写放大硬约束**（否则会自 DoS 免费层 1000 写/天）：
  - **只在状态迁移时写 KV**：首次失败、进入锁定、锁定升级、锁定清零；不在每次失败都写
  - **日写入水位熔断**：当日 KV 失败写计数 ≥ 800 时，后续跟踪退化到**内存态**（同一 isolate 内跟踪），不再写 KV；UTC 日切后自动恢复
  - 以上两条是实现必须满足的验收条件，不是可选项
- Compatibility：不影响正常用户
- Risk：内存态降级期间 isolate 切换会丢失计数；接受此代价以保护 KV 配额
- Initial priority：**Next**

#### C3. 凭据无感轮换（双窗口）

- Motivation：当前任一凭据一换，客户端就得重扫；AGENTS.md 明确列为红线
- **先明确 C3 覆盖哪个凭据**（实现差异巨大，必须在 ADR-002 中逐一选择）：
  - **C3-a**：`加密秘钥`（订阅短链 path）—— 只影响 `/sub` 短链重定向，实现最轻
  - **C3-b**：`UUID` / `userID` —— 同时影响 VLESS 握手 UUID 匹配，需要整条 proxy 热路径接受**双 UUID**，改动面最大
  - **C3-c**：`管理员密码` —— 只影响 `/login`，简单但收益最低（密码本就不该频繁轮换）
- Core idea（通用部分）：
  - 支持 `<name>` 与 `<name>_PREV`，过渡窗口 24–72 小时内两者都有效
  - 窗口结束后 `<name>_PREV` 自动失效，防止永久保留
- Compatibility：**触碰红线（§1.1 #4 或 #5）** —— 必须先立 ADR-002，契约先行
- Risk：C3-b 复杂度高，代码必须保证两条 UUID 的常量时间比较、不泄露分支
- Initial priority：**Later**（待裁决问题 #1 明确覆盖面后再排）

#### C4. admin 写路径统一输入 schema

- Motivation：`/admin/config.json`、`cf.json`、`tg.json` 的保存逻辑目前分散在 `_worker.js` 的 if/else 分支里，容易漏掉校验
- Core idea：
  - 在 `_worker.js` 内抽出一个极简的 validator 工具（不引入 Zod），按字段声明（类型 / 长度 / 正则 / 枚举）集中校验
  - 只做有限字段收口，不覆盖全量 schema
- Compatibility：只影响 admin 写路径，不影响 `/sub` 与订阅
- Risk：低 —— 但重构 `_worker.js` 任何位置都需要 AGENTS.md 要求的 gitnexus impact 分析
- Initial priority：**Now**（代码风险可控，收益明显）

#### C5. 敏感日志字段脱敏

- Motivation：KV 日志里如果落入完整 UUID / token，一旦 KV 被无意导出即构成泄露
- Core idea：统一日志打印前通过 masking 工具把 UUID / token 截断为 `xxxx****xxxx`
- Compatibility：只影响日志内容，零契约影响
- Risk：极低
- Initial priority：**Next**

---

### D. 代码健壮 / 可维护性（免费层内仍可做）

ADR-001 不允许引入运行时依赖，但**可维护性完全可以在单文件内改善**。

#### D1. `_worker.js` 内分层命名空间

- Motivation：3970 行单体是未来 slice 冲突与 gitnexus 影响面爆炸的主要根因
- Core idea：
  - 不引入打包器
  - 用显式 section 注释 + 命名对象（例如 `const Admin = { ... }`、`const Proxy = { ... }`、`const Sub = { ... }`）做逻辑分层
  - 可以分 3-5 次增量 slice 完成，不一次性动刀
  - **硬前置**：D3 必须先给 `/sub`、admin 写路径、A5 方法头 gate 建立 coverage baseline；否则 D1 的每一 slice 都缺乏安全网
- Compatibility：只是同文件内部重组，无对外契约变化
- Risk：
  - 每一 slice 都必须按 CLAUDE.md 要求跑 `gitnexus_impact` + `gitnexus_detect_changes`；对 3970 行单体，每次 impact 分析本身有非零成本（预计 5-15 分钟/ slice）
  - D1 改的是**热路径所在文件**，任何错拆会直接影响稳定性 —— 这是 **稳定性成本**，在 test baseline 之前做就是负收益
- Initial priority：**Next**（严格排在 D3 之后；若 D3 不先行则降到 Later）

#### D2. dev-only bundler（esbuild / CI 聚合）

- Motivation：如果 D1 做透，源代码拆多文件后需要 build 时聚合成单 `_worker.js`
- Core idea：只在本地/CI 用 esbuild，发布仍是单文件
- Compatibility：零运行时影响
- Risk：引入开发时依赖，增加新贡献者 onboard 成本
- Initial priority：**Maybe-never**（除非 D1 已经做到需要分文件的程度）

#### D3. 测试覆盖扩展

- Motivation：当前 [tests/](../../tests/) 只覆盖少量路径；任何稍大一点的重构都缺少安全网
- Core idea：
  - 沿用 [tests/loader.mjs](../../tests/loader.mjs) 风格，不引入 Vitest + Miniflare
  - **先行前置**：新增单一 `tests/_kv-mock.mjs` 辅助（极简内存态 KV，实现 `get / put / delete / list`），供后续 /sub 与 admin 测试复用。这是 D3 内部的第一子步，不算引入新外部依赖
  - 补齐：WebSocket UUID 校验、`/sub` 各 UA 分支（Clash / Sing-box / v2rayN / 未识别）、admin 配置保存 validator、A5 的 method+header 路径白名单
- Compatibility：零契约影响
- Risk：低
- Initial priority：**Next**（是 A5、D1 及其他 C 组重构的前置条件）

---

### E. 运维诊断与恢复

"诊断可见性"和"恢复可行性"是 ADR-001 可靠性优先目标的直接体现。

#### E1. `/admin/diagnostics` 扩充

- Motivation：当前诊断页偏轻；遇到大陆加订阅失败时缺一次性定位信息
- Core idea：
  - 增加只读面板：ProxyIP 健康度快照、最近 N 条 `/sub` 请求 UA 分布、近期 KV 写失败计数、当前 `URL` 伪装页探测结果
  - 完全只读，不触发任何远程探测（除非 B2 按钮按下）
- Compatibility：零影响
- Risk：极低
- Initial priority：**Now**

#### E2. 大陆加订阅失败 runbook

- Motivation：README 末尾已有 5 步检查，但太浓缩；故障时操作者需要一份可执行的决策树
- Core idea：在 `docs/RUNBOOK-CN-SUBSCRIBE.md` 写一份：症状 → 检查命令 → 预期输出 → 判定 → 下一步
- Compatibility：纯文档
- Risk：零
- Initial priority：**Now**

#### E3. build tag / 版本可见性

- Motivation：故障时"你现在部署的是哪个版本"这个问题常常耗掉 5 分钟
- Core idea：
  - 在发布流程中把 git tag 注入为 `_worker.js` 顶部常量 `Version`
  - **机制**：在 GitHub Actions 发布工作流里加一步 `sed`/`node` 重写 `_worker.js` 第一行 `Version` 常量（不依赖开发机本地环境）；手动 Pages 上传场景则在打包脚本中同步
  - `/admin` 顶部 + `/admin/diagnostics` 同时显示该版本
- Compatibility：零契约影响
- Risk：低（仅需避免重写破坏第一行格式）
- Initial priority：**Now**

---

### F. 订阅内容与客户端侧（整组 "高敏感 / 契约先行"）

F 组的共同特征是：**所有变更都会让客户端拿到与之前不同的订阅文本**。根据 AGENTS.md 规则，整组都需要契约先行，不能单 slice 推进。

#### F1. Clash 默认策略组合理化

- Motivation：当前下发的 `fallback` / `url-test` 默认参数可能不是最优
- Core idea：统一 fallback 超时、url-test 间隔、健康检查 URL，给出明确的默认与可覆盖开关
- Compatibility：订阅内容变更（§1.1 #1）；需契约先行
- Risk：低；参数值本身可快速回滚
- Initial priority：**Later**

#### F2. Sing-box / Surge 模板一致性

- Motivation：不同客户端模板现在各自独立维护，容易漂移
- Core idea：抽出一份 "公共策略 shape"，各客户端模板从这份 shape 映射输出
- Compatibility：订阅内容变更（§1.1 #1）；实现需重构 `/sub` 内部模板生成器
- Risk：**中到高** —— 单用户 + 3 个模板的规模下，抽象层本身是 speculative generality，实施成本高、收益仅"维护一致性"，不直接服务安全/稳定/带宽目标
- Initial priority：**Maybe-never**（除非真的出现漂移 bug，见待裁决问题 #6）

#### F3. 内嵌 ACL4SSR 精简规则集兜底

- Motivation：外部规则集拉取失败会让全量走代理，大陆环境下直接爆带宽
- Core idea：内嵌一份 ACL4SSR 最小子集作为 fallback；外部可达时仍优先外部
- Compatibility：订阅内容变更（§1.1 #1），但作为 fallback 只在外部失败时触发
- Risk：ACL4SSR 规则集会随时间过期；需约定刷新节奏
- Initial priority：**Later**

---

## 4. 排序建议（推荐，不改 NEXT_SLICE_QUEUE.md）

仅作为候选池；是否纳入 `NEXT_SLICE_QUEUE.md` 由操作者后续决定。

为避免与 [docs/NEXT_SLICE_QUEUE.md](../NEXT_SLICE_QUEUE.md) 中的 "NEXT" 列撞名，本节内部分组标签使用 **Now / Next / Later / Maybe-never**，而引用 `NEXT_SLICE_QUEUE.md` 时一律称"NSQ 队列"。

### 4.1 Now（Q8-8 完成后可直接作为候选 slice）

| 条目 | 类型 | 预估规模 | 说明 |
| --- | --- | --- | --- |
| A2a | 文档 | S | 伪装 URL 候选值与挑选原则，零代码 |
| C4 | 代码（admin 写路径） | S-M | 有限字段收口，不动 `/sub` |
| E1 | 代码（admin 只读） | S | 纯只读面板扩充 |
| E2 | 文档 | S | 决策树式 runbook |
| E3 | 代码 + CI（构建 + admin 显示） | S | 注入 build tag |

### 4.2 Next

| 条目 | 类型 | 预估规模 | 前置依赖 |
| --- | --- | --- | --- |
| D3 | 测试（含 `tests/_kv-mock.mjs`） | M | — |
| A2b | 代码（admin 按钮） | S | E1 |
| B2 | 代码（admin 按钮 + 健康度 KV） | M | E1、D3 |
| B5 | 订阅模板 | S | D3 |
| C1 | 代码（登录流程） | M | 降级开关先行 |
| C2 | 代码（登录流程 + KV 熔断） | S-M | D3 |
| C5 | 代码（日志工具） | S | — |
| A5 | 代码（method+header gate + 404） | S-M | D3（路径白名单 test 必须先有） |
| D1 | 重构（同文件分层） | 多 slice | **D3 必须先达到 baseline** |

### 4.3 Later（需契约先行 / 红线敏感）

- A1、A3、A4：改动订阅/握手 path 契约
- B1、B3：改动订阅内容（B4 已降到 Maybe-never）
- C3：凭据轮换需要单独 ADR（见待裁决问题 #1）
- F1、F3：订阅模板调整（F2 已降到 Maybe-never）

### 4.4 Maybe-never

- **D2**：dev-only bundler —— 除非 D1 做到不可维持（即当单文件内命名空间无法再支撑下一次安全分拆时才启用）
- **F2**：公共策略 shape —— 单用户 + 3 模板规模下为 speculative generality；只有当真实出现跨模板漂移 bug 时才重新评估（见待裁决问题 #6）
- **B4**：ADD.txt 分段 —— 单用户场景下手动维护一份贴合自己 ISP 的列表成本远低于 schema 迁移，除非用户真的频繁切网络

---

## 5. 待裁决问题（请操作者后续确认）

这些问题不在本文档范围内决定，但会直接影响后续 ADR 和 slice 排期。

1. **C3（凭据轮换）** 覆盖 C3-a / C3-b / C3-c 哪一项或哪几项？是否值得为 C3-b 打破 `UUID` 红线？如果是，ADR-002 必须先行。
2. **F 组** 是一并纳入本项目，还是拆分为独立的"客户端侧优化"子项目？
3. **A1（多 path 订阅入口）** 接受一次性 QR 重扫以换取多入口，还是只做"主 + 备"双 URL 让老 token 继续有效？
4. **D2（dev-only bundler）** 是否允许作为 CI-only 工具链存在？会引入开发依赖，但不进入运行时。
5. **B4（ADD.txt 分段）** 当前已降到 Maybe-never；是否确认接受这个降级，还是有频繁切网场景使其重新合理？
6. **F2（公共策略 shape）** 当前已降到 Maybe-never；是否同意，还是已经观察到跨模板漂移 bug 需要重新考虑？

---

## 6. 下一步建议

以下为执行层面的建议，**不自动写入** [docs/NEXT_SLICE_QUEUE.md](../NEXT_SLICE_QUEUE.md)（"NSQ 队列"），由操作者审阅后决定：

- 等 Q8-8（Cloudflare usage cache 失效）落地并打 tag 后，优先把 Now 组按以下顺序推入 NSQ 队列：**E1 → E3 → E2 → A2a → C4**
  - 排序依据：先上线 E1 诊断面板，让之后 A2/C4 的改动能通过面板直接观测效果；E3 先于 E2 是因为版本可见性本身是 E2 runbook 的先决信息
- **D3（测试覆盖扩展 + `tests/_kv-mock.mjs`）** 建议在 Now 组收尾后立即作为 Next 组的第一 slice 推进，否则后续 A5 / C2 / D1 都缺少安全网
- **待裁决问题 #1（C3）** 建议在任何触碰凭据生成逻辑的 slice 之前先起一份 ADR-002 草稿

---

## 7. 附录：本次整理排除的方向

为避免未来 session 误入，显式记录**已评估但明确不纳入**的方向：

- **Hono.js / 中间件框架替换**：与 ADR-001 冲突（引入运行时依赖 + 改变热路径架构）。参考 [docs/ARCHITECTURE_AND_LEARNINGS.md](../ARCHITECTURE_AND_LEARNINGS.md) Phase 3，本文档不采纳其"替换路由机制"部分
- **Durable Objects / D1 作为状态存储**：付费层依赖，与 ADR-001 冲突。参考 [docs/ARCHITECTURE_AND_LEARNINGS.md](../ARCHITECTURE_AND_LEARNINGS.md) Phase 4，本文档不采纳
- **Workers Paid Plan 升杯**：非免费层方向。参考 [docs/SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) 3.B.2，本文档不采纳
- **REALITY / XTLS-Vision**：**技术不兼容 CF Workers**（不是成本问题）。CF 作为中间层会改写 TLS 握手头，导致 REALITY 的 ClientHello mimicry 失效，连接会在首次握手后或重连时断开（参考 [XTLS/Xray-core#1991](https://github.com/XTLS/Xray-core/issues/1991)、[#4340](https://github.com/XTLS/Xray-core/issues/4340)、[chika0801/Xray-examples#49](https://github.com/chika0801/Xray-examples/issues/49)）。本项目采用 CF 边缘部署，REALITY 不是"以后再看"而是**永久不采纳**
- **自建高防 BGP 服务器 / 付费代理落地**：参考 [docs/SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) 3.A / 3.C，违反免费层约束，本文档不采纳
- **常驻 Cron Triggers 健康检查**：虽免费层允许，但会持续产生 KV 写入且增加运维心智，用 B2 的手动刷新按钮替代
- **`CF Rate Limiting API`**：付费能力，本文档保留自研 KV 限速（C2 指数退避方案）

---

## 8. 附录：协议选型说明（Protocol Choice Rationale）

### 8.1 edgetunnel 默认为什么是 VLESS

在 CF Workers + mihomo（Clash Meta）客户端场景下，VLESS 默认的**真实理由**如下：

1. **CPU 预算友好**（最重要）：VLESS 握手比 VMess 少一次 AEAD 加解密。在 10 ms CPU / 请求的免费层硬约束下，这一层省下来直接变成稳定性
2. **实现体积更小**：VLESS 握手的解析代码比 VMess 简单得多，对 3970 行单体 `_worker.js` 的后续维护成本更低
3. **early data 兼容性**：VLESS 在 WS Sec-WebSocket-Protocol 里携带 `ed=2048` / `ed=2560` 首包，首连 RTT 更低
4. **与 CF 中间层兼容性好**：CF 对 VLESS 无副作用；VMess 的时间戳敏感（±90s 时钟同步）在跨时区 CF 边缘偶尔会有边缘失败

### 8.2 常见误解订正

以下说法在社区里常见，但**在本项目（CF Workers 部署）场景下不成立**：

| 流传说法 | 实际结论（CF Workers 场景） |
| --- | --- |
| "VLESS 比 VMess 更安全" | **不成立**。VLESS 本身无加密层，安全完全依赖 TLS；VMess 的 AEAD 加密冗余于 TLS。最终安全强度**两者等同**，都由 CF 前端 TLS 决定 |
| "VLESS 比 Trojan / VMess 更隐蔽" | **场景依赖**。VLESS 的"碾压级隐蔽"来自 XTLS / REALITY；但这些在 CF Workers 下不可用（见 §7）。走 CF 边缘时 VLESS / VMess / Trojan 外层都是 CF TLS + WS/gRPC，DPI 看到的都是正常 HTTPS，**三者隐蔽性差异可忽略** |
| "加上 REALITY 能让 edgetunnel 更稳" | **反向成立**：REALITY 会被 CF 的 TLS 代理破坏，启用后反而导致不可用。详见 §7 REALITY 条目 |
| "VLESS 性能远超 VMess" | **局部成立**：CPU 占用上 VLESS 有优势；但端到端吞吐瓶颈通常不是协议层，而是 CF 免费层 subrequest / idle timeout / ProxyIP 质量。协议换来的吞吐提升被这些顶死 |

### 8.3 在 edgetunnel 语境下的真正带宽/稳定性杠杆

**不是**在 VLESS / VMess / Trojan 之间切换，而是：

- §3.A 组：抗阻断与订阅可达性
- §3.B1 / B2 / B5：Mux 复用、ProxyIP 边缘可达性、H3 ALPN
- §3.E：诊断与恢复时间

这些方向比"换协议"产出更高。

### 8.4 客户端建议（mihomo / Clash Meta）

- mihomo v1.17+ 原生支持 VLESS / VMess / Trojan 三协议，近期版本还强化了 Trojan WebSocket 处理
- edgetunnel 订阅模板默认下发的 VLESS + WS + TLS + 可选 ed 参数组合，在 mihomo 下是 **已验证最稳** 的组合
- 用户不需要手动切协议；**如果 VLESS 不通，通常是 ProxyIP / 入口 path / 伪装 URL 的问题，而不是协议问题**，应先走 §3.A2 / §3.E1 诊断而不是换协议
