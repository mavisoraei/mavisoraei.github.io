'use strict';
const fs = require('fs');
const SRC = 'https://www.openstreetmap.org/export/embed.html?bbox=28.9837%2C41.0446%2C29.0037%2C41.0526&layer=mapnik&marker=41.0486%2C28.9937';
const FRAME = `<iframe class="hl-map-frame" src="${SRC}" title="Map of Lemon Aesthetic Clinic in Nisantasi, Istanbul" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
for (const file of ['index.html', 'contact.html']) {
  let s = fs.readFileSync(file, 'utf8');
  let n = 0;
  s = s.replace(/(<div class="hl-map hl-map--placeholder[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/g, (m, open, body, close) => {
    if (/hl-map-frame/.test(body)) return m;
    n++;
    return open + body + FRAME + close;
  });
  fs.writeFileSync(file, s);
  console.log(file, 'iframes added', n, 'count', (s.match(/hl-map-frame/g) || []).length);
}
