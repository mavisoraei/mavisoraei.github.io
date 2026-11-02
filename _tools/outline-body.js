'use strict';
const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.error('usage: node _tools/outline-body.js <file>');
  process.exit(1);
}
const text = fs.readFileSync(file, 'utf8');
const bodyStart = text.indexOf('<article class="svc-body">');
if (bodyStart === -1) {
  console.error('no svc-body');
  process.exit(1);
}
const divStart = text.indexOf('<div>', bodyStart);
const divOpenEnd = divStart + 5;
const articleEnd = text.indexOf('</article>', bodyStart);
const divEnd = text.lastIndexOf('</div>', articleEnd);
const inner = text.slice(divOpenEnd, divEnd);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const tagRe = /<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g;
let depth = 0;
let m;
let index = 0;
while ((m = tagRe.exec(inner))) {
  const closing = m[1] === '/';
  const name = m[2].toLowerCase();
  if (!closing && (name === 'script' || name === 'style')) {
    const end = inner.toLowerCase().indexOf('</' + name + '>', tagRe.lastIndex);
    if (end !== -1) tagRe.lastIndex = end + name.length + 3;
    continue;
  }
  if (closing) {
    depth = Math.max(0, depth - 1);
    continue;
  }
  if (VOID.has(name)) continue;
  if (depth === 0) {
    const attrs = m[3].replace(/\s+/g, ' ').trim();
    const after = inner.slice(tagRe.lastIndex, tagRe.lastIndex + 180).replace(/\s+/g, ' ');
    console.log('\n[' + index + '] <' + name + (attrs ? ' ' + attrs : '') + '>');
    console.log('    ' + after);
    index += 1;
  }
  depth += 1;
}
