'use strict';
const fs = require('fs');

const PAGES = ['index.html', 'laser.html', 'facial.html', 'services.html', 'doctors.html', 'blog.html', 'areas.html', 'gallery.html', 'gallery_new.html', 'prices.html', 'contact.html', 'ai-analysis.html', 'face-analysis.html'];
const SELF_JSONLD = {
  'blog.html': 'blog.html',
  'gallery.html': 'gallery.html',
  'gallery_new.html': 'gallery_new.html',
  'face-analysis.html': 'face-analysis.html'
};
const PRICE_TYPES = new Set(['Offer', 'AggregateOffer', 'OfferCatalog']);

function readDoc(file) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  return { text: text.replace(/\r\n/g, '\n'), bom: bom, eol: eol };
}
function writeDoc(file, doc) {
  let text = doc.text;
  if (doc.eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (doc.bom ? '\uFEFF' : '') + text, 'utf8');
}
function strip(node) {
  if (Array.isArray(node)) {
    return node.map(strip).filter(function (v) {
      return !(v && typeof v === 'object' && !Array.isArray(v) && PRICE_TYPES.has(v['@type']));
    });
  }
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const key of Object.keys(node)) {
    if (key === 'offers' || key === 'hasOfferCatalog' || key === 'priceSpecification') continue;
    out[key] = strip(node[key]);
  }
  return out;
}

for (const file of PAGES) {
  const doc = readDoc(file);
  let count = 0;
  doc.text = doc.text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, function (full, json) {
    try {
      let data = strip(JSON.parse(json));
      let text = JSON.stringify(data);
      if (SELF_JSONLD[file]) {
        text = text.split('https://lemonclinic.org/index.html').join('https://lemonclinic.org/' + SELF_JSONLD[file]);
      }
      count += 1;
      return '<script type="application/ld+json">' + text + '</script>';
    } catch (err) {
      console.error('JSON-LD finalize failed in ' + file + ': ' + err.message);
      return full;
    }
  });
  if (/<meta name="robots"[^>]*>/i.test(doc.text)) {
    doc.text = doc.text.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow">');
  } else {
    doc.text = doc.text.replace(/<\/head>/i, '<meta name="robots" content="noindex, nofollow"></head>');
  }
  if (file === 'areas.html') {
    doc.text = doc.text.replace(/sample prices booking information/g, 'sample prices and booking information');
  }
  writeDoc(file, doc);
  console.log('finalized', file, count);
}
