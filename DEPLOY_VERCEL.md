# Vercel 部署清单

把 `vercel_site/` 作为 Vercel 项目根目录上传或导入。

## 必须包含

```text
index.html
style.css
script.js
assets/
api/chat.js
api/assistant-knowledge-base.md
package.json
vercel.json
```

## MiniMax 环境变量

本地已创建 `.env` 用于开发调试。这个文件包含真实密钥，只能留在本地，不要上传。

Vercel 线上环境变量需要在项目后台配置：

```text
AI_API_KEY=你的 MiniMax API Key
AI_API_BASE=https://api.minimaxi.com/v1
AI_MODEL=MiniMax-M3
AI_MAX_COMPLETION_TOKENS=2000
AI_MAX_CONTINUATIONS=1
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=12
```

`AI_MAX_COMPLETION_TOKENS` 用于降低长回答中途截断的概率；如果上游仍返回长度截断或停在裸编号、冒号等明显残缺结尾，服务端会按 `AI_MAX_CONTINUATIONS` 自动续写，默认续写 1 次。Qwen 会使用 `enable_thinking: false`，MiniMax-M3 会使用 `thinking: { type: "disabled" }`；MiniMax M2.x 不支持关闭思考，因此不会注入这个 M3 专属参数。

## 不要上传 / 不要写入前端

```text
.env
真实 API Key
server.js
knowledge/
neocities_site/
```

API Key 只能放 Vercel Environment Variables，不能写进 `index.html` 或 `script.js`。
