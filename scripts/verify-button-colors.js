const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const styles = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

function readCssBlock(selector) {
  const selectorText = `${selector} {`;
  let searchBefore = styles.length;
  while (searchBefore > 0) {
    const selectorStart = styles.lastIndexOf(selectorText, searchBefore);
    if (selectorStart < 0) break;
    const blockEndPattern = /\r?\n\}/g;
    blockEndPattern.lastIndex = selectorStart;
    const blockEndMatch = blockEndPattern.exec(styles);
    assert(blockEndMatch, `CSS block is incomplete: ${selector}`);
    const block = styles.slice(selectorStart, blockEndMatch.index);
    if (block.includes('background:')) return block;
    searchBefore = selectorStart - 1;
  }
  assert.fail(`Missing CSS block with background declaration: ${selector}`);
}

assert(styles.includes('--color-button-purple: #9a75ef;'), 'Light-theme button purple is missing');
assert(styles.includes('--color-button-purple-hover: #8b69e2;'), 'Light-theme button purple hover color is missing');
assert(styles.includes('--color-button-purple: #b197f2;'), 'Dark-theme button purple is missing');

for (const selector of [
  '.portfolio-note-confirm',
  '.hero-summary-chat',
  '.project-repo-link',
  '.github-access-confirm',
  '.experience-entry-action',
  '.assistant-send'
]) {
  const block = readCssBlock(selector);
  assert(block.includes('background: var(--color-button-purple);'), `${selector} must use the softened purple button color`);
}

for (const selector of ['.portfolio-note-confirm:hover', '.project-repo-link:hover', '.experience-entry-action:hover']) {
  const block = readCssBlock(selector);
  assert(block.includes('background: var(--color-button-purple-hover);'), `${selector} must use the softened purple hover color`);
}

assert(/\.circle-btn-icon\s*\{\s*background:\s*var\(--gradient-accent\);/.test(styles), 'Non-button purple icon styling should remain unchanged');
assert(styles.includes('.capability-num {'), 'Capability number badge must remain a non-button element');

console.log('Purple button color synchronization check passed.');
