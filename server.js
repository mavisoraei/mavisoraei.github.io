const http = require('http');
const fs = require('fs');
const path = require('path');

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
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveFile(fp, res) {
  const ext = path.extname(fp).toLowerCase();
  if (!MIME[ext]) return false;
  let data;
  try { data = fs.readFileSync(fp); } catch (e) { return false; }
  send(res, 200, MIME[ext], data);
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
    if (serveFile(path.join(ROOT, noExt + '.html'), res)) return;
  }

  // plain asset requests
  if (MIME[path.extname(decoded).toLowerCase()]) {
    const safe = path.normalize(path.join(ROOT, decoded));
    if (safe.startsWith(path.normalize(ROOT))) {
      if (serveFile(safe, res)) return;
    }
  }

  // anything else: single-page-app style fallback to the requested local page, else index
  if (serveFile(path.join(ROOT, 'index.html'), res)) return;

  send(res, 404, 'text/plain; charset=utf-8', 'Not found');
});

http_.listen(PORT, '0.0.0.0', () => {
  console.log('Lemon English mirror running at http://localhost:' + PORT + '/');
  console.log('Pages: / ' + PAGES.filter(p => p !== 'index').map(p => '/' + p).join(' '));
  console.log('Persian production paths and /en/ 302-redirect to the matching local page.');
});
