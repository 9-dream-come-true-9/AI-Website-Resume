const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pageHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const chatApi = fs.readFileSync(path.join(root, 'api', 'chat.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert(pageHtml.includes('<title>赵亚杰 · AI Product Manager &amp; FDE</title>'));
assert(pageHtml.includes('AI Product Manager &amp; FDE Portfolio'));

const pageFacts = [
  '2 年经验',
  '上海环内圈网络科技有限公司',
  '4 类 Skill 封装',
  '20+ 个技能模块',
  '上海谈烁信息科技有限公司',
  '2.3% 提高至 7.8%',
  '角色多样性提高 30%',
  '引力传媒（上海）有限公司',
  '客服响应准确率提升至 91%',
  '转人工率下降 25%',
  '售后咨询自动化替代率达 25%',
  'BOSS 直聘 Windows 桌面端 自动化Skill 合集',
  '4 个可组合 Skill',
  'pywinauto',
  'Windows UIA',
  '上海立信会计金融学院（公办本科）',
  '大学英语六级',
  '17855772097',
  'm19323067704@163.com'
];

for (const fact of pageFacts) {
  assert(pageHtml.includes(fact), `index.html is missing current resume fact: ${fact}`);
}

const pageOnlyFacts = [
  '2026.03 — 2026.09',
  '2025.09 — 2026.02',
  '2025.03 — 2025.08',
  '2023.09 — 2027.06'
];

for (const fact of pageOnlyFacts) {
  assert(pageHtml.includes(fact), `index.html is missing current resume fact: ${fact}`);
}

for (const userProvidedFact of [
  '智能科学与技术',
  '具备英文技术文档阅读能力',
  '持有 Python 编程三级证书'
]) {
  assert(pageHtml.includes(userProvidedFact), `index.html is missing user-provided fact: ${userProvidedFact}`);
}

assert(readme.includes('https://www.zyjaiproduct.click/'));
assert(readme.includes('BOSS 直聘 Windows 桌面端 自动化Skill 合集'));

const contactStart = pageHtml.indexOf('<section id="contact"');
assert(contactStart !== -1, 'Missing contact section');
const contactSection = pageHtml.slice(contactStart);
assert(!contactSection.includes('可实习 6 个月以上、每周 5 天、随时到岗。'));
assert(contactSection.includes('期待与贵公司共同探索 AI 产品落地的无限可能！欢迎联系我'));

const projectsStart = pageHtml.indexOf('<section id="projects"');
const projectsEnd = pageHtml.indexOf('<section id="contact"', projectsStart);
assert(projectsStart !== -1 && projectsEnd > projectsStart, 'Missing bounded #projects section');
const projectsSection = pageHtml.slice(projectsStart, projectsEnd);
const projectCardCount = (projectsSection.match(/\bclass="[^"]*\bproject-card\b[^"]*"/g) || []).length;
const projectFlowCount = (projectsSection.match(/\bclass="project-flow-number"/g) || []).length;
const projectDescLineCount = (projectsSection.match(/\bclass="project-desc-line"/g) || []).length;

assert(projectsSection.includes('<span class="text-span">项目介绍</span>'));
assert.strictEqual(projectCardCount, 2, `Expected exactly two project cards, found ${projectCardCount}`);
assert.strictEqual(projectFlowCount, 8, `Expected eight project capability steps, found ${projectFlowCount}`);
assert.strictEqual(projectDescLineCount, 3, `Expected three project description lines, found ${projectDescLineCount}`);

const bossProjectStart = projectsSection.indexOf('id="project-boss-automation"');
const wechatProjectStart = projectsSection.indexOf('id="project-wechat-local-reader"');
assert(bossProjectStart !== -1, 'Missing BOSS automation project card');
assert(wechatProjectStart > bossProjectStart, 'WeChat Local Reader must be the second project card');

const bossProjectCard = projectsSection.slice(bossProjectStart, wechatProjectStart);
const wechatProjectCard = projectsSection.slice(wechatProjectStart);

assert(bossProjectCard.includes('https://github.com/9-dream-come-true-9/boss-zhipin-desktop-skills'));
assert(!projectsSection.includes('个人开源项目 · 招聘自动化'));
assert(!projectsSection.includes('一个完整项目，贯通 BOSS 直聘桌面端招聘全流程'));
assert(!projectsSection.includes('针对招聘操作分散、对象易误选和任务易重复的问题'));
assert(bossProjectCard.includes('提供岗位发布、候选人初评分、批量及定向沟通、简历索要与收取能力'));
assert(bossProjectCard.includes('支持批量打招呼、文档回复、批量消息与指定联系人发送'));
assert(!projectsSection.includes('<strong>运行保障</strong>'));
assert(!projectsSection.includes('<strong>技术栈</strong>'));
assert(!projectsSection.includes('<strong>开源成果</strong>'));
assert(!projectsSection.includes('<strong>岗位发布</strong>'));
assert(!projectsSection.includes('<strong>候选人筛选</strong>'));
assert(!projectsSection.includes('<strong>消息与简历</strong>'));
assert(!projectsSection.includes('<strong>技术底座</strong>'));
assert(!projectsSection.includes('<strong>操作检查</strong>'));
assert(!projectsSection.includes('<strong>使用规则</strong>'));
assert(!projectsSection.includes('基于 Python、pywinauto 与 Windows UIA，实现 BOSS 直聘 Windows 客户端的语义化桌面自动化'));
assert(!projectsSection.includes('完成后检查岗位发布、消息发送和简历文件是否正确'));
assert(!projectsSection.includes('候选人评分最终由招聘人员判断'));
assert(!projectsSection.includes('非 BOSS 直聘官方项目'));

assert(wechatProjectCard.includes('个人微信本地聊天记录读取器'));
assert(wechatProjectCard.includes('https://github.com/9-dream-come-true-9/wechat-local-reader'));
assert(wechatProjectCard.includes('读取和分析本地微信聊天记录的 Agent Skill，支持查询会话、读取消息和生成聊天总结'));
assert(wechatProjectCard.includes('查询聊天会话'));
assert(wechatProjectCard.includes('读取聊天消息'));
assert(wechatProjectCard.includes('按时间筛选'));
assert(wechatProjectCard.includes('生成聊天总结'));
assert(!wechatProjectCard.includes('数据结构检查'));
assert(!wechatProjectCard.includes('密钥自动验证'));
assert(!wechatProjectCard.includes('候选密钥'));
assert(/<div class="project-case-heading">[\s\S]*?<\/div>\s*<div class="project-case-intro">/.test(projectsSection));
assert(/<div class="project-title-row">[\s\S]*?<h3[^>]*>BOSS 直聘 Windows 桌面端 自动化Skill 合集<\/h3>[\s\S]*?<a class="project-repo-link"/.test(bossProjectCard));
assert(/<div class="project-title-row">[\s\S]*?<h3[^>]*>个人微信本地聊天记录读取器<\/h3>[\s\S]*?<a class="project-repo-link"/.test(wechatProjectCard));
assert(/\.project-case-study\s*\{[\s\S]*?max-width:\s*var\(--section-content-max\);/.test(styleCss));
assert(/\.project-case-study\s*\{[\s\S]*?background:\s*var\(--color-bg-soft\);/.test(styleCss));
assert(/\.project-case-study \+ \.project-case-study\s*\{[\s\S]*?margin-top:\s*clamp\(1rem, 2vw, 1\.4rem\);/.test(styleCss));
assert(/\.project-case-study \.project-kicker,\s*\.project-case-study \.project-title\s*\{[\s\S]*?text-align:\s*center;/.test(styleCss));
assert(/@media \(min-width:\s*48rem\)[\s\S]*?\.project-title-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(8\.5rem, 1fr\) minmax\(0, 42rem\) minmax\(8\.5rem, 1fr\);/.test(styleCss));
assert(/\.project-title-row \.project-repo-link\s*\{[\s\S]*?flex:\s*0 0 auto;/.test(styleCss));
assert(/\.project-case-study \.project-desc\s*\{[\s\S]*?text-align:\s*center;[\s\S]*?text-wrap:\s*balance;/.test(styleCss));
assert(/\.project-compact-details\s*\{[\s\S]*?text-align:\s*center;/.test(styleCss));
assert(/\.project-compact-details p\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);[\s\S]*?justify-items:\s*center;/.test(styleCss));
assert(/@media \(max-width:\s*47\.99rem\)[\s\S]*?\.project-title-row \.project-repo-link\s*\{[\s\S]*?width:\s*auto;/.test(styleCss));
assert(/\.timeline\s*\{[\s\S]*?max-width:\s*var\(--section-content-max\);/.test(styleCss));

for (const removedProjectId of [
  'project-soultalk-ai',
  'project-soultalk-ugc',
  'project-rag-service'
]) {
  assert(!projectsSection.includes(removedProjectId), `#projects still includes removed card: ${removedProjectId}`);
}

assert(readme.includes('**核心项目**：2 个个人开源 Agent Skill 项目'));
assert(readme.includes('个人微信本地聊天记录读取器'));
assert(chatApi.includes('个人开源项目有 2 个：BOSS 直聘 Windows 桌面端 自动化Skill 合集，以及个人微信本地聊天记录读取器。'));
assert(chatApi.includes('https://github.com/9-dream-come-true-9/wechat-local-reader'));
assert(chatApi.includes('区分“开源项目”“AI 实验室作品”和“实习项目”'));

for (const staleFact of [
  'AI 营销工具：内容生成与 KOL 推荐',
  '高转化内容点击率提升 22%',
  '分析 500+ 客服历史对话'
]) {
  assert(!pageHtml.includes(staleFact), `index.html still contains stale or unsupported fact: ${staleFact}`);
}

console.log('Resume content synchronization check passed.');
