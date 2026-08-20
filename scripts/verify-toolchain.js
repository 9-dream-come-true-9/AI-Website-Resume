const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const iconPath = path.join(root, 'assets', 'toolchain-icons', 'deepseek-harness.svg');

const toolchainStart = html.indexOf('<section id="toolchain"');
const toolchainEnd = html.indexOf('<section id="capabilities"', toolchainStart);
assert(toolchainStart >= 0 && toolchainEnd > toolchainStart, 'Toolchain section is missing or not bounded');
const toolchain = html.slice(toolchainStart, toolchainEnd);

assert(toolchain.includes('DeepSeek Harness'), 'DeepSeek Harness label is missing from the scrolling toolchain');
assert(toolchain.includes('assets/toolchain-icons/deepseek-harness.svg'), 'DeepSeek Harness icon is missing from the scrolling toolchain');
assert.strictEqual((toolchain.match(/<strong>DeepSeek Harness<\/strong>/g) || []).length, 1, 'DeepSeek Harness must appear exactly once in the source group');
assert(fs.existsSync(iconPath), 'DeepSeek Harness local icon asset is missing');
assert(/aria-label="技能工具：[^\"]*DeepSeek Harness/.test(toolchain), 'Toolchain accessibility label must include DeepSeek Harness');

assert(html.includes('GitHub点击会跳转链接'), 'Get in touch GitHub copy was not updated');

console.log('Toolchain DeepSeek Harness and GitHub contact copy verification passed.');
