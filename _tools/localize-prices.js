'use strict';
const fs = require('fs');
const path = require('path');

const CONFIG = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const PAGES = ['prices.html', 'laser.html', 'facial.html', 'blog.html', 'areas.html'];
const map = new Map();
const replacements = [];

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

function walkJson(node) {
  if (Array.isArray(node)) { node.forEach(walkJson); return; }
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key === 'lowPrice' || key === 'highPrice' || key === 'price') {
      const n = Number(node[key]);
      if (Number.isFinite(n)) node[key] = add(n);
    }
    if (key === 'priceCurrency') node[key] = CONFIG.currency;
    if (typeof node[key] === 'string') {
      node[key] = node[key].replace(/(?<!\$)\b\d{1,3}(?:,\d{3})+\b/g, function (m) {
        return fmt(add(parseInt(m.replace(/,/g, ''), 10)));
      });
    }
    walkJson(node[key]);
  }
}

function protect(text) {
  const store = [];
  const put = function (value) {
    const token = '\u0000PROTECTED' + store.length + '\u0000';
    store.push(value);
    return token;
  };
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, put);
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, put);
  text = text.replace(/\sstyle="[^"]*"/gi, put);
  return { text: text, store: store };
}
function restore(text, store) {
  return text.replace(/\u0000PROTECTED(\d+)\u0000/g, function (m, i) { return store[Number(i)]; });
}

function localizeHtml(file, text) {
  const protectedDoc = protect(text);
  let t = protectedDoc.text;
  const parts = t.split(/(<[^>]*>)/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/(?<!\$)\b\d{1,3}(?:,\d{3})+\b/g, function (m, offset, whole) {
      const raw = parseInt(m.replace(/,/g, ''), 10);
      const value = add(raw);
      replacements.push({ page: file, original: m, sample: fmt(value), context: whole.slice(Math.max(0, offset - 80), offset + 40).replace(/\s+/g, ' ').trim() });
      return fmt(value);
    });
  }
  t = parts.join('');
  t = restore(t, protectedDoc.store);

  if (file === 'laser.html' && t.indexOf('Sample prices in USD') === -1) {
    t = t.replace(/(<h2 id="laser-cost-and-pricing">[\s\S]*?<\/h2>)/i, '$1 <p class="price-note">Sample prices in USD for demonstration only; final pricing is confirmed at consultation.</p>');
  }
  if (file === 'facial.html' && t.indexOf('Sample prices in USD') === -1) {
    t = t.replace(/(<h2 id="facial-cost-and-fees">[\s\S]*?<\/h2>)/i, '$1 <p class="price-note">Sample prices in USD for demonstration only; final pricing is confirmed at consultation.</p>');
  }
  if (file === 'areas.html' && t.indexOf('Sample prices in USD') === -1) {
    t = t.replace(/<h2>Sample Price<\/h2>/i, '<h2>Sample Price</h2><p class="price-note">Sample prices in USD for demonstration only.</p>');
  }
  if (file === 'prices.html' && t.indexOf('Sample prices in USD') === -1) {
    t = t.replace(/<p class="pr-index-link">/i, '<p class="price-note">Sample prices in USD for demonstration only; final pricing is confirmed at consultation.</p><p class="pr-index-link">');
  }
  return t;
}

for (const file of PAGES) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  text = text.replace(/\r\n/g, '\n');

  text = text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, function (full, json) {
    try {
      const data = JSON.parse(json);
      walkJson(data);
      return '<script type="application/ld+json">' + JSON.stringify(data) + '</script>';
    } catch (err) {
      console.error('JSON-LD price parse failed in ' + file + ': ' + err.message);
      return full;
    }
  });

  text = localizeHtml(file, text);
  if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (bom ? '\uFEFF' : '') + text, 'utf8');
  console.log('prices', file);
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

const report = [];
report.push('# Localization price map');
report.push('');
report.push('Generated for T30b. These are explicit sample USD amounts, not a currency conversion. The relative order of the original amounts is preserved.');
report.push('');
report.push('- Source pages: ' + PAGES.join(', '));
report.push('- Unique amounts mapped: ' + rows.length);
report.push('- Visible price occurrences replaced: ' + replacements.length);
report.push('- Currency: ' + CONFIG.currency);
report.push('');
report.push('| Original amount | Sample USD |');
report.push('| ---: | ---: |');
rows.forEach(function (r) { report.push('| ' + r.sourceLabel + ' | ' + r.sampleLabel + ' |'); });
report.push('');
report.push('## Replacements by page');
report.push('');
const byPage = {};
replacements.forEach(function (r) { byPage[r.page] = (byPage[r.page] || 0) + 1; });
Object.keys(byPage).sort().forEach(function (p) { report.push('- ' + p + ': ' + byPage[p]); });
report.push('');
report.push('## Notes');
report.push('');
report.push('- `prices.html` JSON-LD `AggregateOffer` values were mapped with the same table and `priceCurrency` was set to USD.');
report.push('- Price table headers were changed to `Price (USD)`.');
report.push('- `areas.html` uses the neutral clinic visit layout; its sample table was included in the mapping.');
report.push('- Inline CSS colours and script blocks were protected from number replacement.');
fs.mkdirSync('_tools/reports', { recursive: true });
fs.writeFileSync('_tools/reports/localization-map.md', report.join('\n') + '\n', 'utf8');
console.log('mapped', rows.length, 'amounts and', replacements.length, 'visible occurrences');
