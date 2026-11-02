'use strict';
const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.error('usage: node _tools/outline-main.js <file>');
  process.exit(1);
}
const text = fs.readFileSync(file, 'utf8');
const mainStart = text.search(/<main\b/i);
const mainOpenEnd = text.indexOf('>', mainStart) + 1;
const mainEnd = text.search(/<\/main>/i);
const main = text.slice(mainOpenEnd, mainEnd);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const tagRe = /<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g;
let depth = 0;
let m;
let childIndex = 0;
while ((m = tagRe.exec(main))) {
  const closing = m[1] === '/';
  const name = m[2].toLowerCase();
  if (!closing && (name === 'script' || name === 'style')) {
    const end = main.toLowerCase().indexOf('</' + name + '>', tagRe.lastIndex);
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
    const after = main.slice(tagRe.lastIndex, tagRe.lastIndex + 220).replace(/\s+/g, ' ');
    console.log('\n[' + childIndex + '] <' + name + (attrs ? ' ' + attrs : '') + '>');
    console.log('    ' + after);
    childIndex += 1;
  }
  depth += 1;
}
