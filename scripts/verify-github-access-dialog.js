'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const triggerTags = Array.from(html.matchAll(/<a\b[^>]*\bdata-github-access-trigger\b[^>]*>/g), function (match) {
  return match[0];
});

assert.strictEqual(triggerTags.length, 3, 'Exactly three GitHub access prompts are required');
assert(
  triggerTags.some(function (tag) {
    return tag.includes('https://github.com/9-dream-come-true-9/boss-zhipin-desktop-skills');
  }),
  'The project GitHub trigger must keep the repository URL'
);
assert(
  triggerTags.some(function (tag) {
    return tag.includes('https://github.com/9-dream-come-true-9/wechat-local-reader');
  }),
  'The WeChat Local Reader GitHub trigger must keep the repository URL'
);
assert(
  triggerTags.some(function (tag) {
    return /href="https:\/\/github\.com\/9-dream-come-true-9"/.test(tag);
  }),
  'The contact GitHub trigger must keep the profile URL'
);

triggerTags.forEach(function (tag) {
  assert(tag.includes('target="_blank"'), 'GitHub triggers must keep their new-tab fallback');
  assert(tag.includes('rel="noopener noreferrer"'), 'GitHub triggers must keep safe external-link attributes');
  assert(tag.includes('aria-haspopup="dialog"'), 'GitHub triggers must expose dialog semantics');
  assert(tag.includes('aria-controls="github-access-dialog"'), 'GitHub triggers must point to the shared dialog');
});

const dialogMatch = html.match(/<dialog\b[^>]*\bid="github-access-dialog"[^>]*>[\s\S]*?<\/dialog>/);
assert(dialogMatch, 'Missing shared GitHub access dialog');
const dialog = dialogMatch[0];

assert(dialog.includes('温馨提示：需要翻墙才能流畅访问哦'), 'GitHub dialog must show the requested warning');
assert.strictEqual((html.match(/温馨提示：需要翻墙才能流畅访问哦/g) || []).length, 1, 'GitHub warning must have one source of truth');
assert(dialog.includes('data-github-access-cancel'), 'GitHub dialog must provide a cancel action');
assert(dialog.includes('data-github-access-confirm'), 'GitHub dialog must provide a continue action');
assert(dialog.includes('target="_blank"'), 'The continue link must open GitHub in a new tab');
assert(dialog.includes('rel="noopener noreferrer"'), 'The continue link must protect the opener context');
assert(html.includes('GitHub点击会跳转链接'), 'Contact guidance must use the updated GitHub link copy');

const initStart = script.indexOf('function initGithubAccessDialog()');
const initEnd = script.indexOf('function initPageExperience()', initStart);
assert(initStart !== -1 && initEnd > initStart, 'Missing GitHub access dialog initializer');
const initScope = script.slice(initStart, initEnd);

for (const marker of [
  "document.querySelectorAll('[data-github-access-trigger]')",
  "document.getElementById('github-access-dialog')",
  "trigger.getAttribute('href')",
  'event.preventDefault()',
  "confirmLink.setAttribute('href', destination)",
  'dialog.showModal()',
  'event.target === dialog',
  "dialog.addEventListener('cancel'",
  "dialog.addEventListener('keydown'",
  "dialog.addEventListener('close'",
  "activeTrigger.focus({ preventScroll: true })"
]) {
  assert(initScope.includes(marker), `Missing GitHub dialog behavior: ${marker}`);
}

assert(script.includes('initGithubAccessDialog();'), 'GitHub dialog initializer must run with the page experience');

for (const selector of [
  '.github-access-dialog {',
  '.github-access-dialog::backdrop {',
  '.github-access-surface {',
  '.github-access-actions {',
  '.github-access-cancel,',
  '.github-access-confirm {'
]) {
  assert(css.includes(selector), `Missing GitHub dialog style: ${selector}`);
}

assert.strictEqual(
  (html.match(/style\.css\?v=[^"\s]*github-access-dialog-1/g) || []).length,
  2,
  'GitHub dialog stylesheet cache token must cover normal and noscript links'
);
assert(
  /script\.js\?v=[^"\s]*github-access-dialog-1/.test(html),
  'GitHub dialog script cache token must be present'
);

console.log('GitHub project and contact access dialog verification passed.');
