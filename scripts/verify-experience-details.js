const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

function extractDialog(id) {
  const pattern = new RegExp(`<dialog\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/dialog>`);
  const match = html.match(pattern);
  assert(match, `Missing experience dialog: ${id}`);
  return match[0];
}

const experienceSectionIndex = html.indexOf('<section id="experience"');
const projectsSectionIndex = html.indexOf('<section id="projects"');
assert(experienceSectionIndex !== -1, 'Missing #experience section');
assert(projectsSectionIndex !== -1, 'Missing #projects section');
assert(
  experienceSectionIndex < projectsSectionIndex,
  '#experience must appear before #projects in document order'
);

const primaryNavStart = html.indexOf('<nav class="nav-links"');
const primaryNavEnd = html.indexOf('</nav>', primaryNavStart);
const primaryNav = html.slice(primaryNavStart, primaryNavEnd);
assert(
  primaryNav.indexOf('href="#experience"') < primaryNav.indexOf('href="#projects"'),
  'Primary navigation must list experience before projects'
);

const triggerMatches = Array.from(
  html.matchAll(/<button\b[^>]*data-experience-dialog-open="([^"]+)"[^>]*aria-controls="([^"]+)"[^>]*>([^<]+)<\/button>/g)
);
assert.strictEqual(triggerMatches.length, 3, 'Exactly three company detail triggers are required');

const expectedEntries = new Map([
  ['experience-huanneiquan', {
    date: '2026.03 — 2026.09',
    title: '上海环内圈网络科技有限公司 · AI产品经理 &amp; FDE实习生'
  }],
  ['experience-tanshuo', {
    date: '2025.09 — 2026.02',
    title: '上海谈烁信息科技有限公司 · AI产品经理实习生'
  }],
  ['experience-gravity', {
    date: '2025.03 — 2025.08',
    title: '引力传媒（上海）有限公司 · AI产品经理实习生'
  }]
]);

for (const match of triggerMatches) {
  const [, targetId, controlsId, visibleAction] = match;
  assert.strictEqual(targetId, controlsId, `aria-controls mismatch for ${targetId}`);
  assert.strictEqual(visibleAction.trim(), '点击查看详情', `Unexpected action label for ${targetId}`);
  assert(html.includes(`id="${targetId}"`), `Trigger target does not exist: ${targetId}`);
  assert(html.includes('aria-haspopup="dialog"'), 'Company triggers must expose dialog semantics');
}

assert(!html.includes('data-experience-dialog-open="experience-school'), 'School must not open a dialog');
assert(!html.includes('id="experience-school'), 'School dialog must not exist');

const schoolEntryMatch = html.match(
  /<p\b[^>]*class="[^"]*experience-entry-static[^"]*"[^>]*>[\s\S]*?上海立信会计金融学院（公办本科）[\s\S]*?<\/p>/
);
assert(schoolEntryMatch, 'School must be rendered as a static paragraph entry');
assert(
  /class="[^"]*experience-entry-education[^"]*"/.test(schoolEntryMatch[0]),
  'School must use the education grid layout'
);
assert(
  schoolEntryMatch[0].includes('<span class="experience-entry-secondary experience-entry-education-major">智能科学与技术</span>'),
  'School major must occupy the education grid action column without a repeated degree'
);
assert(!schoolEntryMatch[0].includes('智能科学与技术 本科'), 'School major must not repeat the undergraduate degree');
for (const interactiveMarker of ['<button', '<a ', 'tabindex=', 'role="button"', 'data-experience-dialog-open']) {
  assert(
    !schoolEntryMatch[0].includes(interactiveMarker),
    `School entry must remain non-interactive: ${interactiveMarker}`
  );
}

const timelineStart = html.indexOf('<div class="timeline reveal"');
const firstDialogStart = html.indexOf('<dialog class="experience-detail-dialog"', timelineStart);
const visibleTimeline = html.slice(timelineStart, firstDialogStart);

for (const [targetId, entry] of expectedEntries) {
  assert(visibleTimeline.includes(entry.date), `Primary timeline is missing date for ${targetId}`);
  assert(visibleTimeline.includes(entry.title), `Primary timeline is missing company and role for ${targetId}`);
}

for (const schoolFact of [
  '2023.09 — 2027.06',
  '上海立信会计金融学院（公办本科）',
  '智能科学与技术',
  '通过大学英语六级，具备英文技术文档阅读能力；持有 Python 编程三级证书。'
]) {
  assert(visibleTimeline.includes(schoolFact), `Primary timeline is missing school fact: ${schoolFact}`);
}

for (const hiddenInlineFact of [
  '<time',
  'timeline-date',
  'timeline-content',
  '2.3% → 7.8%',
  '客服响应准确率',
  '累计沉淀 20+ 个技能模块'
]) {
  assert(
    !visibleTimeline.includes(hiddenInlineFact),
    `The primary timeline still exposes secondary detail: ${hiddenInlineFact}`
  );
}

const huanneiquan = extractDialog('experience-huanneiquan');
for (const fact of [
  '“赛博女娲”功能迭代与客户现场 AI 落地',
  '桌面端操作、网页端操作、API 调用、GitHub 项目等 4 类 Skill 封装',
  '累计沉淀 20+ 个技能模块',
  '任务输入、执行过程、结果输出',
  '客户现场 AI 项目落地',
  '打通 AI 从技术到业务场景的落地闭环'
]) {
  assert(huanneiquan.includes(fact), `Huanneiquan dialog is missing resume fact: ${fact}`);
}
for (const repeatedFact of [
  '2026.03 — 2026.09',
  '上海环内圈网络科技有限公司',
  'AI产品经理 &amp; FDE实习生',
  'AI 产品经理 &amp; FDE 实习生'
]) {
  assert(!huanneiquan.includes(repeatedFact), `Huanneiquan dialog repeats primary fact: ${repeatedFact}`);
}

const tanshuo = extractDialog('experience-tanshuo');
for (const fact of [
  'SoulTalk App 功能迭代与自创角色机制',
  'AI 生图与生视频',
  '点击率由 2.3% 提高至 7.8%',
  '任务激励机制、AI 创作辅助、创作反馈系统',
  '角色多样性提高 30%'
]) {
  assert(tanshuo.includes(fact), `Tanshuo dialog is missing resume fact: ${fact}`);
}
for (const repeatedFact of [
  '2025.09 — 2026.02',
  '上海谈烁信息科技有限公司',
  'AI产品经理实习生',
  'AI 产品经理实习生'
]) {
  assert(!tanshuo.includes(repeatedFact), `Tanshuo dialog repeats primary fact: ${repeatedFact}`);
}

const gravity = extractDialog('experience-gravity');
for (const fact of [
  '基于 RAG 的 AI 智能客服系统',
  '多轮对话理解、智能转人工',
  '提炼出 4 类高频场景并形成训练语料',
  'FAQ 智能召回 + 商品知识匹配',
  '客服响应准确率提升至 91%',
  '转人工率下降 25%',
  '覆盖用户问题类型超 90%',
  '售后咨询自动化替代率达 25%'
]) {
  assert(gravity.includes(fact), `Gravity dialog is missing resume fact: ${fact}`);
}
for (const repeatedFact of [
  '2025.03 — 2025.08',
  '引力传媒（上海）有限公司',
  'AI产品经理实习生',
  'AI 产品经理实习生'
]) {
  assert(!gravity.includes(repeatedFact), `Gravity dialog repeats primary fact: ${repeatedFact}`);
}

assert(!html.includes('class="experience-detail-meta"'), 'Secondary dialogs must not repeat primary date or role metadata');

assert(script.includes('function initExperienceDialogs()'), 'Missing dialog initializer');
assert(script.includes("document.querySelectorAll('[data-experience-dialog-open]')"), 'Missing trigger binding');
assert(script.includes('dialog.showModal()'), 'Experience details must use native showModal()');
assert(script.includes("dialog.addEventListener('cancel'"), 'Missing Escape/cancel handling');
assert(script.includes("dialog.addEventListener('keydown'"), 'Missing explicit Escape key handling');
assert(script.includes("dialog.addEventListener('close'"), 'Missing close handling');
assert(script.includes("lastTrigger.focus({ preventScroll: true })"), 'Missing focus restoration');
assert(script.includes('initExperienceDialogs();'), 'Dialog initializer is not called');

for (const styleMarker of [
  '.experience-entry {',
  '.experience-entry-company,',
  '.experience-entry-education {',
  '.experience-entry-education-major {',
  '.experience-entry-education .experience-entry-description {',
  '.experience-entry-date {',
  '.experience-entry-title {',
  '.experience-entry-action {',
  '.experience-entry-action:focus-visible',
  '.experience-detail-dialog {',
  '.experience-detail-dialog::backdrop',
  '@starting-style',
  '@media (hover: hover) and (pointer: fine)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert(css.includes(styleMarker), `Missing experience interaction style: ${styleMarker}`);
}

assert(
  /\.experience-entry-company,\s*\.experience-entry-education\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*7\.75rem;/s.test(css),
  'Company actions and school major must share the same fixed grid column'
);
assert(
  /\.experience-entry-education-major\s*\{[^}]*grid-column:\s*2;[^}]*font-weight:\s*800;[^}]*text-align:\s*center;/s.test(css),
  'School major must be bold and centered in the shared action column'
);
assert(
  /\.experience-entry-education \.experience-entry-description\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*color:\s*#7f54e8;[^}]*font-weight:\s*800;/s.test(css),
  'School credentials must span the card in bold accessible purple'
);
assert(
  !/\.experience-entry-education \.experience-entry-description\s*\{[^}]*text-align:\s*center;/s.test(css),
  'School credentials must retain the requested left alignment'
);

console.log('Experience section order and dialog interaction check passed.');
