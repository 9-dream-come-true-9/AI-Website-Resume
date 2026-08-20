# Vercel 部署清单

把当前仓库根目录作为 Vercel 项目根目录上传或导入。

## 必须包含

```text
index.html
style.css
script.js
assets/
api/chat.js
api/chat-challenge.js
api/_chat-protection.js
api/assistant-knowledge-base.md
package.json
vercel.json
```

## 模型、Redis 与访问验证环境变量

本地已创建 `.env` 用于开发调试。这个文件包含真实密钥，只能留在本地，不要上传。

Vercel 线上环境变量需要在项目后台配置：

```text
AI_API_KEY=你的 Agnes API Key
AI_API_BASE=https://apihub.agnes-ai.com/v1
AI_MODEL=agnes-2.0-flash
AI_MAX_COMPLETION_TOKENS=1200
AI_MAX_CONTINUATIONS=0

# Upstash Redis REST（生产环境必须；使用单一区域/数据库）
UPSTASH_REDIS_REST_URL=https://你的数据库.upstash.io
UPSTASH_REDIS_REST_TOKEN=你的 Redis REST Token
CHAT_REDIS_NAMESPACE=production

# Cloudflare Turnstile（推荐；secret 只能放 Vercel 环境变量）
TURNSTILE_SITE_KEY=你的 Site Key
TURNSTILE_SECRET_KEY=你的 Secret Key
TURNSTILE_ALLOWED_HOSTNAMES=www.zyjaiproduct.click,zyjaiproduct.click
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

默认额度：同一签名会话每小时最多 **20 次**；同一 IP 每 10 分钟最多 5 次、每天最多 20 次；全站每天最多 200 次模型请求，同时最多 10 个请求并发执行。会话额度用于日常体验控制，IP 与全站额度用于限制公开 API 的最大损失。

每次模型请求只包含完整知识库和本次问题，不携带历史对话。公开环境会把单次输出上限硬封为 1200 tokens，即使 Vercel 旧环境变量残留更大值也不会放大单次成本；同时在代码层强制关闭自动续写，避免一次访客请求变成多次计费调用。即使 Vercel 旧环境变量残留 `AI_MAX_CONTINUATIONS=1/2`，Hosted Preview/Production 仍按 `0` 执行。会话 cookie 带 HMAC 签名和服务端过期校验，清除 cookie 仍不能绕过 IP/全局硬额度。Agnes 2.0/2.5 Flash 会使用 `chat_template_kwargs: { enable_thinking: false }` 关闭思考；Qwen 会使用顶层 `enable_thinking: false`，MiniMax-M3 会使用 `thinking: { type: "disabled" }`。其他模型不会注入未经其官方文档确认的私有参数。

生产环境缺少 Redis 或 Turnstile 的 site key、secret key、hostname allowlist 任一项时，接口会 fail closed（直接返回 503），不会重新开放匿名模型代理。若暂时没有 Turnstile，必须明确选择较弱的 HMAC 过渡模式，并同时配置：

```text
CHAT_PROTECTION_MODE=hmac
CHAT_CHALLENGE_SECRET=至少 32 个随机字符
CHAT_ALLOW_HMAC_CHALLENGE=true
```

一次性 HMAC 挑战仍可被脚本自动化，不等同于 Turnstile，不建议长期使用。`CHAT_REDIS_NAMESPACE` 应按 Vercel 环境区分；若 Preview 与 Production 共用 Redis，也至少使用不同 namespace。

[Cloudflare 官方说明](https://developers.cloudflare.com/china-network/faq/#is-turnstile-available-in-mainland-china) Turnstile 不支持中国大陆，大陆访客可能无法完成验证；可明确设置 `CHAT_PROTECTION_MODE=hmac` 使用 Redis 一次性挑战。如果访客主要在支持 Turnstile 的地区，可设置 `CHAT_PROTECTION_MODE=turnstile` 强制浏览器验证。生产环境不要设置 `CHAT_PROTECTION_MODE=off`。

Upstash 也可使用兼容的 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 变量。修改 Vercel 环境变量后必须重新部署。若关闭 Fluid Compute，请确认 Vercel Functions 的最大执行时长不低于 60 秒；代码自身会在 30 秒上游超时并释放租约。

模型供应商侧还应使用“公开作品集专用”的独立 API Key，并设置日预算、余额告警、TPM/RPM 或并发硬上限。Redis 和 Turnstile 负责应用层防护，供应商限额是密钥泄漏或配置错误时的最后保险。

旧版 `CHAT_RATE_LIMIT_WINDOW_MS` / `CHAT_RATE_LIMIT_MAX` 已废弃，不会影响新的 Redis 限流；请使用 `CHAT_IP_*`、`CHAT_SESSION_*` 和 `CHAT_GLOBAL_*`。

## 不要上传 / 不要写入前端

```text
.env
真实 API Key
server.js
knowledge/
neocities_site/
```

API Key 只能放 Vercel Environment Variables，不能写进 `index.html` 或 `script.js`。

Turnstile 的 site key 可以由 `/api/chat-challenge` 返回给浏览器，属于公开配置；secret key、Redis token 和 AI key 只能留在服务端环境变量。Turnstile 控制台的 hostname 必须与 `TURNSTILE_ALLOWED_HOSTNAMES` 完全对应，action 使用 `portfolio_chat`。Preview 若使用 `*.vercel.app` 域名，应配置独立 widget/hostname 与 `CHAT_REDIS_NAMESPACE=preview`，否则只从正式域名测试。
