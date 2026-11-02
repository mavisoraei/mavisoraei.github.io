'use strict';
const fs = require('fs');

const CONFIG = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const PAGES = ['index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas', 'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis'].map(function (p) { return p + '.html'; });

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

const INTERNAL_PAGES = [
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%84%D8%A7%D8%BA%D8%B1%DB%8C', '/weight-loss.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%81%DB%8C%D9%84%D8%B1-%D8%A8%D8%AF%D9%86', '/body-fillers.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%81%DB%8C%D9%84%D8%B1', '/facial-fillers-2.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D8%A8%D9%88%D8%AA%D8%A7%DA%A9%D8%B3', '/botox.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%84%DB%8C%D8%B2%D8%B1-%D9%85%D9%88%D9%87%D8%A7%DB%8C-%D8%B2%D8%A7%D8%A6%D8%AF', '/laser.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%84%DB%8C%D9%81%D8%AA-%D8%B5%D9%88%D8%B1%D8%AA', '/face-lift-threads.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D8%AC%D9%88%D8%A7%D9%86%D8%B3%D8%A7%D8%B2%DB%8C', '/rejuvenation-mesogel.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D8%AF%D8%B1%D9%85%D8%A7%D9%86-%D9%BE%D9%88%D8%B3%D8%AA', '/skin-treatment.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%81%DB%8C%D8%B4%D8%A7%D9%84', '/facial.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D9%85%D8%B2%D9%88%D8%AA%D8%B1%D8%A7%D9%BE%DB%8C-%D9%85%D9%88', '/hair-mesotherapy.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/%D8%AC%D8%B1%D8%A7%D8%AD%DB%8C-%D8%B2%DB%8C%D8%A8%D8%A7%DB%8C%DB%8C', '/plastic-surgery.html'],
  ['%D8%AE%D8%AF%D9%85%D8%A7%D8%AA', '/services.html'],
  ['%D9%BE%D8%B2%D8%B4%DA%A9%D8%A7%D9%86', '/doctors.html'],
  ['%D8%AA%D9%85%D8%A7%D8%B3', '/contact.html'],
  ['%D9%82%DB%8C%D9%85%D8%AA', '/prices.html'],
  ['%D9%85%D9%82%D8%A7%D9%84%D8%A7%D8%AA', '/blog.html'],
  ['%D9%85%D9%86%D8%A7%D8%B7%D9%82', '/areas.html']
];

function cleanString(value) {
  if (typeof value !== 'string') return value;
  let s = value;
  const pairs = [
    ['outside Iran', 'outside Turkiye'],
    ['Iran University of Medical Sciences', 'Istanbul University of Medical Sciences'],
    ['Tehran City Medical Practice License', 'Istanbul City Medical Practice License'],
    ['West Tehran', 'Nisantasi'],
    ['District 22', 'Nisantasi'],
    ['Chitgar Lake and Park and Iran Mall', 'the city centre and public transport'],
    ['Chitgar Lake and Park', 'the city centre'],
    ['Chitgar Lake', 'the city centre'],
    ['Iran Mall', 'the city centre'],
    ['Parseh Business Complex', 'Example Business Centre'],
    ['Parseh Commercial Complex', 'Example Business Centre'],
    ['Kharazi Expressway', 'Example Street'],
    ['Kharazi Highway', 'Example Street'],
    ['Ardestani Boulevard', 'Nisantasi'],
    ['Ardastani Blvd', 'Nisantasi'],
    ['Ardestan Boulevard', 'Nisantasi'],
    ['Ardestani Blvd', 'Nisantasi'],
    ['Chitgar', 'Istanbul'],
    ['Tehran', 'Istanbul'],
    ['Parseh', 'Example'],
    ['Kharazi', 'Example'],
    ['Ardestani', 'Nisantasi'],
    ['Ardastani', 'Nisantasi'],
    ['Iranian', ''],
    ['Iran', 'Turkiye'],
    ['toman', 'USD'],
    ['Toman', 'USD'],
    ['Neshan', 'Google'],
    ['Balad', 'Google'],
    ['BeautyPay', 'Google'],
    ['Beautypay', 'Google'],
    ['DigiPay', 'card'],
    ['SnapPay', 'card'],
    ['DoctorPay', 'card'],
    ['Tara and Kipa', 'bank transfer'],
    ['interest-free installment payments through card, card, card, Google, bank transfer', 'cash, card and bank transfer'],
    ['interest-free installment payments', 'payment'],
    ['Installment payments for aesthetic services', 'Payment options'],
    ['Installment Payment', 'Payment'],
    ['installment payment', 'payment'],
    ['installment payments', 'payments'],
    ['price index', 'price list']
  ];
  for (const pair of pairs) s = s.split(pair[0]).join(pair[1]);
  s = s.replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/\(\s*\)/g, '').replace(/\s+,/g, ',').replace(/,\s*\./g, '.').trim();
  return s;
}

function cleanUrl(value) {
  if (typeof value !== 'string') return value;
  if (value.indexOf('lemonclinic.org') === -1) return value;
  if (value.indexOf('%') === -1 && !/tehran|iran|toman|chitgar|west-tehran|district-22/i.test(value)) return value;
  let target = '/index.html';
  for (const pair of INTERNAL_PAGES) {
    if (value.indexOf(pair[0]) !== -1) { target = pair[1]; break; }
  }
  if (/retatrutide|zicorpa|tirzepatide/i.test(value)) target = '/weight-loss.html';
  if (/spartina-price/i.test(value)) target = '/prices.html';
  return CONFIG.siteUrl + target;
}

function dedupe(list) {
  if (!Array.isArray(list)) return list;
  const seen = new Set();
  return list.filter(function (item) {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitize(node, key, parent) {
  if (Array.isArray(node)) {
    return dedupe(node.map(function (v) { return sanitize(v, key, parent); }));
  }
  if (!node || typeof node !== 'object') {
    if (typeof node === 'string') return cleanUrl(cleanString(node));
    return node;
  }

  const out = {};
  for (const k of Object.keys(node)) {
    if (k === 'identifier' && node[k] && node[k].name && /licen[cs]e/i.test(String(node[k].name))) continue;
    if (k === 'founder') continue;
    if (k === 'inLanguage') { out[k] = 'en-US'; continue; }
    if (k === 'addressCountry') { out[k] = 'TR'; continue; }
    if (k === 'telephone') { out[k] = CONFIG.phoneHref; continue; }
    if (k === 'priceCurrency') { out[k] = CONFIG.currency; continue; }
    if (k === 'paymentAccepted') { out[k] = 'Cash, card and bank transfer.'; continue; }
    if (k === 'knowsAbout') {
      out[k] = (Array.isArray(node[k]) ? node[k] : []).filter(function (v) { return !/installment|payment/i.test(String(v)); }).map(cleanString);
      continue;
    }
    if (k === 'sameAs') {
      out[k] = [CONFIG.social.instagram, CONFIG.mapsUrl, CONFIG.social.youtube].filter(Boolean);
      continue;
    }
    if (k === 'areaServed') {
      out[k] = [{ '@type': 'City', name: CONFIG.city }, { '@type': 'Place', name: CONFIG.district }];
      continue;
    }
    if (k === 'address' && node[k] && node[k]['@type'] === 'PostalAddress') {
      out[k] = { '@type': 'PostalAddress', streetAddress: CONFIG.address, addressLocality: CONFIG.city, addressRegion: CONFIG.city, postalCode: '34367', addressCountry: 'TR' };
      continue;
    }
    if (k === 'geo') {
      out[k] = { '@type': 'GeoCoordinates', latitude: 41.0602, longitude: 28.9877 };
      continue;
    }
    if (k === 'hasMap') { out[k] = CONFIG.mapsUrl; continue; }
    if (k === 'openingHoursSpecification') {
      out[k] = [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '19:00' }];
      continue;
    }
    if (k === 'reviewedBy' && node[k] && typeof node[k] === 'object') {
      out[k] = { '@type': 'Physician', name: 'Lemon Medical Team' };
      continue;
    }
    out[k] = sanitize(node[k], k, node);
  }

  if (out['@type'] === 'MedicalClinic') {
    out.name = CONFIG.legalName;
    out.url = CONFIG.siteUrl;
    out.priceRange = '$$';
  }
  if (out['@type'] === 'WebSite' && out.url && out.url.indexOf('lemonclinic.org') !== -1) out.url = CONFIG.siteUrl;
  return out;
}

for (const file of PAGES) {
  const doc = readDoc(file);
  let count = 0;
  doc.text = doc.text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, function (full, json) {
    try {
      const data = JSON.parse(json);
      const clean = sanitize(data, '', null);
      count += 1;
      return '<script type="application/ld+json">' + JSON.stringify(clean) + '</script>';
    } catch (err) {
      console.error('JSON-LD parse failed in ' + file + ': ' + err.message);
      return full;
    }
  });
  writeDoc(file, doc);
  console.log('jsonld', file, count);
}
