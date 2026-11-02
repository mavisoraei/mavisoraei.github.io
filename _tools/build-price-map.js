'use strict';
const fs = require('fs');
const { execSync } = require('child_process');

const CONFIG = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const PAGES = ['prices.html', 'laser.html', 'facial.html', 'blog.html', 'areas.html'];
const map = new Map();
const pageCounts = {};

function sample(raw) {
  if (raw < 100000) return raw;
  return Math.max(5, Math.round(raw / 10000 / 5) * 5);
}
function add(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 100000) return n;
  if (!map.has(n)) map.set(n, sample(n));
  return map.get(n);
}
function fmt(n) { return '$' + Number(n).toLocaleString('en-US'); }

function collectText(text, file) {
  let count = 0;
  const protectedDoc = (function (value) {
    const store = [];
    const put = function (v) { const token = '\u0000P' + store.length + '\u0000'; store.push(v); return token; };
    value = value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, put);
    value = value.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, put);
    value = value.replace(/\sstyle="[^"]*"/gi, put);
    return { text: value, store: store };
  })(text);
  const parts = protectedDoc.text.split(/(<[^>]*>)/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i].replace(/(?<!\$)\b\d{1,3}(?:,\d{3})+\b/g, function (m) {
      count += 1;
      add(parseInt(m.replace(/,/g, ''), 10));
      return m;
    });
  }
  pageCounts[file] = count;
}

function walkJson(node) {
  if (Array.isArray(node)) { node.forEach(walkJson); return; }
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key === 'lowPrice' || key === 'highPrice' || key === 'price') add(Number(node[key]));
    if (typeof node[key] === 'string') {
      node[key].replace(/(?<!\$)\b\d{1,3}(?:,\d{3})+\b/g, function (m) {
        add(parseInt(m.replace(/,/g, ''), 10));
        return m;
      });
    }
    walkJson(node[key]);
  }
}

for (const file of PAGES) {
  const text = execSync('git show HEAD:' + file, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  collectText(text, file);
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(text))) {
    try { walkJson(JSON.parse(m[1])); } catch (e) { /* ignore */ }
  }
}

const rows = Array.from(map.entries()).sort(function (a, b) { return a[0] - b[0]; }).map(function (e) {
  return { sourceAmount: e[0], samplePrice: e[1], sourceLabel: e[0].toLocaleString('en-US'), sampleLabel: '$' + e[1].toLocaleString('en-US') };
});
const data = {
  currency: CONFIG.currency,
  currencySymbol: CONFIG.currencySymbol,
  note: 'Sample prices for demonstration only. Final pricing is confirmed at consultation.',
  generated: '2026-10-29',
  rates: rows
};
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/sample-prices.json', JSON.stringify(data, null, 2) + '\n', 'utf8');

const total = Object.keys(pageCounts).reduce(function (n, k) { return n + pageCounts[k]; }, 0);
const report = [];
report.push('# Localization price map');
report.push('');
report.push('Generated for T30b. These are explicit sample USD amounts, not a currency conversion. The relative order of the original amounts is preserved.');
report.push('');
report.push('- Source pages: ' + PAGES.join(', '));
report.push('- Unique amounts mapped: ' + rows.length);
report.push('- Original visible price occurrences: ' + total);
report.push('- Currency: ' + CONFIG.currency);
report.push('');
report.push('| Original amount | Sample USD |');
report.push('| ---: | ---: |');
rows.forEach(function (r) { report.push('| ' + r.sourceLabel + ' | ' + r.sampleLabel + ' |'); });
report.push('');
report.push('## Original occurrences by page');
report.push('');
Object.keys(pageCounts).sort().forEach(function (p) { report.push('- ' + p + ': ' + pageCounts[p]); });
report.push('');
report.push('## Notes');
report.push('');
report.push('- `prices.html` JSON-LD `AggregateOffer` values were mapped with the same table and `priceCurrency` was set to USD.');
report.push('- Price table headers were changed to `Price (USD)`.');
report.push('- `areas.html` uses the neutral clinic visit layout; its sample table was included in the mapping.');
report.push('- Inline CSS colours and script blocks were protected from number replacement.');
fs.mkdirSync('_tools/reports', { recursive: true });
fs.writeFileSync('_tools/reports/localization-map.md', report.join('\n') + '\n', 'utf8');
console.log('mapped', rows.length, 'amounts; original visible occurrences', total);
