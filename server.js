const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = 'F:/Webflow/Lemon';
const PORT = 8000;

const PAGES = ['index', 'services', 'doctors', 'prices', 'contact', 'gallery', 'blog', 'areas', 'face-analysis', 'laser', 'facial'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.xml']);
const LONG_CACHE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff2', '.woff', '.ttf']);

// in-memory gzip cache: file path + mtimeMs -> compressed Buffer
const gzipCache = new Map();
function gzipFor(fp, mtimeMs) {
  const key = fp + '@' + mtimeMs;
  let buf = gzipCache.get(key);
  if (buf) return buf;
  buf = zlib.gzipSync(fs.readFileSync(fp));
  if (gzipCache.size > 256) gzipCache.clear();
  gzipCache.set(key, buf);
  return buf;
}

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveFile(fp, res, req) {
  const ext = path.extname(fp).toLowerCase();
  if (!MIME[ext]) return false;
  let stat, data;
  try { stat = fs.statSync(fp); data = fs.readFileSync(fp); } catch (e) { return false; }

  const cacheControl = LONG_CACHE.has(ext) ? 'public, max-age=604800'
    : ext === '.html' ? 'no-cache'
    : (ext === '.css' || ext === '.js' || ext === '.mjs') ? 'no-cache'
    : 'no-store';

  const headers = { 'Content-Type': MIME[ext], 'Cache-Control': cacheControl };

  const isText = COMPRESSIBLE.has(ext);
  if (isText) headers['Vary'] = 'Accept-Encoding';

  // css/js revalidate on every request so edits appear immediately
  if (ext === '.css' || ext === '.js' || ext === '.mjs') {
    const etag = '"' + stat.mtimeMs.toString(16) + '-' + stat.size.toString(16) + '"';
    headers['ETag'] = etag;
    headers['Last-Modified'] = stat.mtime.toUTCString();
    if (req.headers['if-none-match'] === etag || req.headers['if-modified-since'] === stat.mtime.toUTCString()) {
      res.writeHead(304, headers);
      res.end();
      return true;
    }
  }

  if (isText && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    res.end(gzipFor(fp, stat.mtimeMs));
    return true;
  }

  res.writeHead(200, headers);
  res.end(data);
  return true;
}

// Persian production paths (URL-decoded) mapped onto the local English pages.
const ALIAS_BY_PAGE = {
  '/': 'index',
  '/en': 'index',
  '/\u062e\u062f\u0645\u0627\u062a/': 'services',
  '/\u067e\u0632\u0634\u06a9\u0627\u0646/': 'doctors',
  '/\u0642\u06cc\u0645\u062a/': 'prices',
  '/\u062a\u0645\u0627\u0633/': 'contact',
  '/\u0646\u0645\u0648\u0646\u0647-\u06a9\u0627\u0631/': 'gallery',
  '/\u0645\u062c\u0644\u0647/': 'blog',
  '/\u0645\u0646\u0627\u0637\u0642/': 'areas',
  '/\u0622\u0646\u0627\u0644\u06cc\u0632-\u0635\u0648\u0631\u062a/': 'face-analysis',
  '/\u062e\u062f\u0645\u0627\u062a/\u0644\u06cc\u0632\u0631-\u0645\u0648\u0647\u0627\u06cc-\u0632\u0627\u0626\u062f/': 'laser',
  '/\u062e\u062f\u0645\u0627\u062a/\u0641\u06cc\u0634\u0627\u0644/': 'facial'
};

const ALIAS_FILE = {};
for (const k of Object.keys(ALIAS_BY_PAGE)) ALIAS_FILE[k] = ALIAS_BY_PAGE[k] + '.html';
// secondary paths that should reach the same local file
ALIAS_FILE['/en'] = 'index.html';

const http_ = http.createServer((req, res) => {
  const raw = req.url || '/';
  const qIndex = raw.indexOf('?');
  const pathname = qIndex === -1 ? raw : raw.slice(0, qIndex);

  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch (e) { decoded = pathname; }
  decoded = decoded.replace(/\/+$/, '') || '/';

  // Persian production paths and /en/ -> 302 to the canonical local file, so that
  // relative links (./x.html) inside the page resolve correctly from the new URL
  const aliasFile = ALIAS_FILE[decoded] || ALIAS_FILE[decoded + '/'];
  if (aliasFile) {
    if (fs.existsSync(path.join(ROOT, aliasFile))) {
      res.writeHead(302, { 'Location': '/' + aliasFile, 'Cache-Control': 'no-store' });
      return res.end();
    }
  }

  // extensionless page requests: /services -> services.html
  const noExt = decoded.replace(/^\//, '');
  if (noExt && !noExt.includes('/') && PAGES.includes(noExt)) {
    if (serveFile(path.join(ROOT, noExt + '.html'), res, req)) return;
  }

  // plain asset requests
  if (MIME[path.extname(decoded).toLowerCase()]) {
    const safe = path.normalize(path.join(ROOT, decoded));
    if (safe.startsWith(path.normalize(ROOT))) {
      if (serveFile(safe, res, req)) return;
    }
  }

  /* Fallback policy.

     An SPA-style fallback to the requested page, else index, is correct for
     extensionless navigation. It must NOT apply to anything that names a file
     though: previously a missing asset answered 200 text/html with index.html's
     body, so `curl` reported every path as healthy and a typo'd image/CSS/JS
     reference failed in the browser as a MIME error with nothing pointing at the
     real cause. Anything carrying a known static extension now 404s. */
  const ext = path.extname(decoded).toLowerCase();
  const looksLikeAsset = Boolean(MIME[ext]);

  if (!looksLikeAsset && serveFile(path.join(ROOT, 'index.html'), res, req)) return;

  send(res, 404, 'text/plain; charset=utf-8', 'Not found: ' + decoded);
});

http_.listen(PORT, '0.0.0.0', () => {
  console.log('Lemon English mirror running at http://localhost:' + PORT + '/');
  console.log('Pages: / ' + PAGES.filter(p => p !== 'index').map(p => '/' + p).join(' '));
  console.log('Persian production paths and /en/ 302-redirect to the matching local page.');
});
