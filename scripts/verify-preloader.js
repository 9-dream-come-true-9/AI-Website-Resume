const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const preloader = fs.readFileSync(path.join(root, 'preloader.js'), 'utf8');

assert(html.includes('id="site-preloader"'), 'The site preloader markup must remain present');
assert(html.includes('preloader.js?v=preloader-5s-2'), 'Preloader cache token must invalidate the restart fix');
assert(html.includes('/* preloader.js starts the single five-second clock after parsing;'), 'The preloader timing ownership must stay documented');
assert(html.includes('animation: none;'), 'Critical CSS must not start a second progress animation during parsing');
assert(preloader.includes('const fixedDuration = 5000;'), 'The preloader must keep its five-second duration');
assert(preloader.includes("'sitePreloaderProgress ' + fixedDuration + 'ms linear forwards'"), 'JavaScript must own the single progress animation clock');

console.log('Preloader single-clock and five-second duration checks passed.');
