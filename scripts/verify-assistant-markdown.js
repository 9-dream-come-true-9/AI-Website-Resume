const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const documentHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const rendererStart = script.indexOf('  function renderMarkdown(');
const rendererEnd = script.indexOf('  function parseModelResponse(', rendererStart);
assert(rendererStart !== -1 && rendererEnd > rendererStart, 'Unable to locate the production Markdown renderer');

const context = {};
vm.runInNewContext(script.slice(rendererStart, rendererEnd), context);
assert.strictEqual(typeof context.renderMarkdown, 'function', 'Production Markdown renderer is not executable');

const representativeAnswer = [
  '### 1. 上海环内圈网络科技有限公司（2026.03 – 2026.09）',
  '',
  '**项目：** “赛博女娲”产品迭代与 FDE 客户现场交付',
  '',
  '- **Skill 封装：** 完成桌面端、网页端、API 调用及 GitHub 项目四类 Skill 封装。',
  '- **客户现场落地：** 深入客户现场协助部署。',
  '',
  '1. **履历与作品集高度对应**',
  '   三段实习经历均有材料佐证。',
  '',
  '2. **开源项目证据确凿**',
  '   仓库包含代码与演示。',
  '',
  '> 温馨提示：打开链接前，请先登录账号。',
  '',
  '作品集：[查看飞书作品集](https://example.com/portfolio)',
  '链接可用于进一步核实。'
].join('\n');

const html = context.renderMarkdown(representativeAnswer);

assert(html.includes('<h5>1. 上海环内圈网络科技有限公司（2026.03 – 2026.09）</h5>'), 'Markdown heading was not rendered');
assert(html.includes('<ul><li><strong>Skill 封装：</strong>'), 'Unordered list items or bold labels were not rendered');
assert(html.includes('<li><strong>客户现场落地：</strong>'), 'Second unordered list item was not rendered');
assert(html.includes('<ol start="1"><li><strong>履历与作品集高度对应</strong><br>三段实习经历均有材料佐证。</li></ol>'), 'First ordered-list number or its indented continuation was not preserved');
assert(html.includes('<ol start="2"><li><strong>开源项目证据确凿</strong><br>仓库包含代码与演示。</li></ol>'), 'A separated ordered-list number or its indented continuation was not preserved');
assert(html.includes('<blockquote>温馨提示：打开链接前，请先登录账号。</blockquote>'), 'Blockquote was not rendered');
assert(/<a href="https:\/\/example\.com\/portfolio"[^>]*>查看飞书作品集<\/a>/.test(html), 'Markdown link was not rendered');
assert(html.includes('作品集：<a href="https://example.com/portfolio" target="_blank" rel="noreferrer">查看飞书作品集</a><br>链接可用于进一步核实。'), 'Adjacent paragraph lines were not separated with a visible line break');

assert(
  /\.assistant-bubble\.is-markdown ul\s*\{[^}]*list-style\s*:\s*disc outside\s*;/s.test(css),
  'Assistant unordered lists must restore disc markers after the global list reset'
);
assert(
  /\.assistant-bubble\.is-markdown ol\s*\{[^}]*list-style\s*:\s*decimal outside\s*;/s.test(css),
  'Assistant ordered lists must explicitly retain decimal markers'
);
assert.strictEqual(
  (documentHtml.match(/assistant-markdown-rendering-1/g) || []).length,
  3,
  'Markdown renderer cache token must cover both stylesheet references and the script reference'
);

console.log('Assistant Markdown headings, lists, numbering, links, quotes, and emphasis checks passed.');
