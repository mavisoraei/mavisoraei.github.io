'use strict';

/*
 * sync-nav.js
 * Replaces the old `.site-header` navigation (+ its out-of-header mobile
 * drawer) on each inner page with the home page's `.lm-header` navigation
 * and `.mobile-drawer`, preserving each page's own link style (relative vs
 * absolute) and marking the current page in the menu the way Home is marked
 * on the home page.
 *
 * Usage:
 *   node _tools/sync-nav.js            # dry run (default)
 *   node _tools/sync-nav.js --write    # apply changes
 *
 * No dependencies. Source of truth is index.html; index.html is only read,
 * never written.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const WRITE = process.argv.includes('--write');
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

const PAGES_ALL = [
  'laser.html',
  'facial.html',
  'services.html',
  'prices.html',
  'doctors.html',
  'contact.html',
  'gallery.html',
  'gallery_new.html',
  'blog.html',
  'areas.html',
  'face-analysis.html',
];
const PAGES = ONLY.length ? PAGES_ALL.filter(p => ONLY.includes(p)) : PAGES_ALL;

// page -> top-level menu href to activate (absolute, as it appears in the
// home header template before link-style normalisation). Pages not listed
// (gallery, gallery_new, blog, areas) simply lose Home's active mark.
const MENU_HREF = {
  'laser.html': '/laser.html',
  'facial.html': '/facial.html',
  'doctors.html': '/doctors.html',
  'prices.html': '/prices.html',
  'face-analysis.html': '/face-analysis.html',
};

// page -> drawer <li> anchor label to activate
const DRAWER_ITEM = {
  'laser.html': ['/laser.html', 'Laser'],
  'facial.html': ['/facial.html', 'Facial'],
  'doctors.html': ['/doctors.html', 'Doctors'],
  'prices.html': ['/prices.html', 'Pricing'],
  'face-analysis.html': ['/face-analysis.html', 'Face Analysis'],
  'contact.html': ['/contact.html', 'Contact & Booking'],
};

function between(text, startAnchor, endAnchor, endLen) {
  const s = text.indexOf(startAnchor);
  if (s < 0) return null;
  const e = text.indexOf(endAnchor, s);
  if (e < 0) return null;
  return { start: s, end: e + endLen, block: text.slice(s, e + endLen) };
}

/* ---- 1. extract the home header + drawer ------------------------------- */

const indexHtml = fs.readFileSync(INDEX, 'utf8');

const homeHeader = between(indexHtml, '<header class="lm-header" id="site-header">', '</header>', 9);
const homeDrawer = between(indexHtml, '<div class="drawer-overlay"', '</aside>', 8);
if (!homeHeader) throw new Error('home header not found in index.html');
if (!homeDrawer) throw new Error('home drawer not found in index.html');

/* ---- 2. per-page helpers ---------------------------------------------- */

function detectPrefix(html, stripRanges) {
  let body = html;
  // remove header + drawer so only the page's own content is sampled
  for (const r of stripRanges) body = body.slice(0, r.start) + body.slice(r.end);
  const hrefs = [...body.matchAll(/href="([^"]+)"/g)]
    .map(m => m[1])
    .filter(h => h.endsWith('.html') && !/^(https?:|\/\/|mailto:|tel:|#)/.test(h));
  let abs = 0, dot = 0, plain = 0;
  for (const h of hrefs) {
    if (h.startsWith('/')) abs++;
    else if (h.startsWith('./')) dot++;
    else plain++;
  }
  let prefix = '';
  if (dot >= abs && dot >= plain) prefix = './';
  else if (abs >= dot && abs >= plain) prefix = '/';
  return { prefix, abs, dot, plain, total: hrefs.length };
}

function normalizeLinks(html, prefix) {
  return html.replace(/href="([^"]+\.html)"/g, (m, href) => {
    if (/^(https?:|\/\/|mailto:|tel:)/.test(href)) return m;
    const base = href.slice(href.lastIndexOf('/') + 1);
    return 'href="' + prefix + base + '"';
  });
}

function markHeader(html, page) {
  // drop Home's active mark (inner pages are never Home)
  html = html.split('<a href="/index.html" aria-current="page">Home</a>')
             .join('<a href="/index.html">Home</a>');

  const href = MENU_HREF[page];
  if (href) {
    html = html.replace(
      '<a href="' + href + '">',
      '<a href="' + href + '" class="active" aria-current="page">'
    );
  }
  if (page === 'services.html') {
    html = html.replace('<summary>Services', '<summary class="active" aria-current="page">Services');
  }
  if (page === 'contact.html') {
    html = html.replace(
      '<a class="lm-cta" href="/contact.html">',
      '<a class="lm-cta active" href="/contact.html" aria-current="page">'
    );
  }
  return html;
}

function markDrawer(html, page) {
  html = html.split('<li><a href="/index.html" aria-current="page">Home</a></li>')
             .join('<li><a href="/index.html">Home</a></li>');

  const item = DRAWER_ITEM[page];
  if (item) {
    const [href, label] = item;
    html = html.replace(
      '<li><a href="' + href + '">' + label + '</a></li>',
      '<li><a href="' + href + '" class="active" aria-current="page">' + label + '</a></li>'
    );
  }
  if (page === 'services.html') {
    html = html.replace('<p class="m-label">Services</p>', '<p class="m-label active" aria-current="page">Services</p>');
  }
  return html;
}

/* ---- 3. run ------------------------------------------------------------ */

let changed = 0;
const report = [];

for (const file of PAGES) {
  const full = path.join(ROOT, file);
  const html = fs.readFileSync(full, 'utf8');

  const oldHeader = between(html, '<header class="site-header" id="site-header">', '</header>', 9);
  const oldDrawer = between(html, '<div class="drawer-overlay"', '</aside>', 8);

  const info = { file, headerFound: !!oldHeader, drawerFound: !!oldDrawer };
  report.push(info);
  if (!oldHeader) { info.error = 'OLD HEADER NOT FOUND'; continue; }

  const sample = detectPrefix(html, [oldHeader, oldDrawer].filter(Boolean).map(r => ({ start: r.start, end: r.end })));
  info.prefix = sample.prefix;
  info.style = `abs=${sample.abs} dot=${sample.dot} plain=${sample.plain} of ${sample.total}`;

  let newHeader = normalizeLinks(markHeader(homeHeader.block, file), sample.prefix);
  let newDrawer = normalizeLinks(markDrawer(homeDrawer.block, file), sample.prefix);

  let out = html.slice(0, oldHeader.start) + newHeader + html.slice(oldHeader.end);
  if (oldDrawer) {
    // offsets shift after the header swap, so re-find the drawer
    const d2 = between(out, '<div class="drawer-overlay"', '</aside>', 8);
    if (d2) out = out.slice(0, d2.start) + newDrawer + out.slice(d2.end);
    else info.warn = 'drawer lost after header swap';
  }

  info.oldHeaderLen = oldHeader.end - oldHeader.start;
  info.newHeaderLen = newHeader.length;
  info.oldDrawerLen = oldDrawer ? oldDrawer.end - oldDrawer.start : 0;
  info.newDrawerLen = newDrawer.length;

  // verify the active mark landed where expected
  const wantHeader = MENU_HREF[file]
    || (file === 'services.html')
    || (file === 'contact.html');
  if (wantHeader && !(/active/.test(newHeader) && /aria-current="page"/.test(newHeader))) {
    info.error = 'ACTIVE MARK MISSING IN HEADER';
  }
  if (!wantHeader && /aria-current="page"/.test(newHeader)) {
    info.error = 'UNEXPECTED ACTIVE ITEM IN HEADER';
  }
  if (/index\.html" aria-current/.test(newHeader) || /index\.html" aria-current/.test(newDrawer)) {
    info.error = 'HOME STILL MARKED ACTIVE';
  }
  if (info.error) continue;

  if (WRITE) { fs.writeFileSync(full, out, 'utf8'); changed++; }
}

console.log(WRITE ? '--- APPLIED ---' : '--- DRY RUN ---');
for (const r of report) {
  console.log(
    r.file.padEnd(20),
    'header:' + (r.headerFound ? 'yes' : 'NO '),
    'drawer:' + (r.drawerFound ? 'yes' : 'NO '),
    'prefix:' + (r.prefix === undefined ? '?' : JSON.stringify(r.prefix)).padEnd(5),
    'style[' + (r.style || '') + ']',
    'hLen ' + (r.oldHeaderLen || 0) + '->' + (r.newHeaderLen || 0),
    'dLen:' + (r.oldDrawerLen || 0) + '->' + (r.newDrawerLen || 0),
    r.error || r.warn || ''
  );
}
if (WRITE) console.log('files written:', changed);