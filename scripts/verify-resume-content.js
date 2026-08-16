const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pageHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

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
  'BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集',
  '4 个可组合 Skill',
  '29 名候选人脱敏初评',
  '完整工作流演示',
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
  '2023.09 — 2027.06',
  '可实习 6 个月以上、每周 5 天、随时到岗'
];

for (const fact of pageOnlyFacts) {
  assert(pageHtml.includes(fact), `index.html is missing current resume fact: ${fact}`);
}

for (const userProvidedFact of [
  '智能科学与技术 本科',
  '具备英文技术文档阅读能力',
  '持有 Python 编程三级证书'
]) {
  assert(pageHtml.includes(userProvidedFact), `index.html is missing user-provided fact: ${userProvidedFact}`);
}

assert(readme.includes('https://www.zyjaiproduct.click/'));
assert(readme.includes('BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集'));

const projectsStart = pageHtml.indexOf('<section id="projects"');
const projectsEnd = pageHtml.indexOf('<section id="contact"', projectsStart);
assert(projectsStart !== -1 && projectsEnd > projectsStart, 'Missing bounded #projects section');
const projectsSection = pageHtml.slice(projectsStart, projectsEnd);
const projectCardCount = (projectsSection.match(/\bclass="[^"]*\bproject-card\b[^"]*"/g) || []).length;

assert(projectsSection.includes('<span class="text-span">项目介绍</span>'));
assert.strictEqual(projectCardCount, 1, `Expected exactly one project card, found ${projectCardCount}`);
assert(projectsSection.includes('id="project-boss-automation"'));
assert(projectsSection.includes('一个项目内的 4 个 Skill'));
assert(projectsSection.includes('https://github.com/9-dream-come-true-9/boss-zhipin-desktop-skills'));

for (const removedProjectId of [
  'project-soultalk-ai',
  'project-soultalk-ugc',
  'project-rag-service'
]) {
  assert(!projectsSection.includes(removedProjectId), `#projects still includes removed card: ${removedProjectId}`);
}

assert(readme.includes('**核心项目**：BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集'));

for (const staleFact of [
  'AI 营销工具：内容生成与 KOL 推荐',
  '高转化内容点击率提升 22%',
  '分析 500+ 客服历史对话'
]) {
  assert(!pageHtml.includes(staleFact), `index.html still contains stale or unsupported fact: ${staleFact}`);
}

console.log('Resume content synchronization check passed.');
