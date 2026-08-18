const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'style.css');
const htmlPath = path.join(root, 'index.html');
const scriptPath = path.join(root, 'script.js');

const css = fs.readFileSync(cssPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');
const script = fs.readFileSync(scriptPath, 'utf8');

function fail(message) {
  console.error(`Assistant callout regression: ${message}`);
  process.exitCode = 1;
}

function readBlock(source, startBraceIndex) {
  let depth = 0;
  for (let i = startBraceIndex; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startBraceIndex + 1, i);
      }
    }
  }
  return '';
}

function mediaBlocks(query) {
  const marker = `@media (${query})`;
  const blocks = [];
  let index = 0;
  while (index < css.length) {
    const start = css.indexOf(marker, index);
    if (start === -1) break;
    const brace = css.indexOf('{', start);
    if (brace === -1) break;
    blocks.push(readBlock(css, brace));
    index = brace + 1;
  }
  return blocks;
}

function ruleBlocks(scope, selector) {
  const blocks = [];
  let index = 0;
  while (index < scope.length) {
    const start = scope.indexOf(selector, index);
    if (start === -1) break;
    const brace = scope.indexOf('{', start);
    if (brace === -1) break;
    blocks.push(readBlock(scope, brace));
    index = brace + 1;
  }
  return blocks;
}

function hasDisplayNone(block) {
  return /display\s*:\s*none\b/.test(block);
}

function hasDisplayBlock(block) {
  return /display\s*:\s*block\b/.test(block);
}

const tablet = mediaBlocks('max-width: 74.99rem').join('\n');
const phone = mediaBlocks('max-width: 35rem').join('\n');
const guardComment = 'Regression guard: keep the assistant intro bubble visible on mobile.';
const guardStart = css.indexOf(guardComment);
const guardScope = guardStart === -1 ? '' : css.slice(guardStart);
const stylesheetVersions = Array.from(html.matchAll(/style\.css\?v=([^"']+)/g), (match) => match[1]);
const scriptVersions = Array.from(html.matchAll(/script\.js\?v=([^"']+)/g), (match) => match[1]);
const baseCalloutBlock = ruleBlocks(css, '.assistant-callout')[0] || '';
const fixedAssistantBlock = ruleBlocks(css, '.site-assistant').find((block) => /position\s*:\s*fixed\b/.test(block)) || '';
const launcherBlock = ruleBlocks(css, '.assistant-launcher')[0] || '';
const residentBlock = ruleBlocks(css, '.assistant-resident')[0] || '';
const avoidanceStart = script.indexOf('const summaryCopyElements');
const avoidanceEnd = script.indexOf('function loadHistory', avoidanceStart);
const avoidanceScope = avoidanceStart === -1 || avoidanceEnd === -1 ? '' : script.slice(avoidanceStart, avoidanceEnd);

if (!/<p\s+class="assistant-callout"\s+aria-hidden="true">/.test(html)) {
  fail('assistant callout must be non-interactive hint text');
}
if (html.includes('data-assistant-callout') || script.includes('calloutBtn')) {
  fail('assistant callout still has click behavior');
}
if (!/pointer-events\s*:\s*none\b/.test(baseCalloutBlock)) {
  fail('assistant callout must allow pointer input to pass through');
}
if (!/(?:-webkit-)?user-select\s*:\s*none\b/.test(baseCalloutBlock)) {
  fail('assistant callout must not capture accidental text selection');
}
if (!/pointer-events\s*:\s*none\b/.test(fixedAssistantBlock)) {
  fail('assistant root must allow uncovered pointer input to pass through');
}
if (!/pointer-events\s*:\s*auto\b/.test(launcherBlock)) {
  fail('assistant launcher must remain clickable');
}
if (!/right\s*:\s*max\(0\.25rem,\s*env\(safe-area-inset-right\)\)/.test(fixedAssistantBlock)) {
  fail('desktop assistant must dock inside the dedicated right safety rail');
}
if (!/--assistant-icon-size\s*:\s*110px/.test(fixedAssistantBlock) ||
    !/--assistant-frame-size\s*:\s*100px/.test(fixedAssistantBlock) ||
    !/--assistant-sprite-width\s*:\s*9200px/.test(fixedAssistantBlock) ||
    !/--assistant-sprite-end\s*:\s*-9100px/.test(fixedAssistantBlock)) {
  fail('desktop assistant must keep the original 110px launcher and 100px artwork frame');
}
if (!/--assistant-icon-size\s*:\s*80px/.test(tablet) ||
    !/--assistant-frame-size\s*:\s*72px/.test(tablet) ||
    !/--assistant-sprite-width\s*:\s*6624px/.test(tablet) ||
    !/--assistant-sprite-end\s*:\s*-6552px/.test(tablet)) {
  fail('tablet assistant must keep its original responsive dimensions');
}
if (!/--assistant-icon-size\s*:\s*64px/.test(phone) ||
    !/--assistant-frame-size\s*:\s*58px/.test(phone) ||
    !/--assistant-sprite-width\s*:\s*5336px/.test(phone) ||
    !/--assistant-sprite-end\s*:\s*-5278px/.test(phone)) {
  fail('phone assistant must keep its original responsive dimensions');
}
if (ruleBlocks(phone, '.hero-summary-card').some((block) => /padding(?:-right)?\s*:/.test(block))) {
  fail('phone summary card must inherit the same balanced padding as the profile card');
}
if (css.includes('--assistant-art-scale') || /@media \(min-width:\s*112rem\)/.test(css)) {
  fail('assistant artwork must not be simulated with scale or delayed to an ultra-wide breakpoint');
}
if (css.includes('is-avoiding-hero-summary') || script.includes('is-avoiding-hero-summary')) {
  fail('automatic summary collision state must not hide the avatar or callout');
}
if (!avoidanceScope) {
  fail('missing bounded summary-copy avoidance implementation');
} else {
  for (const selector of [
    '.hero-summary-eyebrow',
    '.hero-summary-title',
    '.hero-summary-intro',
    '.hero-summary-result-label',
    '.hero-summary-result-value',
    '.hero-summary-directions',
    '.hero-summary-assistant p',
    '.hero-summary-chat'
  ]) {
    if (!avoidanceScope.includes(selector)) fail(`summary-copy avoidance is missing ${selector}`);
  }
  for (const requiredCode of [
    'document.createTreeWalker',
    'NodeFilter.SHOW_TEXT',
    'document.createRange()',
    'range.getClientRects()',
    "element.classList.contains('hero-summary-chat')",
    'element.getBoundingClientRect()',
    '[toggleBtn, hideBtn].filter(Boolean)',
    'rectanglesOverlap',
    'currentCandidate',
    "window.matchMedia('(max-width: 74.99rem)')",
    'summaryCopyViewportMoving',
    'scheduleSummaryCopyAvoidanceAfterViewportMotion',
    'window.cancelAnimationFrame(summaryCopyAvoidanceFrame)',
    '}, 160)',
    'viewport.left + viewportPadding - avatarBounds.left',
    'viewport.right - viewportPadding - avatarBounds.right',
    'viewport.top + viewportPadding - avatarBounds.top',
    'viewport.bottom - viewportPadding - avatarBounds.bottom'
  ]) {
    if (!avoidanceScope.includes(requiredCode)) fail(`summary-copy avoidance is missing: ${requiredCode}`);
  }
  if (avoidanceScope.includes('callout') || avoidanceScope.includes('setInterval') || avoidanceScope.includes("resident.setAttribute('aria-hidden'") || avoidanceScope.includes("root.classList.contains('is-open')")) {
    fail('summary-copy avoidance must exclude the callout, permanent polling, automatic hiding, and open-state reset');
  }
  if (/safeCandidate[\s\S]*?else\s+setSummaryCopyAvoidance\(0,\s*0\)/.test(avoidanceScope)) {
    fail('failed avoidance must not return the avatar to a known collision point');
  }
  if (!/function scheduleSummaryCopyAvoidance\(\)\s*\{\s*if \(summaryCopyViewportMoving\) return;/.test(avoidanceScope)) {
    fail('mobile viewport motion must gate per-frame avoidance writes until scrolling settles');
  }
  if (avoidanceScope.includes('phoneAssistantSafeRailQuery')) {
    fail('phone layouts must use collision avoidance instead of shrinking the summary card content area');
  }
  for (const motionBinding of [
    "window.addEventListener('scroll', scheduleSummaryCopyAvoidanceAfterViewportMotion",
    "window.addEventListener('resize', scheduleSummaryCopyAvoidanceAfterViewportMotion)",
    "window.visualViewport.addEventListener('resize', scheduleSummaryCopyAvoidanceAfterViewportMotion)",
    "window.visualViewport.addEventListener('scroll', scheduleSummaryCopyAvoidanceAfterViewportMotion)"
  ]) {
    if (!avoidanceScope.includes(motionBinding)) fail(`missing debounced viewport-motion binding: ${motionBinding}`);
  }
}
if (!/translate\s*:\s*var\(--assistant-avoid-x,\s*0px\)\s+var\(--assistant-avoid-y,\s*0px\)/.test(residentBlock)) {
  fail('assistant avatar group must use layout-safe translate variables for avoidance');
}
if (!/will-change\s*:\s*translate/.test(residentBlock)) {
  fail('assistant avatar movement must stay on a compositor-friendly translate layer');
}
if (script.includes("resident.setAttribute('aria-hidden'")) {
  fail('runtime collision handling must never aria-hide the assistant avatar');
}
if (!html.includes('assistant-glyph-avoidance-1')) {
  fail('assistant glyph-avoidance cache token is missing');
}
if ((html.match(/assistant-scroll-stability-1/g) || []).length !== 3) {
  fail('assistant scroll-stability cache token must cover both stylesheets and the script');
}
if ((html.match(/hero-summary-mobile-fill-1/g) || []).length !== 3) {
  fail('mobile summary fill cache token must cover both stylesheets and the script');
}

if (!tablet) fail('missing max-width: 74.99rem assistant breakpoint');
if (!phone) fail('missing max-width: 35rem assistant breakpoint');
if (guardStart === -1) fail('missing final mobile visibility guard');

for (const [name, scope] of [['tablet', tablet], ['phone', phone], ['guard', guardScope]]) {
  const blocks = ruleBlocks(scope, '.assistant-callout');
  if (!blocks.length) fail(`${name} scope has no .assistant-callout rule`);
  if (blocks.some(hasDisplayNone)) fail(`${name} scope hides .assistant-callout with display: none`);
}

if (!ruleBlocks(phone, '.assistant-callout').some(hasDisplayBlock)) {
  fail('phone breakpoint does not explicitly display .assistant-callout');
}

if (!ruleBlocks(guardScope, '.site-assistant:not(.is-open):not(.is-hidden) .assistant-callout').some(hasDisplayBlock)) {
  fail('final guard does not explicitly display the resident callout');
}

if (!/animation\s*:\s*none\b/.test(guardScope) || !/opacity\s*:\s*1\b/.test(guardScope)) {
  fail('final guard must keep the callout visible between animation frames');
}

if (!stylesheetVersions.length) {
  fail('index.html does not reference style.css with a cache-busting query');
} else if (new Set(stylesheetVersions).size !== 1) {
  fail(`index.html has mismatched style.css cache-busting queries: ${stylesheetVersions.join(', ')}`);
} else if (!stylesheetVersions[0].includes('assistant-callout')) {
  fail(`style.css cache-busting query is not tied to this fix: ${stylesheetVersions[0]}`);
}

if (scriptVersions.length !== 1 || !scriptVersions[0].includes('assistant-glyph-avoidance-1')) {
  fail('script.js cache-busting query must identify the assistant glyph-avoidance revision');
}

if (process.exitCode) process.exit(process.exitCode);

console.log('Assistant callout pass-through, original sizing, and glyph-avoidance regression check passed.');
