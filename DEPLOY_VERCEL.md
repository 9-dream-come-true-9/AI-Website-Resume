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

## Agnes 环境变量

本地已创建 `.env` 用于开发调试。这个文件包含真实密钥，只能留在本地，不要上传。

Vercel 线上环境变量需要在项目后台配置：

```text
AI_API_KEY=你的 Agnes API Key
AI_API_BASE=https://apihub.agnes-ai.com/v1
AI_MODEL=agnes-2.0-flash
AI_MAX_COMPLETION_TOKENS=2000
AI_MAX_CONTINUATIONS=1
CHAT_RATE_LIMIT_WINDOW_MS=60000
CHAT_RATE_LIMIT_MAX=12
```

`AI_MAX_COMPLETION_TOKENS` 用于降低长回答中途截断的概率；如果上游仍返回长度截断或停在裸编号、冒号等明显残缺结尾，服务端会按 `AI_MAX_CONTINUATIONS` 自动续写，默认续写 1 次。Agnes 2.0/2.5 Flash 会使用 `chat_template_kwargs: { enable_thinking: false }` 关闭思考；Qwen 会使用顶层 `enable_thinking: false`，MiniMax-M3 会使用 `thinking: { type: "disabled" }`。其他模型不会注入未经其官方文档确认的私有参数。

## 不要上传 / 不要写入前端

```text
.env
真实 API Key
server.js
knowledge/
neocities_site/
```

API Key 只能放 Vercel Environment Variables，不能写进 `index.html` 或 `script.js`。
