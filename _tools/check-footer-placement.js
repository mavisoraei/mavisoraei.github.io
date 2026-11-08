'use strict';
const fs = require('fs');
const pages = ['index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas', 'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis'];
for (const p of pages) {
  const f = p + '.html';
  const t = fs.readFileSync(f, 'utf8');
  const s = t.indexOf('<!-- T25 FOOTER START -->');
  const e = t.indexOf('<!-- T25 FOOTER END -->');
  const body = t.lastIndexOf('</body>');
  const logo = (t.match(/class="ft25-logo"/g) || []).length;
  const oldTop = (t.match(/class="f-top"/g) || []).length;
  const oldMascot = (t.match(/class="f-mascot"/g) || []).length;
  const trust = (t.match(/class="f-trust"/g) || []).length;
  console.log(f, 'footer=' + ((t.match(/<footer/g) || []).length), 'cta=' + ((t.match(/ft25-cta-zone/g) || []).length), 'logo=' + logo, 'oldTop=' + oldTop, 'oldMascot=' + oldMascot, 'trust=' + trust, 'order=' + (s < body && body > e ? 'ok' : 'BAD'));
}
