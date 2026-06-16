# 国内 AI 服务可用性 Runbook

适用场景：人在中国大陆，使用本项目作为个人 Cloudflare Workers 免费层部署，希望 ChatGPT、X、Claude、Gemini 尽量稳定可用。

本 runbook 只处理诊断和运维选择，不要求修改 `/sub?token=...`、`config_JSON.LINK`、`KEY`、`UUID` 或二维码订阅契约。

## 判断模型

把链路拆成三层看：

```text
客户端分流规则 -> Cloudflare 优选 IP -> Worker -> PROXYIP / ADD.txt 自动池 -> AI 服务
```

- 客户端分流规则：决定 ChatGPT / X / Claude / Gemini 是否进入代理。
- Cloudflare 优选 IP：决定你从国内到 Cloudflare 边缘的入口质量。
- PROXYIP / ADD.txt 自动池：决定 Worker 出口访问 AI 服务的质量。

所以，Google 可用不等于 ChatGPT 可用；国外测速正常也不等于 Claude 或 Gemini 可用。

## 必须单独代理的域名

把这些域名放进客户端的 AI / 社交策略组，强制走代理：

```text
chatgpt.com
openai.com
oaistatic.com
oaiusercontent.com
auth0.openai.com

x.com
twitter.com
twimg.com
t.co

claude.ai
anthropic.com

gemini.google.com
generativelanguage.googleapis.com
ai.google.dev
googleapis.com
gstatic.com
```

如果客户端支持规则组，建议使用单独的 `AI-PROXY` 或类似策略组，不要和普通国外流量混在一起。

## PROXYIP 选择原则

AI 服务更看最终出口 IP 信誉，而不是只看 Cloudflare 入口速度。

建议：

- 准备 2-4 个可替换的 PROXYIP。
- 优先测试日本、新加坡、美国、台湾、香港等常见可用地区。
- 避免公开免费、被大量复用、明显被风控的数据中心出口。
- 如果 ChatGPT 可用但 Claude 不可用，优先怀疑出口 IP 被 Claude 风控。
- 如果 X 图片或媒体失败，检查 `twimg.com` 是否被规则遗漏。

当前项目逻辑：

- 配置了 `PROXYIP` 时，优先使用 `env.PROXYIP`。
- 未配置 `PROXYIP` 时，会使用 KV 中 `ADD.txt` 自动池。
- 两者都没有时，不再依赖公共默认兜底出口。

## DNS 和 IPv6

很多“规则看起来正确但服务不可用”的问题来自 DNS 泄漏。

建议：

- 国内域名走国内 DNS。
- AI / 国外域名走代理 DNS 或远程 DoH。
- 不要让 AI 域名使用国内污染解析结果。
- 如果不确定 IPv6 是否也走代理，先关闭不受控 IPv6 直连。

## 使用 diagnostics 判断

登录后台后打开：

```text
/admin/diagnostics
```

重点看：

- `aiAccess.proxyExit.source`
  - `env.PROXYIP`：正在用环境变量 PROXYIP。
  - `kv.ADD.txt`：正在用 KV 自动池。
  - `disabled`：没有可用出口配置，先配置 PROXYIP 或 ADD.txt。
- `aiAccess.proxyExit.recentExitStatus`
  - `recent-exit-seen`：近期有成功出口命中记录。
  - `no-recent-exit`：还没有看到成功出口，先用客户端访问一次目标服务再观察。
- `proxyExit.location`
  - 如果是 `fresh`，说明最近出口地域已识别。
  - 如果是 `unknown`，不代表不可用，只说明还没有可用地理信息。
- `autoProxyPool.health`
  - `stable`：自动池近期表现正常。
  - `degraded`：自动池近期失败偏多，优先换候选。
  - `unknown`：缺少足够命中样本。

## 症状排查

### ChatGPT / Claude / Gemini 全都打不开

优先顺序：

1. 确认客户端规则命中 AI 策略组。
2. 确认 AI 域名没有走国内 DNS。
3. 查看 `/admin/diagnostics` 的 `aiAccess.proxyExit.source`。
4. 如果 source 是 `disabled`，先配置 `PROXYIP` 或 `ADD.txt`。
5. 如果 source 正常但仍失败，换一组高信誉 PROXYIP。

### Google 可用，但 ChatGPT 或 Claude 不可用

这通常不是优选 IP 问题，而是出口 IP 信誉或服务风控问题。

处理：

1. 不急着改 `/sub` 或 UUID。
2. 换 PROXYIP 地区或供应来源。
3. 重新访问目标服务，让 diagnostics 刷新最近出口。
4. 如果只有 Claude 失败，优先换到美国、日本、新加坡出口测试。

### X 能打开但图片不显示

重点检查：

1. `twimg.com` 是否进入代理规则。
2. DNS 是否对 `twimg.com` 泄漏到国内解析。
3. PROXYIP 是否能稳定访问媒体域名。

### 手机扫码添加订阅失败

不要先改 token 或 UUID。按顺序确认：

1. `/admin` 是否能打开。
2. `/admin/config.json` 是否仍有 `config_JSON.LINK`。
3. `/admin/diagnostics` 是否能返回。
4. `/sub?token=...` 是否能返回订阅文本。
5. 如果浏览器正常但客户端导入失败，优先检查客户端网络、DNS、规则和握手路径。

## 不建议的做法

- 不要为了单个 AI 服务失败就立刻修改 `KEY`、`UUID` 或订阅路径。
- 不要把公共 SUBAPI 作为默认转换服务，除非你接受订阅 token 暴露给该服务。
- 不要频繁写 KV 做自动健康检查；免费层 KV 写入每天只有 1000 次。
- 不要引入 Durable Objects、D1、Queues、常驻外部探测服务来解决个人部署问题。

## 推荐稳定配置

```text
客户端：
  AI-PROXY 规则组 -> ChatGPT / X / Claude / Gemini 域名
  国外 DNS 远程解析
  不确定时关闭 IPv6 直连

Worker：
  PROXYIP 设置 2-4 个备用出口
  OFF_LOG=1，排障时再临时打开日志
  /admin/diagnostics 作为第一诊断入口

运维：
  优选 IP 负责入口质量
  PROXYIP 负责 AI 出口质量
  不用修改二维码订阅契约来处理出口风控
```
