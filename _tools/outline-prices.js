'use strict';
const fs = require('fs');
const text = fs.readFileSync('prices.html', 'utf8');
const blockRe = /<section class="pr-block" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
let m;
let n = 0;
while ((m = blockRe.exec(text))) {
  const body = m[2];
  const h2 = body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const title = h2 ? h2[1].replace(/<[^>]+>/g, '').trim() : '';
  const rows = (body.match(/<li>/g) || []).length;
  console.log('[' + n + '] #' + m[1] + ' | ' + title + ' | rows=' + rows);
  n += 1;
}
console.log('blocks=' + n);
console.log('--- headings with ids ---');
const hRe = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g;
let h;
while ((h = hRe.exec(text))) {
  const id = h[2].match(/id="([^"]+)"/);
  if (!id) continue;
  console.log('h' + h[1] + ' #' + id[1] + ' ' + h[3].replace(/<[^>]+>/g, '').trim());
}
