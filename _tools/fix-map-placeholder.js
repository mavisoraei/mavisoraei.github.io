'use strict';
const fs = require('fs');
const file = 'index.html';
let text = fs.readFileSync(file, 'utf8');
const bom = text.charCodeAt(0) === 0xFEFF;
if (bom) text = text.slice(1);
const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
text = text.replace(/\r\n/g, '\n');
const placeholder = '<div class="hl-map hl-map--placeholder reveal" role="img" aria-label="Map placeholder for Lemon Aesthetic Clinic in Nisantasi, Istanbul" style="display:grid;place-items:center;min-height:320px;aspect-ratio:1;padding:24px;border:1px solid #b08f56;border-radius:var(--radius-lg);background:linear-gradient(135deg,#faf6ee,#e8d9bb);color:var(--foreground);text-align:center"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="display:block;margin-block-start:12px;font-weight:600">Nisantasi, Istanbul</span><span style="display:block;font-size:13px;color:var(--muted-foreground)">Map placeholder</span></div>';
const re = /<a class="hl-map reveal"[\s\S]*?<\/a>/i;
if (!re.test(text)) {
  console.error('index map anchor not found');
  process.exit(1);
}
text = text.replace(re, placeholder);
if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
fs.writeFileSync(file, (bom ? '\uFEFF' : '') + text, 'utf8');
console.log('replaced index map placeholder');
