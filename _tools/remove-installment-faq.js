'use strict';
const fs = require('fs');
const file = 'prices.html';
let text = fs.readFileSync(file, 'utf8');
const bom = text.charCodeAt(0) === 0xFEFF;
if (bom) text = text.slice(1);
const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
text = text.replace(/\r\n/g, '\n');
function clean(node) {
  if (Array.isArray(node)) {
    return node
      .filter(function (item) {
        return !(item && typeof item === 'object' && item['@type'] === 'Question' && /installment/i.test(String(item.name || '')));
      })
      .map(clean);
  }
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const key of Object.keys(node)) out[key] = clean(node[key]);
  return out;
}
text = text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, function (full, json) {
  try {
    return '<script type="application/ld+json">' + JSON.stringify(clean(JSON.parse(json))) + '</script>';
  } catch (err) {
    console.error('parse failed: ' + err.message);
    return full;
  }
});
if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
fs.writeFileSync(file, (bom ? '\uFEFF' : '') + text, 'utf8');
console.log('removed installment FAQ from prices.jsonld');
