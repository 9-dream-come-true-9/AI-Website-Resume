# 赵亚杰 · AI Product Manager & FDE Portfolio

一个面向 AI 产品经理与 FDE 求职场景的个人主页，集中展示我的客户现场 AI 落地能力、Agent 与 Skill 产品经验、项目成果和联系方式。网站同时内置「AI 求职小杰君」，访客可以直接询问我的项目、经历、岗位匹配度和作品集信息。

[在线访问网站](https://www.zyjaiproduct.click/) · [查看飞书作品集](https://ocnlnp1ta2t2.feishu.cn/drive/folder/Wpm9fd5g4liX9Edxp3pctObYnng)

## 网站内容

- **个人定位**：2 年经验 AI 产品经理与 FDE，专注客户现场 AI 落地、Agent 方案、Skill 封装和 Vibe Coding；首页速览 3 段 AI 产品实习、客户现场 Agent 落地能力，以及 6 个月以上可实习时长
- **核心项目**：BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集，内含岗位发布、候选人初评分、候选人沟通、简历索要与收取 4 个可组合 Skill
- **量化成果**：沉淀 20+ 个技能模块，个性化 Push 点击率由 2.3% 提升至 7.8%，角色多样性提高 30%，RAG 客服响应准确率达到 91%
- **经历展示**：一级展示任职/就读时间、公司或学校及岗位/专业；公司通过“点击查看详情”进入项目细节，学校教育信息直接展开
- **AI 求职助手**：以最新简历和 AI 实验室导航为知识上下文，支持流式回答、快捷提问、历史消息、编辑与复制
- **多端体验**：响应式布局、玻璃卡片视觉、入场动效与减少动态效果适配

## 技术实现

| 模块 | 实现方式 |
| --- | --- |
| 页面结构 | 原生 HTML5 |
| 视觉与响应式 | 原生 CSS3 |
| 页面交互 | 原生 JavaScript |
| AI 接口 | Vercel Serverless Function |
| 模型接入 | OpenAI-compatible Chat Completions API |
| 部署 | Vercel |

AI 助手先通过 `/api/chat-challenge` 获取短时访问验证，再通过 `/api/chat` 访问服务端模型代理。API Key 仅保存在部署平台的环境变量中，不会写入前端代码或提交到仓库。

## 项目结构

```text
.
├── api/
│   ├── assistant-knowledge-base.md  # 最新简历与 AI 实验室完整知识库
│   ├── chat.js                      # AI 助手模型代理接口
│   ├── chat-challenge.js            # 访问挑战入口
│   └── _chat-protection.js          # Redis 限流、会话、挑战与并发保护
├── assets/                      # 视频、插画与图标资源
├── index.html                   # 页面结构与内容
├── style.css                    # 视觉样式与响应式布局
├── script.js                    # 页面交互与 AI 助手逻辑
├── preloader.js                 # 首屏加载与资源预载
├── package.json
└── vercel.json                  # Vercel 与安全响应头配置
```

## 本地运行

请先安装 [Node.js](https://nodejs.org/)。

```bash
npm install
npx vercel dev
```

启动后按终端提示访问本地地址。只需预览静态页面时，也可以直接打开 `index.html`；AI 助手需要通过 Vercel 本地开发环境运行。

## 环境变量

在本地创建 `.env`，或在 Vercel 项目设置中添加以下变量：

```text
AI_API_KEY=your_api_key
AI_API_BASE=https://apihub.agnes-ai.com/v1
AI_MODEL=agnes-2.0-flash
AI_MAX_COMPLETION_TOKENS=1200
AI_MAX_CONTINUATIONS=0

# 生产环境必须配置：单区域 Upstash Redis REST
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token
CHAT_REDIS_NAMESPACE=production

# 推荐：Cloudflare Turnstile。secret 只放服务端环境变量
TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
TURNSTILE_ALLOWED_HOSTNAMES=www.example.com,example.com
TURNSTILE_ACTION=portfolio_chat
# 可选：turnstile 或 hmac；不填时有 Turnstile 配置则优先 Turnstile
# CHAT_PROTECTION_MODE=turnstile

# 公开助手额度
CHAT_IP_WINDOW_MS=600000
CHAT_IP_WINDOW_MAX=5
CHAT_IP_DAY_MS=86400000
CHAT_IP_DAY_MAX=20
CHAT_SESSION_WINDOW_MS=3600000
CHAT_SESSION_WINDOW_MAX=20
CHAT_GLOBAL_DAY_MS=86400000
CHAT_GLOBAL_DAY_MAX=200
CHAT_GLOBAL_CONCURRENCY=10
CHAT_UPSTREAM_TIMEOUT_MS=30000
CHAT_MAX_MESSAGE_CHARS=800
CHAT_MAX_BODY_CHARS=8192
```

默认额度可以直接这样理解：同一签名会话每小时最多 **20 次**；同一 IP 每 10 分钟最多 5 次、每天最多 20 次；全站每天最多 200 次模型请求，同时最多 10 个请求在执行。会话额度是体验层限制，IP 与全站额度才是防止 API Key 被集中刷爆的硬上限。

其中 `AI_API_KEY`、Upstash REST 两项，以及 Turnstile 的 site key、secret key、hostname allowlist 三项，是 Turnstile 生产模式的必填项。`CHAT_REDIS_NAMESPACE` 建议按 Vercel 环境分别设置为 `production`、`preview` 等，避免预览环境消耗生产额度。服务端在生产环境缺少 Redis 或 Turnstile 三项配置时会直接返回 `503`，不会降级成匿名模型代理。若暂时没有 Turnstile，必须明确选择较弱的 HMAC 过渡模式，并同时配置：

```text
CHAT_PROTECTION_MODE=hmac
CHAT_CHALLENGE_SECRET=至少 32 个随机字符
CHAT_ALLOW_HMAC_CHALLENGE=true
```

HMAC 挑战仍可被脚本自动化，不等同于真实浏览器验证；建议只作为过渡方案。

[Cloudflare 官方说明](https://developers.cloudflare.com/china-network/faq/#is-turnstile-available-in-mainland-china) Turnstile 不支持中国大陆，大陆访客可能无法完成验证；此时可以明确设置 `CHAT_PROTECTION_MODE=hmac`，并保留 Redis 全局额度。如果访客主要在支持 Turnstile 的地区，设置 `CHAT_PROTECTION_MODE=turnstile` 可强制使用浏览器验证。不要在生产环境设置 `CHAT_PROTECTION_MODE=off`。

每次模型请求只包含完整知识库和本次问题，不携带历史对话。`AI_MAX_COMPLETION_TOKENS=1200` 限制单次回答预算；Hosted Preview/Production 会在代码层把上限硬封为 1200，不会继承旧环境变量中的更大值。`AI_MAX_CONTINUATIONS=0` 关闭自动续写，避免一次访客请求变成多次上游计费调用；Vercel Preview/Production 会在代码层强制续写为 `0`。保护模块使用 Redis 滑动窗口、带 HMAC 签名与过期时间的 HttpOnly 会话 cookie、全站并发槽位和一次性挑战；IP/会话标识会先哈希后写入 Redis。上游超时默认 30 秒，租约会自动覆盖 Redis 配额检查、上游超时和安全余量，避免超时请求释放后产生并发重入。清除 cookie 不能绕过 IP/全局硬额度。`.env` 已被 Git 忽略，请勿提交真实密钥。

Upstash 集成也可使用兼容的 `KV_REST_API_URL` 与 `KV_REST_API_TOKEN` 变量。Redis 应使用单一数据库/区域，以减少全站硬额度的跨区域超发。Preview 若使用 `*.vercel.app` 域名，应配置独立 Turnstile widget/hostname 与 Redis namespace；否则只从正式域名测试。修改 Vercel 环境变量后必须重新部署才会生效。

应用层保护不能替代模型供应商的账单保险。建议给公开作品集创建独立 API Key，并在供应商控制台设置尽可能低的日预算、余额告警、TPM/RPM 或并发上限；即使 Redis 或挑战配置错误，供应商侧仍能阻断超额消费。

旧版 `CHAT_RATE_LIMIT_WINDOW_MS` / `CHAT_RATE_LIMIT_MAX` 已不再参与限流；请改用上面的 `CHAT_IP_*`、`CHAT_SESSION_*` 和 `CHAT_GLOBAL_*` 配置。

## 部署

1. 将本仓库导入 Vercel。
2. 在项目的 Environment Variables 中配置模型服务变量。
3. 使用仓库根目录作为项目根目录并完成部署。

更详细的部署说明见 [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md)。

## 说明

本仓库用于维护赵亚杰的个人作品集网站。页面中的项目数据、经历与联系方式均为个人展示内容。

<!-- Push notification test: documentation-only change; no website runtime files modified. -->
