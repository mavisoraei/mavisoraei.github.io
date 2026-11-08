'use strict';
const fs = require('fs');
const pages = ['index','laser','facial','services','doctors','blog','areas','gallery','gallery_new','prices','contact','ai-analysis','face-analysis'];
const patterns = [
  { name: 'no-space-after-link', re: /<\/a>[A-Za-z0-9]/g },
  { name: 'see-it', re: /See it\./g },
  { name: 'club-beyond', re: /Customer Club<\/a>[^<]{0,60}/g },
  { name: 'link-then-upper', re: /<\/a>\s+[A-Z][a-z]/g }
];
for (const p of pages) {
  const t = fs.readFileSync(p + '.html', 'utf8');
  for (const { name, re } of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const start = Math.max(0, m.index - 90);
      const end = Math.min(t.length, m.index + m[0].length + 90);
      const ctx = t.slice(start, end).replace(/\s+/g, ' ');
      console.log(`${p}.html [${name}] @${m.index}: ...${ctx}...`);
    }
  }
}
