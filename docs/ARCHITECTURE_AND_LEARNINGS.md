# EdgeTunnel 学习心得与未来演进方向 (Learnings & Future Plans)

## 当前面临的挑战与反思 (Learnings)

EdgeTunnel 作为一个基于 Cloudflare Workers 平台无服务器（Serverless）网络隧道工具，证明了边缘计算巨大的潜力和极低的延迟门槛。但通过近期的梳理和安全补丁落地，能够明显感觉到其在工程化和可维护性上的边界已经凸显：

1. **单体巨石脚本的维护困境**：我们目前拥有一个长达 3600+ 行体量的 `_worker.js`，糅合了 TCP/UDP 的底层流媒体、HTTP 伪装路由、API、甚至是 HTML 模板的直接硬编码。其给后续协作开发、漏洞排查（Git rebase 冲突极其剧烈）带来了极大门槛。
2. **边缘状态的一致性局限**：本次安全防御（防爆破）中使用了 Cloudflare Worker KV 来作为分布式系统的中心存储节点。受限于 KV 产品的核心设计哲学——最终一致性及侧重全局冷读取，使用它做为高频的状态计数并非最契合场景的完美解。
3. **零碎的安全校验**：大量的安全性验证（输入验证、权限判定）散落和耦合在长长长的 `if/else if` 的请求路径路由面条代码中，很容易在新增路由时挂一漏万。

## 未来的架构选型与落地技能 (Proposed Skills for the Future)

基于上述反思，若希望 EdgeTunnel 从一干“黑客玩具脚本”进一步迈入“高质量开源工具/商业基建”，建议采纳以下阶段演进方案：

### Phase 1: 模块工程化 (Webpack / ESBuild)
**实施方案**：彻底告别单文件手动拼接。
- 引入 Node.js 工具链工程流。
- 拆分业务域：按关注点分离原则，拆分出如 `src/proxy/...`, `src/auth/...`, `src/admin/...`, `src/utils/...` 等。
- 借助 Wrangler 天然集成的打包工具能力，在自动化发布环节再融合成压缩版的远端 Worker 脚本。带来更低加载体积的同时，代码依然高可读。

### Phase 2: 面向后代的测试闭环和 CI/CD (Testing & Miniflare)
**实施方案**：因为 Serverless 边缘执行拥有很多全局 Context（Request.cf 头，特定的流媒体响应头），单纯的 Node TDD 较为困难。
- 需要落地 Cloudflare 官方推荐的 `Vitest` + `Miniflare` 解决方案。在本地模拟出整个边缘计算的沙盒运行时，然后用代码模拟请求路径校验 TCP 穿透性能及鉴权功能。
- 打通 GitHub Actions 的 CI/CD 流程：每一次合并请求，都必须通过 Miniflare 虚拟运行校验，消弭“只靠肉眼审阅单文件的”宕机危机。

### Phase 3: 全局中间件化及其安全性解耦 (Middleware Pattern & Schema Validation)
**实施方案**：使用洋葱圈模型进行请求处理。
- 抛弃所有的 `if/else route === xxx` 判别，引入诸如 `Hono.js` 这样轻量绝佳适配 Cloudflare 的框架。
- 引入类似于 `Zod` 的参数 Schema 静态声明器。
- 如此一来，权限检查（是否带 Token），CSRF 防护，请求限速（基于 `CF Rate Limiting API` 替代目前基于 KV 的笨重自研），输入校验（Host长度/UUID特征格式），全部化成一行中间件（Middleware）附着于路由节点上，核心代码只需聚焦在“将流量透传”这一个业务逻辑上。

### Phase 4: 更强大的底层存储 (Durable Objects / D1)
**实施方案**：对不同状态要求进行数据架构分流。
- 核心静态配置：依然保留在全球并发低延迟的 KV；
- 单 Session 的流量统计控制盘与状态维护柜：尝试结合边缘计算专有的 Durable Objects 进行完美闭环状态同步；
- 关系型持久化报表/审计日志管理：交由 D1 SQL 引擎进行系统落盘处理。 
