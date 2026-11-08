'use strict';
const fs = require('fs');
const pages = ['index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas', 'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis'];
for (const p of pages) {
  const file = p + '.html';
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/<footer[\s\S]*?<\/footer>/i);
  if (!match) {
    console.log(file, 'NO FOOTER');
    continue;
  }
  const s = match[0];
  const classes = Array.from(s.matchAll(/class="([^"]+)"/g)).slice(0, 14).map(function (m) { return m[1]; }).join(' | ');
  console.log(file, 'len=' + s.length);
  console.log('  start=' + s.slice(0, 220).replace(/\s+/g, ' '));
  console.log('  classes=' + classes);
}
