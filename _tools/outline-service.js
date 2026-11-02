'use strict';
const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.error('usage: node _tools/outline-service.js <file>');
  process.exit(1);
}
const text = fs.readFileSync(file, 'utf8');
const mainStart = text.indexOf('<main');
const mainEnd = text.indexOf('</main>');
const main = text.slice(mainStart, mainEnd + 7);
console.log('main chars:', main.length);
const re = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;
let m;
while ((m = re.exec(main))) {
  const before = main.slice(Math.max(0, m.index - 180), m.index).replace(/\s+/g, ' ');
  const textOnly = m[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  console.log('\nH' + m[1] + ' @' + m.index + ' ' + textOnly);
  console.log('  before: ' + before);
  console.log('  attrs: ' + m[2].trim());
}
