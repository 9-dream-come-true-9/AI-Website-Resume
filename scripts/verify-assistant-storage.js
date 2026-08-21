const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert(
  /function readStorage\(store, key, fallback\)[\s\S]*?store\.getItem\(key\)[\s\S]*?catch \(error\)[\s\S]*?return fallback;/.test(script),
  'Storage reads must fail closed without interrupting the assistant'
);
assert(
  /function writeStorage\(store, key, value\)[\s\S]*?store\.setItem\(key, value\)[\s\S]*?catch \(error\)[\s\S]*?return false;/.test(script),
  'Storage writes must be best effort and never throw into the chat flow'
);
assert(
  /function removeStorage\(store, key\)[\s\S]*?store\.removeItem\(key\)[\s\S]*?catch \(error\)[\s\S]*?return false;/.test(script),
  'Storage removal must be best effort and never throw into the chat flow'
);
assert(
  /const parsed = JSON\.parse\(readStorage\(sessionStore, storageKey, '\[\]'\)\);/.test(script),
  'History loading must use the safe storage reader'
);
assert(
  /writeStorage\(sessionStore, storageKey, JSON\.stringify\(compact\)\);/.test(script),
  'History saving must use the safe storage writer'
);
assert(
  /setHidden\(readStorage\(localStore, hiddenStorageKey, 'false'\) === 'true'/.test(script),
  'Hidden-state initialization must use the safe storage reader'
);

console.log('Assistant storage failure-isolation verification passed.');
