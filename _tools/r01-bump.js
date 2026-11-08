'use strict';
const fs = require('fs');
const pages = ['index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas', 'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis'];
const bumps = [
  ['assets/css/home-sections.css?v=1.0.7', 'assets/css/home-sections.css?v=1.0.8'],
  ['assets/css/inner-unify.css?v=1.2.2', 'assets/css/inner-unify.css?v=1.2.3']
];
let touched = 0;
for (const p of pages) {
  const f = p + '.html';
  const buf = fs.readFileSync(f);
  let s = buf.toString('utf8');
  let changed = false;
  for (const [a, b] of bumps) {
    if (s.includes(a)) { s = s.split(a).join(b); changed = true; }
  }
  if (changed) { fs.writeFileSync(f, Buffer.from(s, 'utf8')); touched++; console.log('bumped ' + f); }
}
console.log('files: ' + touched);
