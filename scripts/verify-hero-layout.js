const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

function extractRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  assert(match, `Missing CSS rule: ${selector}`);
  return match[1];
}

const heroStart = html.indexOf('<section id="hero"');
const heroEnd = html.indexOf('<section id="toolchain"', heroStart);
assert(heroStart !== -1 && heroEnd > heroStart, 'Missing bounded hero section');
const hero = html.slice(heroStart, heroEnd);

assert(
  hero.includes('<span class="phrase-highlight">AI 产品经理 &amp; FDE 候选人。</span>'),
  'The full Chinese role phrase and punctuation must share one no-wrap span'
);

const factCards = hero.match(/class="hero-resume-fact\b[^\"]*"/g) || [];
assert.strictEqual(factCards.length, 3, `Expected three resume fact cards, found ${factCards.length}`);

for (const fact of [
  'AI 产品实习',
  '<dd>3 段</dd>',
  '客户现场 Agent 落地',
  '<dd>FDE</dd>',
  '可实习时长 · 每周 5 天 · 随时到岗',
  '<dd>6 个月+</dd>'
]) {
  assert(hero.includes(fact), `Hero is missing resume-backed fact: ${fact}`);
}

assert(
  !/<dt>Skill 封装<\/dt>\s*<dd>4 类<\/dd>/.test(hero),
  'The removed Skill packaging fact must not return to the hero highlights'
);

assert(
  !/<dt>消息推送点击率<\/dt>/.test(hero),
  'The rejected push click-through highlight must not return to the hero'
);

assert(
  /<div class="hero-summary-assistant[^>]*>\s*<p>[\s\S]*?<\/p>\s*<\/div>\s*<button class="hero-summary-chat/.test(hero),
  'The AI chat button must be a bottom-aligned sibling of its explanatory panel'
);

const heroTextRule = extractRule('.hero-text');
assert(/display:\s*flex/.test(heroTextRule), 'Hero copy card must use flex layout');
assert(/flex-direction:\s*column/.test(heroTextRule), 'Hero copy card must use a vertical flex stack');

const actionsRule = extractRule('.hero-actions');
assert(/margin-top:\s*auto/.test(actionsRule), 'Work buttons must be pushed to the bottom of the hero card');

assert(
  /\.hero-summary-card\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*flex-start/.test(css),
  'Summary card content must start at the top'
);

const chatRule = extractRule('.hero-summary-chat');
assert(/min-height:\s*4\.25rem/.test(chatRule), 'Desktop AI chat CTA must match the work button height');
assert(/margin:\s*auto auto 0/.test(chatRule), 'AI chat CTA must be pinned to the summary card bottom');

assert(
  /\.hero-bio \.phrase-highlight\s*\{[^}]*display:\s*inline-block[^}]*white-space:\s*nowrap/.test(css),
  'The full role phrase must stay on one line at every supported viewport'
);

const cacheToken = 'hero-cta-baseline-1';
assert.strictEqual((html.match(new RegExp(cacheToken, 'g')) || []).length, 2, 'Hero stylesheet cache token must cover normal and noscript links');

console.log('Hero CTA alignment and resume enrichment check passed.');
