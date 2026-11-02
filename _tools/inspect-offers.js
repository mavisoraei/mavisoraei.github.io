'use strict';
const fs = require('fs');
const files = ['prices.html', 'laser.html', 'facial.html', 'blog.html', 'areas.html'];
function walk(node, path, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(function (v, i) { walk(v, path + '[' + i + ']', out); }); return; }
  if (node.price !== undefined || node.lowPrice !== undefined || node.highPrice !== undefined || node.priceCurrency !== undefined) {
    out.push({ path: path, type: node['@type'], price: node.price, lowPrice: node.lowPrice, highPrice: node.highPrice, priceCurrency: node.priceCurrency, name: node.name });
  }
  for (const k of Object.keys(node)) walk(node[k], path + '.' + k, out);
}
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    i++;
    try {
      const data = JSON.parse(m[1]);
      const out = [];
      walk(data, file + '#' + i, out);
      out.forEach(function (o) { console.log(JSON.stringify(o)); });
    } catch (e) { console.log('ERR', file, i, e.message); }
  }
}
