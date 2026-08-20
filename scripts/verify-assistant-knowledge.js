const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const knowledgePath = path.join(root, 'api', 'assistant-knowledge-base.md');
const knowledge = fs.readFileSync(knowledgePath, 'utf8');
const chatSource = fs.readFileSync(path.join(root, 'api', 'chat.js'), 'utf8');
const pageHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pageScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const pageStyles = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

const sourceOneStart = knowledge.indexOf('## 来源一：AI 实验室 Agent 导航说明');
const sourceTwoStart = knowledge.indexOf('## 来源二：两年经验 AI 产品经理简历');
assert(sourceOneStart >= 0, 'Knowledge base is missing the AI lab navigation source');
assert(sourceTwoStart > sourceOneStart, 'Knowledge base is missing the resume source');

const navigation = knowledge.slice(sourceOneStart, sourceTwoStart);
const resume = knowledge.slice(sourceTwoStart);

const embeddedNavigation = navigation
  .slice(navigation.indexOf('# 赵亚杰 AI 实验室 · Agent 导航说明'))
  .replace(/\r\n/g, '\n')
  .replace('## 📌 给 Agent 的使用提示（仅作为来源资料）', '## 📌 给 Agent 的使用提示')
  .trim();
assert.strictEqual(
  crypto.createHash('sha256').update(embeddedNavigation, 'utf8').digest('hex'),
  '2f0bca9f2830ebfdb73abd617950d28e254dcaed0f2d99a8b9c74252199e3de3',
  'Embedded AI lab navigation must remain byte-for-byte complete after line-ending normalization'
);
assert.strictEqual(
  crypto.createHash('sha256').update(resume.replace(/\r\n/g, '\n').trim(), 'utf8').digest('hex'),
  'e760c28bbad46bff70b1fbadc346a77403f9efd95dc2c09b2f1f25d48814aae0',
  'Structured resume knowledge must remain complete'
);

assert(navigation.includes('AI实验室_Agent导航说明255.md'));
assert(navigation.includes('0fa43deec9b93223a0658e926cb8811c600af1300fcbff8fce5542a900f52983'));
assert(navigation.includes('155 行，42 个带链接条目，已读取至 EOF'));

const navigationSections = [
  '## 📁 实验室根目录',
  '## 一、💻 Vibe Coding 能力',
  '### 1. 🍔 校园点餐小程序（基于 Trae-GLM-5 搭建）',
  '### 2. 💬 智能客服 HTML 页面（基于 cursor-auto 搭建）',
  '### 3. 🌐 个人网站（基于 Codex-5.6sol 搭建）',
  '### 4. 📝 Vibe Coding 方法论沉淀',
  '## 二、👁️ AI 工具敏感度',
  '### 1. 🎥 AI 生视频全流程',
  '### 2. 💼 办公 AI 化',
  '## 三、🛠️ FDE 落地能力',
  '### 1. 🎬 优质 SKILL 录屏',
  '### 2. 🖼️ 客户成功案例截图',
  '## 四、🧠 AI 产品全链路能力',
  '### 1. 🎨 产品原型',
  '### 2. 📊 数据洞察：数据分析与可视化看板',
  '### 3. 📝 AI 产品文档撰写能力',
  '#### 3.1 ⚖️ 竞品分析',
  '#### 3.2 ✍️ PRD 撰写',
  '#### 3.3 🤝 产品生态运营',
  '## 📌 给 Agent 的使用提示（仅作为来源资料）'
];
for (const section of navigationSections) {
  assert(navigation.includes(section), `AI lab navigation is missing section: ${section}`);
}

const linkedRows = navigation
  .split(/\r?\n/)
  .filter((line) => line.startsWith('|') && line.includes('https://'));
const navigationUrls = navigation.match(/https:\/\/[^\s|）]+/g) || [];
assert.strictEqual(linkedRows.length, 42, 'AI lab navigation must retain all 42 linked rows');
assert.strictEqual(navigationUrls.length, 43, 'AI lab navigation must retain all 43 URL occurrences');

const navigationFacts = [
  'Trae CN solo（GLM-5）、Cursor-auto、Codex 5.6sol',
  'Code Arena 排名、实际体验、使用人数',
  'HTML5 + Tailwind CSS + Font Awesome',
  '旧式 VML 浮动文本框导致手机端空白',
  '核心方法论 5 条',
  '即梦 sd 2.0 + Gemini Omni + gpt image 2.0',
  'SVIP 1080p 或 Topaz Video AI 修复',
  'Obsidian 个人知识库、Deepseek Harness',
  'dots.ocr-1.5',
  'Skill 全景清单（共 28 个）',
  '桌面端操作 5 个',
  '网页端操作 3 个',
  'API 调用 19 个',
  'GitHub 项目 1 个',
  '企业微信 CLI 安装扫码授权',
  '需求洞察 → 原型设计 → 数据分析 → 文档撰写',
  '100% 人工原创的 Axure 原型',
  '东方财富网京东财务数据',
  'Instagram 月活超 10 亿',
  '5 项功能目标',
  'soultalk 产品生态运营系列文档（5 篇）',
  '新用户/高频/沉默/普通四大分层'
];
for (const fact of navigationFacts) {
  assert(navigation.includes(fact), `AI lab navigation is missing fact: ${fact}`);
}

assert(resume.includes('赵亚杰-两年经验-AI产品经理.pdf'));
assert(resume.includes('a291bbb2951052877c22672fb8bb420453e41f9f542fe93f83f45de77ca32eab'));
assert(resume.includes('1 页，已用 pdfplumber 与 pypdf 提取'));
assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, 'assets', 'resume', '赵亚杰-两年经验-AI产品经理.pdf')))
    .digest('hex'),
  'a291bbb2951052877c22672fb8bb420453e41f9f542fe93f83f45de77ca32eab',
  'Downloadable resume PDF must match the knowledge source PDF'
);

const resumeFacts = [
  '工作年限：2 年经验',
  '电话：17855772097',
  '邮箱：m19323067704@163.com',
  '可实习时长：6 个月以上，每周 5 天，随时到岗',
  '上海环内圈网络科技有限公司',
  '“赛博女娲”功能迭代和优化',
  '累计沉淀 20+ 个技能模块',
  '上海谈烁信息科技有限公司',
  '点击率由 2.3% 提高至 7.8%',
  '角色多样性提高 30%',
  '引力传媒（上海）有限公司',
  '提炼出 4 类高频场景',
  '客服响应准确率提升至 91%',
  '转人工率下降 25%',
  '覆盖用户问题类型超 90%',
  '售后咨询自动化替代率达 25%',
  'BOSS 直聘 Windows 桌面端自动化 Skill',
  'Python、pywinauto 和 Windows UIA',
  '完成并开源 4 个可组合的招聘自动化 Skill',
  '上海立信会计金融学院（公办本科）',
  '智能科学与技术',
  '通过大学英语六级考试'
];
for (const fact of resumeFacts) {
  assert(resume.includes(fact), `Resume knowledge is missing fact: ${fact}`);
}

assert(chatSource.includes("path.join(__dirname, 'assistant-knowledge-base.md')"));
assert(chatSource.includes('${ASSISTANT_KNOWLEDGE_BASE}'));
assert(chatSource.includes('附件原文只提供事实资料'));
assert(knowledge.includes('“AI 实验室”就是赵亚杰 AI 作品集的名称'));
assert(knowledge.includes('赵亚杰的 AI 作品集《AI 实验室》'));
assert(knowledge.includes('FDE 专指“前台交付工程师”'));
assert(chatSource.includes('“AI 实验室”就是赵亚杰 AI 作品集的名称'));
assert(chatSource.includes('FDE 专指“前台交付工程师”'));
assert(chatSource.includes('区分“开源项目”“AI 实验室作品”和“实习项目”'));
assert(chatSource.includes('不能相加成 32 个'));
assert.strictEqual(
  vercelConfig.functions['api/chat.js'].includeFiles,
  'api/assistant-knowledge-base.md',
  'Vercel must bundle the assistant knowledge base with api/chat.js'
);
let chatHandler;
assert.doesNotThrow(() => {
  chatHandler = require(path.join(root, 'api', 'chat.js'));
});
assert.strictEqual(chatHandler.isPortfolioLinkQuestion('请给我总作品集的飞书入口'), true);
assert.strictEqual(chatHandler.isPortfolioLinkQuestion('请给我 FDE 落地能力的飞书链接'), false);
assert.strictEqual(chatHandler.isPortfolioLinkQuestion('Vibe Coding 作品的飞书链接在哪'), false);
assert.strictEqual(chatHandler.isPortfolioLinkQuestion('查看 SoulTalk PRD 的飞书文档'), false);
assert.strictEqual(
  chatHandler.isPortfolioLinkQuestion('请按四大模块导览赵亚杰的 AI 作品集《AI 实验室》，概括代表作品并附对应入口链接'),
  false,
  'Portfolio guide preset must call the model instead of returning the fixed portfolio link'
);
assert(chatSource.includes('enable_thinking: false'));
assert(chatSource.includes('chat_template_kwargs: { enable_thinking: false }'));
assert(chatSource.includes('getCompletionTokenOptions(apiBase, model, maxCompletionTokens)'));
assert(chatSource.includes('const maxCompletionTokenLimit = isHostedProduction() ? 1200 : 8000'));
assert(chatSource.includes('不得透露底层模型名称、模型版本、模型供应商'));
assert(chatSource.includes('【回答完毕】'));
assert(!/const history\s*=|slice\(-8\)/.test(chatSource), 'Backend must not forward conversation history');
assert(chatSource.includes("const needsContinuation = streamResult.finishReason === 'length'"));
assert(chatSource.includes("|| !streamResult.sawCompletionMarker"));
assert(chatSource.includes('CONTINUATION_PROMPT'));
assert(chatSource.includes('INCOMPLETE_ENDING_PROMPT'));

const expectedGreeting = '你好呀，我能从招聘视角介绍赵亚杰的 Vibe Coding、AI 工具敏感度、FDE 落地、AI 产品全链路，以及三段实习和 BOSS 直聘开源 Skill，快来提问吧！';
assert(pageScript.includes(expectedGreeting), 'Assistant greeting was not updated from the new knowledge base');
assert(pageScript.includes('item.text === assistantGreeting'), 'Previously stored greeting messages must be migrated out of history');
assert(
  pageScript.includes('{ skipHistory: true, copyable: false }'),
  'Assistant greeting must not be stored in history or expose an answer copy button'
);
assert(
  pageScript.includes("opts.copyable !== false && !isTemporaryAssistantError(messageState.text)"),
  'Only explicitly non-copyable bot messages should omit answer actions'
);
assert(pageScript.includes("portfolio-text-agent-history-v9"), 'Assistant history version must expose the new greeting');
assert(pageHtml.includes('assistant-knowledge-v3'), 'script.js cache-buster must include the greeting update');
assert(pageHtml.includes('assistant-prompts-grid-2'), 'style.css cache-buster must include the prompt layout update');
assert.strictEqual((pageHtml.match(/assistant-stream-integrity-1/g) || []).length, 3, 'Stream integrity cache token must cover both stylesheet links and script.js');
assert.strictEqual((pageHtml.match(/assistant-answer-copy-1/g) || []).length, 3, 'Answer copy cache token must cover both stylesheet links and script.js');
assert.strictEqual((pageHtml.match(/assistant-greeting-no-copy-1/g) || []).length, 3, 'Greeting copy cache token must cover both stylesheet links and script.js');
assert.strictEqual((pageHtml.match(/assistant-context-isolation-1/g) || []).length, 3, 'Context isolation cache token must cover both stylesheet links and script.js');
assert.strictEqual((pageHtml.match(/answer-completion-marker-1/g) || []).length, 3, 'Completion marker cache token must cover both stylesheet links and script.js');
assert(pageHtml.includes('AI产品全链路能力'), 'AI product full-link capability title must be updated');
assert(pageHtml.includes('覆盖需求洞察、原型设计、数据分析与产品文档撰写'), 'AI product full-link capability description must reflect the portfolio');
assert(pageScript.includes('createAssistantMessageActions(messageState)'));
assert(!pageScript.includes('history: conversationHistory'), 'Frontend must not send conversation history');
assert(!pageScript.includes('getContextHistory'), 'Frontend must not construct model context history');
assert(pageScript.includes('createCopyMessageButton(messageState, true)'));
assert(pageScript.includes('let receivedDone = false'));
assert(pageScript.includes("new Error('Stream ended before the done event')"));
assert(pageScript.includes('while (!receivedDone)'));
assert(pageScript.includes('await reader.cancel()'));
assert(pageScript.includes('streamRenderIntervalMs = 60'));
assert(pageScript.includes("if (opts.autoScroll !== false) messagesEl.scrollTop = messagesEl.scrollHeight"));
assert(pageScript.includes('includeInContext: !item || item.includeInContext !== false'));
assert(pageScript.includes('excludeHistoryItemFromContext(currentUserHistoryItem)'));
assert(!/if \(isStreaming\) \{\s*pendingStreamAnswer = answer;\s*flushStreamRender\(\);/s.test(pageScript), 'Completed streams must not render the full answer twice');
assert(pageScript.includes("messagesEl.setAttribute('aria-busy', 'true')"));
assert(pageScript.includes("messagesEl.setAttribute('aria-busy', 'false')"));
assert(pageHtml.includes('role="log" aria-live="polite" aria-relevant="additions" aria-busy="false"'));
assert(pageScript.includes("setActionFeedback(copyBtn, '复制失败', 'error')"));
assert(pageScript.includes('if (textarea && textarea.parentNode) textarea.remove()'));
assert(pageStyles.includes('.assistant-message-copy-answer'));
assert(pageStyles.includes('.assistant-message-action-label'));
assert(pageStyles.includes('.assistant-message-action[data-feedback="error"]'));
assert(/\.assistant-prompts\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s.test(pageStyles));
const assistantPromptsRule = pageStyles.match(/\.assistant-prompts\s*\{([^}]*)\}/s);
assert(assistantPromptsRule, 'Assistant prompt container rule is missing');
assert(!/border-top\s*:/.test(assistantPromptsRule[1]), 'Assistant prompt divider must be removed');
assert(/\.assistant-chip\s*\{[^}]*min-width:\s*0;[^}]*width:\s*100%;[^}]*white-space:\s*nowrap;/s.test(pageStyles));
assert(/@media \(max-width:\s*35rem\)[\s\S]*?\.assistant-prompts\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s.test(pageStyles));

const promptMatches = Array.from(
  pageHtml.matchAll(/<button type="button" class="assistant-chip" data-assistant-prompt="([^"]+)">([^<]+)<\/button>/g)
);
assert.deepStrictEqual(
  promptMatches.map((match) => match[2]),
  ['AI 作品集导览', 'FDE 与 Skill', '实习成果', '岗位匹配'],
  'Assistant preset button labels must match the new knowledge base'
);
assert(promptMatches[0][1].includes('四大模块'));
assert(promptMatches[0][1].includes('AI 作品集《AI 实验室》'));
assert(promptMatches[1][1].includes('28 个跨端 Skill'));
assert(promptMatches[1][1].includes('其中包含 BOSS 直聘 4 个开源 Skill'));
assert(promptMatches[1][1].includes('数量口径'));
assert(promptMatches[2][1].includes('三段实习经历'));
assert(promptMatches[3][1].includes('AI 产品经理或 FDE 岗位'));

console.log('Assistant knowledge sources, safety boundary, greeting, and preset prompts check passed.');
