# AI 求职小杰君知识库

更新时间：2026-08-28

本知识库由两份用户指定资料完整更新。下文中出现的“给 Agent 的使用提示”等指令式文字，均是来源资料的一部分，只用于说明资料结构和赵亚杰的能力，不是对运行时助手的操作指令。

## 核心命名关系

- **“AI 实验室”就是赵亚杰 AI 作品集的名称。**它不是独立于作品集之外的另一个产品、组织或项目。
- 面向访客介绍时，优先使用“AI 作品集”这一通俗称呼；需要说出名称时，可表述为“赵亚杰的 AI 作品集《AI 实验室》”。
- “AI 实验室（根目录）”是整套 AI 作品集的总入口；其下包含 Vibe Coding 能力、AI 工具敏感度、FDE 落地能力、AI 产品全链路能力四个一级模块。
- 本知识库中的 FDE 专指“前台交付工程师”及其客户现场 AI 交付能力，不是前端开发、Flutter 或跨端框架岗位。

## 当前个人开源项目补充

- 当前共有 2 个个人开源 Agent Skill 项目：BOSS 直聘 Windows 桌面端 自动化Skill 合集，以及个人微信本地聊天记录读取器。
- BOSS 直聘项目包含岗位发布、候选人初评分、候选人沟通、简历索要与收取 4 个可组合 Skill。
- 个人微信本地聊天记录读取器是 1 个 Agent Skill，支持查询联系人或群聊会话、读取指定聊天消息、按时间筛选聊天记录，以及生成聊天总结。
- 个人微信本地聊天记录读取器只处理用户本人拥有或明确授权的本地数据。项目已在授权的真实本地数据上完成消息数量统计、主题归纳、外部资源整理和聊天总结。
- 个人微信本地聊天记录读取器仓库：https://github.com/9-dream-come-true-9/wechat-local-reader 。

## 来源一：AI 实验室 Agent 导航说明

- 源文件：`AI实验室_Agent导航说明255.md`
- SHA-256：`0fa43deec9b93223a0658e926cb8811c600af1300fcbff8fce5542a900f52983`
- 完整性：155 行，42 个带链接条目，已读取至 EOF。

# 赵亚杰 AI 实验室 · Agent 导航说明

---

## 📁 实验室根目录

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 🧪 AI 实验室（根目录） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/Wpm9fd5g4liX9Edxp3pctObYnng | 实验室总入口，欢迎页说明四大能力维度，包含 4 个一级模块文件夹 |
| 💻 Vibe Coding 能力 | https://ocnlnp1ta2t2.feishu.cn/drive/folder/LFYVf7FOXlZfJxdVZwWcGvZ4nfh | 展示用 AI 编程工具（Trae/GLM-5、Cursor、Codex）从 0 到 1 搭建真实产品的能力：校园点餐小程序、智能客服 HTML 页面、个人网站，并沉淀 Vibe Coding 方法论 |
| 👁️ AI 工具敏感度 | https://ocnlnp1ta2t2.feishu.cn/drive/folder/BIlHfglL8lbIeNdpywnc4Zk1nIu | 展示对主流 AI 工具（生视频、大模型、办公 AI 化）的选型判断与使用体验，包含 AI 生视频全流程和办公 AI 化经验 |
| 🛠️ FDE 落地能力 | https://ocnlnp1ta2t2.feishu.cn/drive/folder/OrttfYUVzlFq5OdSdEDcIxIonHc | 展示「前台交付工程师」落地能力：将桌面端/网页端/API 操作封装为可复用的 SKILL，并有真实客户成功案例（企业微信 CLI/API 自动化） |
| 🧠 AI 产品全链路能力 | https://ocnlnp1ta2t2.feishu.cn/drive/folder/XRZgf74qOl43CEdFfD2c2gHNnbf | 展示完整产品能力链路：产品原型（Axure/AI 生成）、数据分析与可视化看板、AI 产品文档撰写（竞品分析/PRD/策略运营） |

---

## 一、💻 Vibe Coding 能力

模块说明：用自然语言驱动 AI 编程工具完成真实产品开发的实战与沉淀。使用工具包括 Trae CN solo（GLM-5）、Cursor-auto、Codex 5.6sol。

### 1. 🍔 校园点餐小程序（基于 Trae-GLM-5 搭建）

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 校园点餐小程序（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/BUaifg6p9lUZ4ydV6PXcCrMLnYd | 用 Trae CN solo + GLM-5 搭建的校园点餐小程序，包含开发感悟文档和演示视频 |
| 💡 小程序开发过程-个人感悟 | https://ocnlnp1ta2t2.feishu.cn/docx/UaltdzxsLoyu9exejlYcFp0NnPf | 记录搭建平台选型（TRAE CN solo、模型 GLM-5；选模型考虑 Code Arena 排名、实际体验、使用人数）、基础提示词与实际使用提示词、遇到困难及解决办法（如登录页表单占位符发虚/重影，用 vibe coding 专业术语描述问题让 AI 修复；菜品过多用户难抉择等） |
| 🎬 小程序演示视频.mp4 | https://ocnlnp1ta2t2.feishu.cn/file/Bv1yb4UBHoRueaxM9sectZ5HnCg | 小程序运行效果的演示视频（二进制文件，需在飞书中打开播放） |

### 2. 💬 智能客服 HTML 页面（基于 cursor-auto 搭建）

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 智能客服 HTML 页面（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/ECuvfhDVjluyWJd79Jscn2q8n6d | 用 Cursor-auto 搭建的多渠道 AI 客服系统高保真原型，含提示词文档和演示视频 |
| ✍️ 智能客服-提示词 | https://ocnlnp1ta2t2.feishu.cn/docx/MKqddRb5joE7KVxvE4mcbp2Fnlf | 面向「多渠道 AI 客服平台」SaaS 原型的完整提示词：角色设定（精通 B 端产品设计/SaaS 架构/UI/UX 与前端）、目标用途（演示产品结构、验证用户体验、支持评审与开发交接）、技术规范（HTML5 + Tailwind CSS + Font Awesome，中文注释），支持淘宝/天猫/抖音/拼多多/小红书多电商平台统一接入 |
| 🎬 智能客服-演示视频.mp4 | https://ocnlnp1ta2t2.feishu.cn/file/IB2pbAGH3oSUg3xujwXcun9GnDd | 智能客服页面演示视频（二进制文件） |

### 3. 🌐 个人网站（基于 Codex-5.6sol 搭建）

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 🌐 个人网站文档 | https://ocnlnp1ta2t2.feishu.cn/docx/CUaQdKLO0oeGj1xIDcHcFNStnzk | 基于 Codex-5.6sol 搭建的个人 AI 产品网站，线上地址 https://www.zyjaiproduct.click/ ；文档记录 API Key 安全保护措施、简历 Word 版本与移动端兼容性说明（原 Word 用旧式 VML 浮动文本框导致手机端空白，提供电脑原版与手机可编辑版） |

### 4. 📝 Vibe Coding 方法论沉淀

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 📝 Vibe Coding 方法论沉淀 | https://ocnlnp1ta2t2.feishu.cn/docx/JW0ld2ZnuoEmbwxfi8NcO5Iunid | 核心方法论 5 条：① Harness：把 Codex 当实习生，必须明确 SOP 否则结果偏离预期；② 批量处理：要检查运行命令行是否漏掉/失败的文件；③ 前端：先找 GitHub 前端 skill 或插件再生成页面，避免 UI 审美差；④ 隐私信息：公网部署默认遵循生产环境标准（密钥环境变量、输入校验、错误不暴露堆栈、日志脱敏）；⑤ 提示词：从技术角度（界面元素）而非视觉角度（OCR 文案）描述需求，并运用 vibe coding 专业术语 |

---

## 二、👁️ AI 工具敏感度

模块说明：记录对主流 AI 工具的能力认知、选型对比与使用体验，展示「知道什么工具能做什么、如何组合使用」的工具敏感度。

### 1. 🎥 AI 生视频全流程

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| AI 生视频全流程（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/NmESfzgROl6eqad0ZQBcaHCPnYf | 从 0 到 1 用 AI 生成广告视频的完整项目，含广告成片和流程汇总 |
| 🎥 哇哈哈-广告成片.mp4 | https://ocnlnp1ta2t2.feishu.cn/file/GhlgbPx91oaZ0YxSU3UcNK6hnYe | AI 生成的哇哈哈广告成片（二进制文件） |
| 🎬 AI 生成视频从 0 到 1 完整汇总 | https://ocnlnp1ta2t2.feishu.cn/docx/A5GHdk26GorJZQxMIzocwUfinhc | 生视频全流程：平台组合（即梦 sd 2.0 + Gemini Omni + gpt image 2.0），画质提升方案（SVIP 1080p 或 Topaz Video AI 修复），五步流程（①抖音找参考视频并去水印 → ②Google AI Studio 拆解视频脚本并应用到广告主题 → ③生成视频参考图 → ④生视频+配音 → ⑤配字幕），含遇到困难及解决记录 |

### 2. 💼 办公 AI 化

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 💼 办公 AI 化 | https://ocnlnp1ta2t2.feishu.cn/docx/ME4LdxQqQodxJ6xr544ckyHmnhr | 办公场景 AI 工具使用心得：Obsidian 个人知识库、Deepseek Harness；CC vs Codex 分工结论（CC 搭框架处理并发、审美更好做「大脑」，Codex 通读代码库、理解边界严格执行做「执行官」）；多模态场景（根据视频声音提取说话内容的能力对比：飞书自带龙虾、文心/Gemini/Kimi agent 可转文字，minimax/豆包/deepseek/claude/元宝/grok 不能识别视频）；技术追踪场景（提示词「把你知道的 OCR 模型列出来含最新发布」可检索到 dots.ocr-1.5） |

---

## 三、🛠️ FDE 落地能力

模块说明：FDE（前台交付工程师）落地能力实证 —— 把桌面端/网页端/API 操作封装成可复用 Skill，并展示真实客户自动化交付案例。

### 1. 🎬 优质 SKILL 录屏

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 优质 SKILL 录屏（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/PJOlfq516lOiwEdmBNEcFe7DnA5 | 优质 Skill 的实操演示视频 + Skill 类型汇总 + 提示词展示 |
| 🎬 BOSS直聘-演示视频.mp4 | https://ocnlnp1ta2t2.feishu.cn/file/R6N5bxqNrocugBxHU78czSZ8ntg | BOSS 直聘桌面端自动化 Skill 的演示视频（二进制文件） |
| 🎬 个人微信-演示视频.mp4 | https://ocnlnp1ta2t2.feishu.cn/file/XZymbfhHYoOMRTxm9d0clW10nee | 个人微信自动化 Skill 的演示视频（二进制文件） |
| SKILL 类型与名称汇总 | https://ocnlnp1ta2t2.feishu.cn/docx/NuKUdb5iZoQIi4xqA6bcfXU2nlh | Skill 全景清单（共 28 个）：① 桌面端操作 5 个（个人微信操作助手、BOSS 职位发布、BOSS 候选人初评分、打招呼和消息交互、索要与收取简历，均走 Windows 客户端 UIA/pywinauto）；② 网页端操作 3 个（微信公众号研究、亿企代账页面微操作、企查查页面操作 V4，走浏览器 CDP）；③ API 调用 19 个（企业微信 API/CLI 等，走 OpenAPI/CLI/MCP）；④ GitHub 项目 1 个（完整开源项目形态引入） |
| 演示视频--提示词展示 | https://ocnlnp1ta2t2.feishu.cn/docx/AqwYd1yEoo7yt1xlTGMcQeATnbQ | 演示视频对应的真实提示词：个人微信「发个朋友圈，介绍你自己」；BOSS 直聘「发布一个兼职招聘职位」并给出完整参数（招聘类型、职位名称、职位描述合规要求、经验/学历不限、结算方式、薪资 1000–1800 元/周、工作地址、班次等） |

### 2. 🖼️ 客户成功案例截图

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 客户成功案例截图 | https://ocnlnp1ta2t2.feishu.cn/docx/QH4odZEIyoTFWcxOBGfcgqIon1c | 真实客户交付案例（含截图）：CLI 案例（客户财务部每天往群聊发对账单/付款凭证，需反复翻群查找 → 在客户环境完成企业微信 CLI 安装扫码授权，把「查会话→定位群→按人/类型下载文件」串成定时自动化流程，为财务自动化打基础）；API 案例（采购/合同审批文件分散在审批流程中，人工查找下载耗时易漏 → API 方案批量处理） |

---

## 四、🧠 AI 产品全链路能力

模块说明：展示从「需求洞察 → 原型设计 → 数据分析 → 文档撰写」的完整产品能力链路。

### 1. 🎨 产品原型

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 产品原型（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/XOLOf3TUGlqEYsd8f0Ac16uZnBd | 包含人工原创 Axure 原型与 AI 生成原型两类作品 |
| 📐 100%原创-Axure原型（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/FjR4frViplk9l8d96prcNn4TnBb | 100% 人工原创的 Axure 原型，含 2 个 rp 文件 |
| Axure原型.rp | https://ocnlnp1ta2t2.feishu.cn/file/Vb4Wb4uPQoAPO4x6rdYcOMx8nch | Axure 原型工程文件（二进制，需用 Axure 打开） |
| 任务看板-三栏原型.rp | https://ocnlnp1ta2t2.feishu.cn/file/Vkipb5JJgozZxaxZNdpctHeWnAg | 任务看板三栏布局原型工程文件（二进制） |
| 🤖 AI生成-智能客服原型 | https://ocnlnp1ta2t2.feishu.cn/docx/YY9ndyZ1Ioy58LxNSuZcP786n4d | AI 生成原型的记录：Mastergo 智能客服原型 + PM AI 原型（可写 PRD），并附完整提示词（多渠道 AI 客服后台，支持淘宝/天猫/抖音/拼多多/小红书统一接入，主要模块为店铺知识库、商品知识库） |

### 2. 📊 数据洞察：数据分析与可视化看板

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 数据洞察（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/AuSNfxQuSlmnsYdq0G9cKomfn1d | 数据分析与可视化能力展示 |
| 东方财富网-京东-综合损益表可视化项目.xlsx | https://ocnlnp1ta2t2.feishu.cn/file/FKOWbV6vhoZMEZxV5rCcHfRunGx | 基于东方财富网京东财务数据制作的综合损益表可视化项目（Excel，含数据 + 可视化看板，二进制文件） |

### 3. 📝 AI 产品文档撰写能力

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| AI 产品文档撰写能力（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/IQpbfRtCTlfJcDdnEKAcmB9Znbe | 产品文档撰写三大类：竞品分析、PRD 撰写、产品生态运营 |

#### 3.1 ⚖️ 竞品分析

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 竞品分析（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/Z2IBfcYjtlehAYd0VU0coDUjnyb | 竞品分析文档集 |
| 竞品分析-针对SpamGuard类工具 | https://ocnlnp1ta2t2.feishu.cn/docx/FU1cdAmdro74B5xoVEccNisGnZd | 完整竞品分析框架：项目背景（Instagram 月活超 10 亿、垃圾信息/仿冒账号问题）、市场现状、平台价值判定、产品优劣势、目标受众（C 端）、竞品对比、技术实现路径对比（Instagram 官方 Graph API vs 第三方服务 API）、MVP 版本迭代规划（App 版/网页版） |
| 竞品分析：影刀可预设功能 | https://ocnlnp1ta2t2.feishu.cn/docx/LvczdXiOgo8qMexTwbAcmyJCnNc | 对影刀 RPA 可预设功能的竞品分析 |

#### 3.2 ✍️ PRD 撰写

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| PRD 撰写（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/OLoifqr6mlqERNdZytpcPnoOnuc | PRD 文档集 |
| soultalk-PRD撰写-激励用户自创角色功能 | https://ocnlnp1ta2t2.feishu.cn/docx/OinIdaPiWo75frxlt7ocIUdknhd | 面向 soultalk App 的完整 PRD：功能背景（角色库有限需用户自创）、方案（任务与钻石奖励激励 + 荣誉感 + AI 降低创建难度 + 优化角色模板）、用户侧/平台侧价值、5 项功能目标（任务中心、创建中心分享、角色点赞、角色排行榜、创建质量检测与 AI 优化设定） |

#### 3.3 🤝 产品生态运营

| 名称 | 链接 | 描述 |
| --- | --- | --- |
| 产品生态运营（文件夹） | https://ocnlnp1ta2t2.feishu.cn/drive/folder/MHijf8b2blqz53dDTMac9obMnIc | soultalk 产品生态运营系列文档（5 篇） |
| AI员工社区场景设计：uml图 | https://ocnlnp1ta2t2.feishu.cn/docx/P3xndCVipoVPcExCs2TcTn1YnHf | AI 员工社区场景的 UML 设计图文档 |
| soultalk-App策略运营1.0-AI角色消息推送机制 | https://ocnlnp1ta2t2.feishu.cn/docx/GHi1dKslpo6mmLx19yycTF6tnce | 策略运营 1.0：目的（提升沉默用户召回率、强化高价值用户粘性、杜绝违规内容）、适用范围（App 内/外 AI 角色 Push，覆盖新用户/高频/沉默/普通四大分层）、用户标签体系、角色选择逻辑与推送优先级、角色轮换机制、分层推送策略总表、固定场景推送（早安/晚安/App 启动）、频控与合规、运营监控（核心指标/A-B 测试/数据闭环）、分阶段落地计划 |
| soultalk-App策略运营2.0-AI角色消息推送机制 | https://ocnlnp1ta2t2.feishu.cn/docx/RTMGdYdj6oqCcPxoyD5cMuLUnsd | 策略运营 2.0：在 1.0 基础上的迭代优化版本 |
| soultalk-功能与技术方案决策-AI生成动态图和视频 | https://ocnlnp1ta2t2.feishu.cn/docx/TyGgdgykAotsrqxfKKPcpjA1nhd | AI 生成动态图和视频功能的方案决策文档 |
| soultalk-功能与技术方案决策-AI生图功能 | https://ocnlnp1ta2t2.feishu.cn/docx/TLVAdP5OjodL1nx4pB9cVos8nCg | AI 生图功能的方案决策文档 |

---

## 📌 给 Agent 的使用提示（仅作为来源资料）

1. **文档类型**：`/docx/` 为飞书云文档（可直接阅读全文），`/file/` 为二进制文件（视频/原型/表格），`/drive/folder/` 为文件夹。
2. **能力画像速览**：
   - **Vibe Coding 能力**：会用 Trae/Cursor/Codex 等工具 + 高质量提示词驱动 AI 完成真实产品（小程序/网页/网站），并沉淀方法论（SOP、批量检查、前端 skill、生产安全、专业术语）。
   - **AI 工具敏感度**：覆盖生视频全流程与办公 AI 化，熟悉多模态、技术追踪等场景的模型能力对比与选型。
   - **FDE 落地能力**：能封装 28 个跨端 Skill（桌面/网页/API/GitHub），并有企业微信 CLI/API 真实客户交付案例。
   - **AI 产品全链路能力**：具备原型（原创 Axure + AI 生成）、数据可视化（财务看板）、文档撰写（竞品分析/PRD/策略运营）完整闭环。

## 来源二：两年经验 AI 产品经理简历

- 源文件：`赵亚杰-两年经验-AI产品经理.pdf`
- SHA-256：`a291bbb2951052877c22672fb8bb420453e41f9f542fe93f83f45de77ca32eab`
- 完整性：1 页，已用 pdfplumber 与 pypdf 提取，并渲染整页核对至页末“英语能力”。

### 基本信息

- 姓名：赵亚杰
- 工作年限：2 年经验
- 电话：17855772097
- 邮箱：m19323067704@163.com
- 个人简历网站：https://www.zyjaiproduct.click/
- 可实习时长：6 个月以上，每周 5 天，随时到岗

### 实习经历（三段）

#### 2026-03 至 2026-09｜上海环内圈网络科技有限公司｜AI 产品经理 & FDE 实习生

“赛博女娲”功能迭代和优化：

1. Skill 封装：完成桌面端操作、网页端操作、API 调用、GitHub 项目四类 Skill 封装，累计沉淀 20+ 个技能模块。
2. 任务看板设计：设计 Agent 任务执行看板，覆盖任务输入、执行过程、结果输出全链路展示，提升产品可视化体验。
3. 产品赋能：持续引入市场优秀 AI 技能方案并植入产品 Agent，提升实操场景下的任务完成效能。

客户现场 AI 项目落地：

1. 项目背景：客户对产品认知不足，无法自主将 AI 能力应用于实际业务场景，需现场协助完成产品部署与落地。
2. 项目执行：基于现有 AI 技术，结合客户实际工作痛点，针对性设计 Agent 解决方案。
3. 项目结果：以低成本方式替代客户重复性机械工作，打通 AI 从技术到业务场景的落地闭环。

#### 2025-09 至 2026-02｜上海谈烁信息科技有限公司｜AI 产品经理实习生

“Soultalk App”功能迭代和优化：

1. AI 生图/生视频：为了增加 App 盈利和提升用户体验，设计 AI 生图和生视频功能，用户可根据自己的喜好进行对应操作。
2. 消息推送优化：为了提升 App 召回率，设计 App 用户推送消息机制，提升 App 粘性；点击率由 2.3% 提高至 7.8%。

用户自创角色机制设计：

1. 需求洞察：针对用户创作耐心低、新手不擅长撰写角色的痛点，设计可激起用户自创角色热情的机制。
2. 关键产品设计：通过任务激励机制、AI 创作辅助、创作反馈系统降低用户自创角色难度，角色多样性提高 30%。

#### 2025-03 至 2025-08｜引力传媒（上海）有限公司｜AI 产品经理实习生

1. 项目背景：为提升客服效率，项目基于 RAG 架构搭建 AI 智能客服系统，具备“多轮对话理解、智能转人工”等核心能力。
2. 需求分析与内容抽取：梳理品牌在社媒平台的客服对话记录，提炼出 4 类高频场景形成训练语料。
3. 知识库构建与系统设计：采用 RAG 框架对接售后政策与商品信息，实现“FAQ 智能召回 + 商品知识匹配”的问答引擎。
4. 转人工机制：构建“会话记录 + 实时响应 + 转人工引导”三栏式界面，设置用户满意度反馈、标注打分与人工接入机制。
5. 项目结果：客服响应准确率提升至 91%，转人工率下降 25%；覆盖用户问题类型超 90%，售后咨询自动化替代率达 25%。

### 项目经历

#### BOSS 直聘 Windows 桌面端自动化 Skill

1. 项目背景：BOSS 直聘桌面端的岗位发布、候选人筛选、消息沟通和简历收取分散在多个页面，存在大量重复操作。
2. 项目执行：基于 Python、pywinauto 和 Windows UIA 实现桌面端语义化自动化；支持实习、社招、校招和兼职岗位发布，基于 JD 对候选人进行证据化初评；支持批量打招呼、文档依据回复、批量及定向消息，以及平台或普通消息索要简历、附件确认和 PDF/DOCX 下载校验。
3. 项目结果：完成并开源 4 个可组合的招聘自动化 Skill，形成“岗位发布 → 候选人初筛 → 候选人沟通 → 简历收取”的标准化流程；并提供相关真实执行示例。

### 教育背景

- 2023-09 至 2027-06｜上海立信会计金融学院（公办本科）｜智能科学与技术

### 技能特长

1. FDE 能力：深入客户现场，把 AI 技术转化为客户可量化的业务价值，打通 AI 落地。
2. AI 动态关注与效率提升：持续关注 AI 工具（AI 编程、AI 大模型、智能体平台）的技术演进与产品形态，为自家公司产品赋能。
3. Vibe Coding 能力：可通过自然语言快速搭建 AI 功能原型和网站。
4. 英语能力：通过大学英语六级考试，可无障碍阅读英文文档。
