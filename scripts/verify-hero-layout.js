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
const heroCopyEnd = hero.indexOf('<div class="hero-visual">');
assert(heroCopyEnd > 0, 'Missing bounded hero copy card');
const heroCopy = hero.slice(0, heroCopyEnd);

assert(
  hero.includes('<span class="phrase-highlight">AI 产品经理 &amp; FDE 候选人。</span>'),
  'The full Chinese role phrase and punctuation must share one no-wrap span'
);

const factCards = hero.match(/class="hero-resume-fact\b[^\"]*"/g) || [];
assert.strictEqual(factCards.length, 3, `Expected three resume fact cards, found ${factCards.length}`);

assert(!heroCopy.includes('class="tech-stack"'), 'Removed hero capability tags must not return');
assert(!heroCopy.includes('class="tech-tag'), 'Removed hero capability tag items must not return');
for (const removedTag of ['FDE 落地', 'Agent 方案', 'Skill 封装', 'RAG 架构', 'Vibe Coding']) {
  assert(!heroCopy.includes(`<span>${removedTag}</span>`), `Removed hero tag must not return: ${removedTag}`);
}

const heroCopySteps = Array.from(heroCopy.matchAll(/\bhero-copy-step-(\d+)\b/g), (match) => Number(match[1]));
assert.deepStrictEqual(heroCopySteps, [1, 2, 3, 4, 5, 6, 7, 8], 'Hero copy animation steps must remain contiguous after removing tags');

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
assert(/min-height:\s*3\.75rem/.test(chatRule), 'Desktop AI chat CTA must use the refined compact height');
assert(/margin:\s*0\.5rem auto 0/.test(chatRule), 'Desktop AI chat CTA must keep an explicit gap below the explanatory panel');
assert(
  /@media \(max-width:\s*74\.99rem\)[\s\S]*?\.hero-summary-chat\s*\{[^}]*margin-top:\s*0\.75rem;/.test(css),
  'Stacked AI chat CTA must keep an explicit gap below the explanatory panel'
);

const directionsRule = extractRule('.hero-summary-directions');
assert(/color:\s*var\(--color-ink\)/.test(directionsRule), 'Hero direction summary must use the primary ink color');

const assistantCopyRule = extractRule('.hero-summary-assistant p');
assert(/color:\s*var\(--color-accent\)/.test(assistantCopyRule), 'AI assistant summary copy must use the purple accent color');
assert(/font-weight:\s*800/.test(assistantCopyRule), 'AI assistant summary copy must use the requested bold emphasis');

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.section-hero > \.container\s*\{[^}]*max-width:\s*var\(--hero-max-width\);/.test(css),
  'Desktop hero must use its own enlarged container instead of widening every page section'
);

assert(/--hero-max-width:\s*108rem;/.test(css), 'Hero container must use the reviewed 108rem maximum width');
assert(/--hero-outer-rail:\s*3\.25rem;/.test(css), 'Hero and toolchain must share the reviewed outer rail');
assert(/--hero-axis-offset:\s*-0\.35rem;/.test(css), 'Hero and toolchain must share the navigation-axis offset');

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.hero-grid\s*\{[\s\S]*?grid-template-columns:\s*var\(--hero-outer-rail\)\s*minmax\(26rem, 1fr\)\s*var\(--hero-gap\)\s*minmax\(26rem, 1fr\)\s*var\(--hero-outer-rail\);[\s\S]*?translate:\s*var\(--hero-axis-offset\) 0;/.test(css),
  'Desktop hero must use equal enlarged card tracks, symmetric avatar safety rails, and the nav split offset'
);

const toolchainRule = extractRule('.toolchain');
assert(/width:\s*min\(100%, 48rem\)/.test(toolchainRule), 'Stacked toolchain must match the 48rem hero card width');
assert(/margin:\s*0 auto/.test(toolchainRule), 'Stacked toolchain must stay centered with the hero cards');
assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.toolchain\s*\{[^}]*width:\s*calc\(100% - var\(--hero-outer-rail\) - var\(--hero-outer-rail\)\);[^}]*max-width:\s*none;[^}]*translate:\s*var\(--hero-axis-offset\) 0;/.test(css),
  'Desktop toolchain must share the exact outer boundaries of the two hero cards'
);

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.hero-text,\s*\.hero-summary-card\s*\{[^}]*container-type:\s*inline-size;[^}]*padding:\s*clamp\(2rem, 2\.5vw, 2\.5rem\);/.test(css),
  'Desktop hero content must scale fluidly with the enlarged cards'
);

assert(
  /\.hero-text,\s*\.hero-summary-card\s*\{[^}]*width:\s*min\(100%, 48rem\);[^}]*min-width:\s*0;/.test(css),
  'Hero cards must be allowed to shrink to their shared responsive container width'
);

assert(
  /\.hero-title\s*\{[^}]*font-size:\s*clamp\(2\.45rem, 8\.4cqw, 3\.2rem\);/.test(css),
  'Hero title must scale proportionally with its card width'
);

assert(
  /--page-max-width:\s*108rem;/.test(css) && /--section-content-max:\s*80rem;/.test(css),
  'The full site must use the reviewed enlarged page and shared section widths'
);

for (const selector of ['.card-grid-4', '.timeline', '.project-case-study', '.contact-card']) {
  const rule = extractRule(selector);
  assert(
    /max-width:\s*var\(--section-content-max\)/.test(rule),
    `${selector} must use the shared enlarged section width`
  );
}

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.capability-card\s*\{[^}]*padding:\s*2rem;/.test(css) &&
    /@media \(min-width:\s*75rem\)[\s\S]*?\.contact-card\s*\{[^}]*padding:\s*3\.5rem;/.test(css),
  'Major desktop cards must enlarge their internal spacing along with their shells'
);

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.card-grid-4\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/.test(css),
  'Capability overview must stay in a compact two-column layout on desktop'
);

assert(
  /@media \(min-width:\s*75rem\)[\s\S]*?\.portfolio-guidance-hero \.portfolio-note\s*\{[^}]*bottom:\s*calc\(100% \+ 0\.55rem\);[^}]*flex-direction:\s*column-reverse;[^}]*align-items:\s*flex-end;/.test(css),
  'Desktop hero portfolio guidance must open upward and stay inside the left card'
);

assert(
  /\.hero-bio \.phrase-highlight\s*\{[^}]*display:\s*inline-block[^}]*white-space:\s*nowrap/.test(css),
  'The full role phrase must stay on one line at every supported viewport'
);

const cacheToken = 'hero-cta-baseline-1';
assert.strictEqual((html.match(new RegExp(cacheToken, 'g')) || []).length, 2, 'Hero stylesheet cache token must cover normal and noscript links');

const equalSplitCacheToken = 'hero-equal-nav-split-1-capabilities-timeline-width-1';
assert.strictEqual((html.match(new RegExp(equalSplitCacheToken, 'g')) || []).length, 2, 'Equal hero split cache token must cover normal and noscript links');

const siteScaleCacheToken = 'hero-roomy-layout-1-site-scale-1-assistant-glyph-avoidance-1';
assert.strictEqual((html.match(new RegExp(siteScaleCacheToken, 'g')) || []).length, 2, 'Whole-site scale and assistant avoidance cache token must cover normal and noscript links');

const toolchainAlignmentCacheToken = 'toolchain-hero-span-1';
assert.strictEqual((html.match(new RegExp(toolchainAlignmentCacheToken, 'g')) || []).length, 2, 'Toolchain-to-hero alignment cache token must cover normal and noscript links');

const assistantCtaGapCacheToken = 'hero-assistant-cta-gap-1';
assert.strictEqual((html.match(new RegExp(assistantCtaGapCacheToken, 'g')) || []).length, 2, 'Assistant CTA spacing cache token must cover normal and noscript links');

const portfolioNoteCacheToken = 'hero-portfolio-note-contained-1';
assert.strictEqual((html.match(new RegExp(portfolioNoteCacheToken, 'g')) || []).length, 2, 'Hero portfolio note cache token must cover normal and noscript links');

console.log('Hero roomy equal split, compact capabilities, CTA alignment, and resume enrichment check passed.');
