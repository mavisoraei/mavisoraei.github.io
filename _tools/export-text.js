const fs = require('fs');
const ROOT = 'F:/Webflow/Lemon/';
const OUT = ROOT + 'content-export/';

const PAGES = [
  'index.html', 'laser.html', 'facial.html', 'services.html', 'prices.html',
  'doctors.html', 'contact.html', 'gallery.html', 'gallery_new.html',
  'blog.html', 'areas.html', 'face-analysis.html'
];

const NAMED = new Set(['h1','h2','h3','h4','h5','h6','p','li','a','button','th','td','label','summary','figcaption']);
const SKIP = new Set(['script','style','svg','template','noscript','head','audio','video','canvas','iframe','object','embed','map']);
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function tokenize(html) {
  const re = /(<!--[\s\S]*?-->|<!DOCTYPE[\s\S]*?>|<![^>]*>|<\/[^>]+>|<[^>]+>)/g;
  const tokens = [];
  let last = 0, m;
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ kind: 'text', v: html.slice(last, m.index) });
    tokens.push({ kind: /^<\//.test(m[0]) ? 'close' : /^<!--/.test(m[0]) || /^<!/.test(m[0]) ? 'decl' : 'open', v: m[0] });
    last = m.index + m[0].length;
  }
  if (last < html.length) tokens.push({ kind: 'text', v: html.slice(last) });
  return tokens;
}

function parseAttrs(s) {
  const attrs = {};
  const re = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let m;
  while ((m = re.exec(s))) {
    let v = m[2];
    if (v != null && (v[0] === '"' || v[0] === "'")) v = v.slice(1, -1);
    attrs[(m[1]).toLowerCase()] = v == null ? '' : v;
  }
  return attrs;
}

function parseTree(html) {
  const root = { name: '#root', attrs: {}, children: [] };
  const stack = [root];
  for (const tok of tokenize(html)) {
    if (tok.kind === 'text') {
      stack[stack.length - 1].children.push({ name: '#text', v: tok.v });
      continue;
    }
    if (tok.kind === 'decl') continue;
    if (tok.kind === 'close') {
      const name = tok.v.slice(2, -1).trim().split(/\s/)[0].toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const inner = tok.v.slice(1, -1).trim();
    const name = inner.split(/\s/)[0].toLowerCase();
    const attrs = parseAttrs(inner.replace(/^\w+/, ''));
    const node = { name, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    const selfClose = /\/>$/.test(tok.v);
    if (!selfClose && !VOID.has(name)) stack.push(node);
    else stack[stack.length - 1] = stack[stack.length - 1]; // leaf
  }
  return root;
}

function flatten(node) {
  const parts = [];
  const walk = (n) => {
    if (n.name === '#text') { parts.push(n.v); return; }
    const name = n.name.toLowerCase();
    if (SKIP.has(name)) return;
    if ((n.attrs['aria-hidden'] || '').toLowerCase() === 'true') return;
    if (!n.children) return;
    for (const c of n.children) walk(c);
  };
  walk(node);
  let s = '';
  for (const p of parts) {
    const w = String(p).replace(/\s+/g, ' ').trim();
    if (!w) continue;
    if (s && !/\s$/.test(s) && !/^[\s.,:;!?()\/…·»«—-]/.test(w)) s += ' ';
    s += w;
  }
  return s;
}

function find(node, name) {
  const res = [];
  const walk = (n) => {
    if (n.name === name) { res.push(n); return; }
    if (!n.children) return;
    for (const c of n.children) walk(c);
  };
  walk(node);
  return res;
}

function extractPage(file, report) {
  const html = fs.readFileSync(ROOT + file, 'utf8');
  const slug = file.replace(/\.html$/, '');
  const lines = [];
  let n = 1;
  const push = (tag, text) => {
    lines.push(slug + '-' + (n++) + ' | ' + tag + ' | ' + text);
  };
  const t = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (t) push('meta-title', t[1].replace(/\s+/g, ' ').trim());
  const md = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i.exec(html) ||
             /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html);
  if (md) push('meta-description', md[1].replace(/\s+/g, ' ').trim());

  const tree = parseTree(html);
  const mains = find(tree, 'main');
  const emit = (node, hasNamedAncestor) => {
    if (typeof node.name !== 'string') return;
    const name = node.name.toLowerCase();
    if (name === '#text') return;
    if (SKIP.has(name)) return;
    if ((node.attrs['aria-hidden'] || '').toLowerCase() === 'true') return;
    if (NAMED.has(name)) {
      const txt = flatten(node);
      if (txt) {
        if (!hasNamedAncestor) push(name, txt);
        for (const c of node.children) emit(c, true);
        return;
      }
    }
    for (const c of node.children) emit(c, hasNamedAncestor);
  };
  for (const main of mains) emit(main, false);

  const bytes = Buffer.byteLength(lines.join('\n'), 'utf8');
  report[file] = { lines: lines.length, bytes };
  return lines.join('\n');
}

function extractData() {
  const out = [];
  const idx = fs.readFileSync(ROOT + 'index.html', 'utf8');

  const srcI = idx.indexOf('cnp-source');
  if (srcI >= 0) {
    const tagEnd = idx.indexOf('>', srcI) + 1;
    let depth = 1, p = tagEnd;
    while (depth > 0 && p < idx.length) {
      const o = idx.indexOf('<div', p);
      const c = idx.indexOf('</div>', p);
      p = Math.min(o < 0 ? Infinity : o, c < 0 ? Infinity : c);
      if (p === Infinity) break;
      const chunk = idx.slice(p, p + 5);
      if (chunk === '<div ') depth++; else if (chunk === '<div>') depth++; else depth--;
      p += 5;
    }
    const text = idx.slice(tagEnd, p - 5);
    const cards = /<a[^>]*class="cnp-card"[^>]*>([\s\S]*?)<\/a>/g;
    let m, count = 0;
    while ((m = cards.exec(text))) {
      const card = m[1];
      const name = (card.match(/cnp-name">([\s\S]*?)</) || [])[1];
      const date = (card.match(/cnp-date"[^>]*>([\s\S]*?)</) || [])[1];
      const rtext = (card.match(/cnp-text"[^>]*>([\s\S]*?)</) || [])[1];
      if (!name) continue;
      const clean = (v) => (v || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      out.push('index.html | reviews | ' + clean(name) + ' | ' + clean(date) + ' | ' + clean(rtext));
      count++;
    }
    out.push('index.html | reviews | __count__=' + count);
  }

  const menuStart = idx.indexOf('<div class="mega-panel">');
  if (menuStart >= 0) {
    const panel = idx.slice(menuStart);
    const groupRe = /<div class="mega-group">/g;
    let mg, gi = 0;
    while ((mg = groupRe.exec(panel))) {
      const start = mg.index + mg[0].length;
      let depth = 1, p = start;
      while (depth > 0) {
        const o = panel.indexOf('<div', p);
        const c = panel.indexOf('</div>', p);
        p = Math.min(o < 0 ? Infinity : o, c < 0 ? Infinity : c);
        if (p === Infinity) break;
        depth += (panel.slice(p, p + 5) === '<div ' || panel.slice(p, p + 5) === '<div>') ? 1 : -1;
        p += 5;
      }
      const body = panel.slice(start, p - 5);
      const god = (body.match(/<a[^>]*class="mega-group-title[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/) || []);
      const groupName = god[2] ? god[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '?';
      const groupHref = god[1] || '';
      gi++;
      if (groupName) out.push('index.html | services-menu | ' + groupName + ' | ' + groupHref);
      const liRe = /<li><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/li>/g;
      let lm;
      while ((lm = liRe.exec(body))) {
        out.push('index.html | services-menu | ' + groupName + ' \u00b7 ' + lm[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + ' | ' + lm[1]);
      }
    }
  }

  for (const f of ['gallery.html', 'gallery_new.html']) {
    const html = fs.readFileSync(ROOT + f, 'utf8');
    const m = /<script[^>]*id="nb-data"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!m) continue;
    let arr;
    try { arr = JSON.parse(m[1]); } catch (e) { out.push(f + ' | nb-data | __parse-error__ ' + e.message); continue; }
    for (const it of arr) {
      const id = it.id || it.title || '?';
      const title = (it.t || it.title || '').trim();
      const doctor = (it.dn || it.doctor || '').trim();
      out.push(f + ' | nb-data | ' + id + ' | ' + title + ' | ' + doctor);
    }
    out.push(f + ' | nb-data | __count__=' + (arr.length));
  }
  return out.join('\n');
}

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const report = {};
let totalLines = 0, totalBytes = 0;
for (const file of PAGES) {
  const text = extractPage(file, report);
  fs.writeFileSync(OUT + file.replace(/\.html$/, '.txt'), '\ufeff' + text);
  totalLines += report[file].lines;
  totalBytes += report[file].bytes;
}
const data = extractData();
fs.writeFileSync(OUT + '_data.txt', '\ufeff' + data);

console.log('page | blocks | bytes');
for (const f of PAGES) {
  const r = report[f];
  console.log((f.replace(/\.html$/, '.txt')).padEnd(22) + ' | ' + String(r.lines).padStart(4) + ' | ' + r.bytes);
}
console.log(''.padEnd(50, '-'));
console.log('TOTAL page lines: ' + totalLines + ' / bytes: ' + totalBytes);
console.log('_data.txt lines: ' + data.split('\n').length + ' / bytes: ' + Buffer.byteLength(data, 'utf8'));