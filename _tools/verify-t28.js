'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const old = execFileSync('git', ['show', 'HEAD:prices.html'], { encoding: 'utf8' });
const now = fs.readFileSync('prices.html', 'utf8');

function prices(html) {
  return (html.match(/\$[\d,]+/g) || []).slice().sort();
}
function hrefs(html) {
  return Array.from(html.matchAll(/\bhref="([^"]+)"/g)).map(function (m) { return m[1]; });
}
function rows(html) {
  const out = [];
  const lists = html.match(/<ul class="(?:pr-rows|pr-list)"[^>]*>[\s\S]*?<\/ul>/g) || [];
  lists.forEach(function (list) {
    for (const m of list.matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text) out.push(text);
    }
  });
  return out;
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

const oldPrices = prices(old);
const newPrices = prices(now);
const oldHrefs = hrefs(old);
const newHrefs = hrefs(now);
const oldExternal = Array.from(new Set(oldHrefs.filter(function (h) { return h.charAt(0) !== '#' && h.indexOf('inner-unify.css') === -1; }))).sort();
const newExternal = Array.from(new Set(newHrefs.filter(function (h) { return h.charAt(0) !== '#' && h.indexOf('inner-unify.css') === -1; }))).sort();
const missingExternal = oldExternal.filter(function (h) { return newExternal.indexOf(h) === -1; });
const addedExternal = newExternal.filter(function (h) { return oldExternal.indexOf(h) === -1; });
const oldRows = rows(old);
const newRows = rows(now);
const missingRows = oldRows.filter(function (r) { return newRows.indexOf(r) === -1; });

function ids(html) {
  return Array.from(new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g)).map(function (m) { return m[1]; }))).sort();
}
const oldIds = ids(old);
const newIds = ids(now);
const missingIds = oldIds.filter(function (id) { return newIds.indexOf(id) === -1; });

console.log('ids old=' + oldIds.length + ' new=' + newIds.length + ' missing=' + JSON.stringify(missingIds));
console.log('prices old=' + oldPrices.length + ' new=' + newPrices.length + ' equal=' + eq(oldPrices, newPrices));
console.log('external old=' + oldExternal.length + ' new=' + newExternal.length + ' missing=' + JSON.stringify(missingExternal) + ' added=' + JSON.stringify(addedExternal));
console.log('rows old=' + oldRows.length + ' new=' + newRows.length + ' missing=' + missingRows.length);
if (missingRows.length) console.log('missing rows: ' + JSON.stringify(missingRows));
console.log('old-hero-note=' + old.includes('price-note') + ' new-hero-note=' + now.includes('price-note'));
console.log('old-index-link=' + old.includes('pr-index-link') + ' new-index-link=' + now.includes('pr-index-link'));
console.log('glass-cards=' + (now.match(/pr-block glass-card glass-card--panel/g) || []).length);
console.log('chips=' + (now.match(/data-short=/g) || []).length);
console.log('benefits=' + (now.match(/class="glass-card pr-benefit"/g) || []).length);
console.log('aside=' + now.includes('pr-side'));
console.log('cta-links=' + /pr-note__actions[\s\S]*?\/contact\.html[\s\S]*?\/face-analysis\.html/.test(now));

if (!eq(oldPrices, newPrices) || missingExternal.length || missingRows.length || missingIds.length) process.exit(1);
