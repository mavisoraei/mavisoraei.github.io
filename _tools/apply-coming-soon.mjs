import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, 'reports', 'pages-needed.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.replace(/\r\n/g, '\n').split('\n');

const root = path.join(__dirname, '..');
const t1 = [], t2 = [], t3 = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const parts = lines[i].split(',');
  const file = parts[0];
  const tier = parts[2];
  const live = parts[9] || '';
  if (tier === '1') t1.push({ file, live });
  if (tier === '2') t2.push({ file, live });
  if (tier === '3') t3.push(file);
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (m) return m[1].trim();
  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h) {
    const t = h[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return t || 'Coming soon';
  }
  return 'Coming soon';
}

function extractMetaDesc(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  return m ? m[1] : null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i);
  return m ? m[1] : null;
}

const headerNavFooter = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const headerStart = headerNavFooter.indexOf('<header');
const headerEnd = headerNavFooter.indexOf('</header>') + '</header>'.length;
const footerStart = headerNavFooter.indexOf('<footer');
const footerEnd = headerNavFooter.indexOf('</footer>') + '</footer>'.length;
const header = headerStart >= 0 && headerEnd > headerStart ? headerNavFooter.slice(headerStart, headerEnd) : '';
const footer = footerStart >= 0 && footerEnd > footerStart ? headerNavFooter.slice(footerStart, footerEnd) : '';

function buildPage(file, title, metaDesc, canonical, liveSource) {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let meta = '';
  if (metaDesc) meta += '  <meta name="description" content="' + metaDesc.replace(/"/g, '&quot;') + '">\n';
  if (canonical) meta += '  <link rel="canonical" href="' + canonical.replace(/"/g, '&quot;') + '">\n';
  const mainAttr = liveSource ? ' data-source="' + liveSource.replace(/"/g, '&quot;') + '"' : '';
  const comment = liveSource ? '<!-- source: ' + liveSource + ' -->\n' : '';
  return '<!DOCTYPE html>\n<html lang="en" dir="ltr">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + safeTitle + '</title>\n' + meta + '  <link rel="preload" href="/assets/fonts/Runiga.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="preload" href="/assets/fonts/Jost-latin.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="stylesheet" href="/style.css?v=1.0.32">\n  <link rel="stylesheet" href="/assets/css/nav-extras.css?v=1.1.0">\n</head>\n<body>\n  <a class="skip-link" href="#main">Skip to content</a>\n' + header + '\n  <main id="main" class="page-main"' + mainAttr + '>\n' + comment + '    <section class="wrap" style="padding: clamp(120px,16vh,160px) 0 clamp(80px,12vh,120px); max-width: var(--content, 720px);">\n      <div class="glass-card" style="padding: clamp(28px,6vw,48px); text-align:center; border-radius: 22px;">\n        <h1 style="font-family: var(--font-heading, Runiga), serif; font-weight: 400; margin: 0 0 12px;">' + safeTitle + '</h1>\n        <p style="margin: 0 0 24px; color: var(--muted, #6b6258);">This page is being prepared.</p>\n        <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">\n          <a class="btn-primary" href="./index.html">Home</a>\n          <a class="btn-ghost" href="./services.html">Services</a>\n          <a class="btn-ghost" href="./prices.html">Pricing</a>\n          <a class="btn-primary" href="./contact.html" onclick="if(window.LemonBooking&&window.LemonBooking.open){event.preventDefault();window.LemonBooking.open({service:\'consultation\'});}">Book a consultation</a>\n        </div>\n      </div>\n    </section>\n  </main>\n' + footer + '\n  <script src="/assets/js/nav-extras.js?v=1.0.0" defer></script>\n  <script src="/assets/js/booking.js?v=1.0.1" defer></script>\n</body>\n</html>\n';
}

const targets = [...t1, ...t2];
for (const t of targets) {
  const fp = path.join(root, t.file);
  if (!fs.existsSync(fp)) continue;
  const orig = fs.readFileSync(fp);
  const text = orig.toString('utf8');
  const title = extractTitle(text);
  const metaDesc = extractMetaDesc(text);
  const canonical = extractCanonical(text);
  const out = buildPage(t.file, title, metaDesc, canonical, t.live);
  if (orig.length >= 3 && orig[0] === 0xEF && orig[1] === 0xBB && orig[2] === 0xBF) {
    fs.writeFileSync(fp, Buffer.concat([Buffer.from([0xEF,0xBB,0xBF]), Buffer.from(out, 'utf8')]));
  } else {
    fs.writeFileSync(fp, out, 'utf8');
  }
  console.log('updated', t.file);
}

for (const f of t3) {
  const fp = path.join(root, f);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    console.log('removed', f);
  }
}

console.log('NAV_GALLERY:' + /href=["'][^"']*gallery\.html["']/.test(headerNavFooter));
console.log('NAV_GALLERY_NEW:' + /href=["'][^"']*gallery_new\.html["']/.test(headerNavFooter));
