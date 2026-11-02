'use strict';
const fs = require('fs');
const files = ['prices.html', 'laser.html', 'facial.html', 'blog.html', 'areas.html'];
const map = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /\b\d{1,3}(?:,\d{3})+\b/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = parseInt(m[0].replace(/,/g, ''), 10);
    if (!map.has(raw)) map.set(raw, { raw: raw, count: 0, examples: [] });
    const item = map.get(raw);
    item.count += 1;
    if (item.examples.length < 3) item.examples.push(text.slice(Math.max(0, m.index - 70), m.index + 30).replace(/\s+/g, ' ').trim());
  }
}
const rows = Array.from(map.values()).sort(function (a, b) { return a.raw - b.raw; });
for (const r of rows) console.log(r.raw + '\t' + r.count + '\t' + r.examples[0]);
console.log('unique', rows.length);
