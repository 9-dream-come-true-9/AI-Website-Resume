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
const baseCalloutBlock = ruleBlocks(css, '.assistant-callout')[0] || '';
const fixedAssistantBlock = ruleBlocks(css, '.site-assistant').find((block) => /position\s*:\s*fixed\b/.test(block)) || '';
const launcherBlock = ruleBlocks(css, '.assistant-launcher')[0] || '';

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

if (process.exitCode) process.exit(process.exitCode);

console.log('Assistant callout mobile regression check passed.');
