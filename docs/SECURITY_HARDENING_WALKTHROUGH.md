# EdgeTunnel 安全加固与优化实施演练 (Walkthrough)

## 演练背景
本项目为一个基于 Cloudflare Workers 的网络代理隧道平台。随着功能的增加，应用的安全性和稳定性面临挑战。近期进行了一次针对性的安全加固和配置修复实施，本演练用于记录此次变更的核心逻辑，以便后续排查和复用。

## 核心变更点记录

### 1. KV Binding 配置自动化修复
**问题描述**：Wrangler 配置中 KV Namespace 的绑定被注释，导致每次使用 Wrangler 重新部署时，都会丢失 KV 环境，造成 Worker 执行异常或需要开发者手动到 Dashboard 再次绑定。
**解决方案**：
修复了 `wrangler.toml` 文件：
```toml
[[kv_namespaces]]
binding = "KV"
id = "272bb166530d4dc6b71dd75d8770306f"
```
确保 CI/CD 或命令行部署时能自动接入状态存储。

### 2. 纵深防御 (Defense-in-Depth) 应用

为了应对公网暴露的 Worker 遭到恶意扫描和攻击，进行了四点维度的防线收紧（均在 `_worker.js` 内实现）：

#### A. 修复请求者真实 IP 穿透
**改动点**：将 `request.headers.get('CF-Connecting-IP')` 提升到了获取客户端 IP 逻辑的首选判断位置。
**目的**：防御 IP 伪造。其他如 `X-Forwarded-For` 可能会被用户在构造请求头时轻易伪造，而 `CF-Connecting-IP` 是由 Cloudflare 边缘节点在反向代理时重新封装的，具有高度可信性。

#### B. 强化认证 Cookie 安全性
**改动点**：对登录接口返回的 Set-Cookie 增加了两项关键保护：
```javascript
响应.headers.set('Set-Cookie', `auth=${...}; Path=/; Max-Age=86400; HttpOnly; SameSite=Strict; Secure`);
```
**目的**：保护管理员 Token 会话。
- `SameSite=Strict`: 防止跨站请求伪造（CSRF）攻击，确保目标页面仅在从当前域发起请求时才携带 Cookie。
- `Secure`: 确保 Cookie 永远仅仅在强制的 HTTPS 安全通道下传输，防止被中间人（MITM）截获。

#### C. KV 防暴力破解机制 (Rate Limiting)
**改动点**：在 `request.method === 'POST'` 和路径为 `/login` 处，利用已有的 `env.KV` 实现了分布式限速。
**防护策略**：基于特定访问者的 IP，统计其连续错误登录频率。若错误达到 5 次，则执行封号机制，锁定此 IP 尝试资格 300 秒（5分钟）。锁定期间直接返回 429 状态。一旦正确输入密码，则清空该 IP 错误计数。
**容错**：加入了 `if (env.KV && typeof env.KV.get === 'function')` 的优雅降级判断。如果未来项目解绑了 KV，这部分限速逻辑会静默失效而不引起阻断流程的内部异常崩溃。

#### D. 后台配置输入强校验 (Input Validation)
**改动点**：针对 `/admin/config.json` 等 POST 数据交互接口：
- 增加了前置最大请求报文体（Payload）截断限制 `(rawBody.byteLength > 65536)`，拦截超大垃圾数据包的恶意填充，保护 Worker 单次处理的内存和时间。
- 对核心的 `UUID` 与 `HOST` 字段做深度合规性校验。使用严格正则匹配合法的 uuid，并限制 host 字符串超长，避免非法下发注入异常。

## 测试与校验
部署完成后需验证的重点：
1. Wrangler 部署是否真正自动绑定了指明的 KV id。
2. 尝试伪造 IP 头请求日志测试真实获取能力。
3. 抓包工具查看浏览器的 Cookie 面板是否生效了 `Secure` 标记。
4. 故意输错密码 5 次，期望能受到持续的 HTTP 429 会话拦截惩罚。
