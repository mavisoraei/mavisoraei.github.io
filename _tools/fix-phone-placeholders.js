'use strict';
const fs = require('fs');
const pages = ['index.html', 'laser.html', 'facial.html', 'services.html', 'doctors.html', 'blog.html', 'areas.html', 'gallery.html', 'gallery_new.html', 'prices.html', 'contact.html', 'ai-analysis.html', 'face-analysis.html'];
for (const file of pages) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  text = text.replace(/\r\n/g, '\n');
  text = text.split('placeholder="0912…"').join('placeholder="+90 5xx xxx xx xx"');
  text = text.split('placeholder="05xx xxx xx xx"').join('placeholder="+90 5xx xxx xx xx"');
  if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (bom ? '\uFEFF' : '') + text, 'utf8');
}
console.log('phone placeholders updated');
