const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const listenerMatch = script.match(
  /document\.addEventListener\('click', function \(event\) \{([\s\S]*?)\n  \}\);\n\n  document\.addEventListener\('keydown'/
);

assert(listenerMatch, 'Assistant must register a document click handler before the Escape handler');

const listener = listenerMatch[1];
assert(
  listener.includes("if (!root.classList.contains('is-open')) return;"),
  'Outside clicks must only be handled while the assistant is open'
);
assert(
  listener.includes('panel.contains(target)'),
  'Clicks inside the assistant panel must not dismiss it'
);
assert(
  listener.includes('toggleBtn.contains(target)'),
  'The assistant launcher must keep its existing toggle behavior'
);
assert(
  listener.includes('openBtns.some'),
  'Assistant open buttons must not immediately trigger outside-click dismissal'
);
assert(
  listener.includes('setOpen(false);'),
  'A valid outside click must close the assistant'
);
assert(
  /saveBtn\.addEventListener\('click', function \(event\) \{[\s\S]*?event\.stopPropagation\(\);/.test(script),
  'Saving an inline edit must not bubble into the outside-click dismiss handler'
);
assert(
  /cancelBtn\.addEventListener\('click', function \(event\) \{[\s\S]*?event\.stopPropagation\(\);/.test(script),
  'Cancelling an inline edit must not bubble into the outside-click dismiss handler'
);
assert(
  listener.includes('event.composedPath()') && listener.includes('eventPath.includes(panel)'),
  'Outside-click handling must remain safe when an edit action re-renders and detaches its target'
);
assert(
  html.includes('assistant-outside-dismiss-1'),
  'The assistant script cache token must include the outside-dismiss revision'
);

console.log('Assistant outside-click dismissal verification passed.');
