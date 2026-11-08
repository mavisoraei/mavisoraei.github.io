'use strict';
// Usage: node _tools/bump-cache.js <css-file-name> <old-version> <new-version> [...more triples]
// Updates every root *.html that references the file with the given ?v= query.
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
if (args.length % 3 !== 0) { console.error('need triples'); process.exit(1); }
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let touched = 0;
for (const f of pages) {
  const buf = fs.readFileSync(f);
  let s = buf.toString('utf8');
  const before = s;
  for (let i = 0; i < args.length; i += 3) {
    const [file, oldV, newV] = [args[i], args[i + 1], args[i + 2]];
    s = s.split(file + '?v=' + oldV).join(file + '?v=' + newV);
  }
  if (s !== before) { fs.writeFileSync(f, Buffer.from(s, 'utf8')); touched++; }
}
console.log('bumped files: ' + touched);
