const fs = require('fs');
const path = require('path');
const ROOT = 'F:/Webflow/Lemon';

const REAL_PAGES = ['index.html', 'laser.html', 'facial.html', 'services.html', 'prices.html', 'doctors.html', 'contact.html', 'gallery.html', 'gallery_new.html', 'blog.html', 'areas.html', 'face-analysis.html'];
const SKIP_DIRS = new Set(['node_modules', 'vendor', 'content-export', '_archive', '_astro', '_tools', 'images']);
const EXT_CSS = new Set(['.css']);
const EXT_JS = new Set(['.js']);
const WALK_SKIP = new Set(['node_modules', 'vendor', 'content-export', '_archive', '_astro', 'stubtest']);

function findFilesUnder(dir) {
  const out = [];
  const walk = (d) => {
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const en of ents) {
      const p = path.join(d, en.name);
      if (en.isDirectory()) {
        if (!WALK_SKIP.has(en.name)) walk(p);
      } else {
        const ext = path.extname(en.name).toLowerCase();
        if (EXT_CSS.has(ext) || EXT_JS.has(ext)) out.push(p);
      }
    }
  };
  walk(dir);
  return out;
}

function realName(parent, name) {
  try {
    const exact = fs.readdirSync(parent).find(n => n === name);
    if (exact) return { exact: true, name };
    const loose = fs.readdirSync(parent).find(n => n.toLowerCase() === name.toLowerCase());
    return loose ? { exact: false, name: loose } : { exact: false, name: null };
  } catch (e) { return { exact: false, name: null }; }
}

// resolve a referenced path (already stripped of query/hash) against baseFile, return {ok, caseOk, resolved, problem}
function resolveRef(ref, baseDir) {
  let clean = ref.split(/[?#]/)[0];
  if (!clean) return null;
  const isRoot = clean.startsWith('/');
  const abs = isRoot ? path.join(ROOT, clean.replace(/^\//, '')) : path.resolve(baseDir, clean);
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const segs = rel.split('/');
  if (!rel || rel.startsWith('..')) return { ok: false, caseOk: false, resolved: null, problem: 'OUTSIDE_' + rel };
  let cur = ROOT;
  let mismatchAt = null;
  for (const s of segs) {
    if (s === '' || s === '.') continue;
    const r = realName(cur, s);
    if (!r.exact) {
      mismatchAt = r.name ? 'CASE:' + r.name : 'MISSING:' + s;
      return { ok: false, caseOk: false, resolved: r.name ? path.join(cur, r.name) : path.join(cur, s), problem: mismatchAt };
    }
    cur = path.join(cur, s);
  }
  return { ok: true, caseOk: true, resolved: cur, problem: null };
}

const ATTR_RE = /<(?:script|link|img|source|video|audio|iframe|a|input|form)[^>]*?\b(src|href|srcset|poster|action)\s*=\s*("([^"]*)"|'([^']*)')/gi;

function attrUrls(html) {
  const out = [];
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(html))) {
    const attr = m[1].toLowerCase();
    const val = m[3] || m[4] || '';
    if (attr === 'srcset') {
      for (const part of val.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) out.push(u);
      }
    } else if (val.trim()) out.push(val);
  }
  return out;
}

function cssUrls(css) {
  const out = [];
  let m;
  const re = /url\(\s*(['"]?)([^'")]*)\1\s*\)|@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/gi;
  while ((m = re.exec(css))) out.push((m[2] || m[3] || '').trim());
  return out;
}

function jsPaths(js) {
  const out = [];
  let m;
  const re = /(?:fetch|import)\s*\(\s*['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|src\s*:\s*['"]([^'"]+)['"]/g;
  while ((m = re.exec(js))) {
    for (let i = 1; i <= 3; i++) if (m[i]) out.push(m[i]);
  }
  // url( in JS templates/images loaded via CSS var? skip extra heuristic
  const re2 = /new\s+URL\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = re2.exec(js))) out.push(m[1]);
  return out;
}

const isLocal = (u) => {
  const s = u.trim();
  if (!s) return false;
  if (/^(?:https?:)?\/\//i.test(s)) return false;
  if (/^(?:data|mailto|tel|javascript|blob|about):/i.test(s)) return false;
  if (s.startsWith('#')) return false;
  if (s.startsWith('/*')) return false;
  return true;
};

const files = [];
for (const p of REAL_PAGES) files.push(path.join(ROOT, p));
for (const d of ['assets', 'fonts']) files.push(...findFilesUnder(path.join(ROOT, d)));
files.push(path.join(ROOT, 'app.js'), path.join(ROOT, 'gallery.js'), path.join(ROOT, 'count.js'));

const wrongCase = new Map(); // correct-name -> set of locations
const missing = new Map();

let refTotal = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('SKIP missing source file: ' + f); continue; }
  const src = fs.readFileSync(f, 'utf8');
  const baseDir = path.dirname(f);
  const urls = [];
  if (f.endsWith('.html')) {
    urls.push(...attrUrls(src));
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let sm;
    while ((sm = styleRe.exec(src))) urls.push(...cssUrls(sm[1]));
    const scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
    let jm;
    while ((jm = scriptRe.exec(src))) urls.push(...jsPaths(jm[1]));
  } else if (f.endsWith('.css')) {
    urls.push(...cssUrls(src));
  } else {
    urls.push(...jsPaths(src));
  }
  let lineNo = 0;
  for (const u of urls) {
    if (!isLocal(u)) continue;
    refTotal++;
    const res = resolveRef(u, baseDir);
    if (!res) continue;
    if (!res.ok) {
      if (res.problem.startsWith('CASE:')) {
        const correct = res.problem.slice(5);
        if (!wrongCase.has(correct)) wrongCase.set(correct, new Set());
        wrongCase.get(correct).add(f.replace(ROOT + '\\', '').replace(ROOT + '/', '') + ' :: ' + u);
      } else {
        const key = u;
        if (!missing.has(key)) missing.set(key, new Set());
        missing.get(key).add(f.replace(ROOT + '\\', '').replace(ROOT + '/', '') + ' :: ' + u);
      }
    }
  }
}

console.log('=== CASE-MISMATCH (reference vs real on-disk name) ===');
for (const [correct, locs] of [...wrongCase.entries()].sort()) {
  console.log('MISMATCH  "' + correct + '"');
  for (const l of locs) console.log('    ' + l);
}
console.log('=== MISSING (no on-disk file at all) ===');
for (const [u, locs] of [...missing.entries()].sort()) {
  console.log('MISSING  "' + u + '"');
  for (const l of locs) console.log('    ' + l);
}
console.log('=== SUMMARY ===');
console.log('files scanned: ' + files.length);
console.log('local refs checked: ' + refTotal);
console.log('case mismatches: ' + wrongCase.size + ' (unique correct names), locations: ' + [...wrongCase.values()].reduce((a, s) => a + s.size, 0));
console.log('missing files: ' + missing.size);