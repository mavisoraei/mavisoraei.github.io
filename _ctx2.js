const fs = require('fs');
const files = ['areas.html','blog.html','contact.html','doctors.html','face-analysis.html','facial.html','gallery.html','gallery_new.html','prices.html','services.html','laser.html'];
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  console.log('===== ' + f);
  let i = 0, n = 0;
  const low = h.toLowerCase();
  while ((i = low.indexOf('review', i)) !== -1 && n < 6) {
    // skip inside <script> JSON-LD
    const before = h.lastIndexOf('<script', i);
    const scriptEnd = h.indexOf('</script>', before);
    const inScript = before > -1 && (scriptEnd === -1 || scriptEnd > i);
    console.log((inScript ? '[script] ' : '[page] ') + '@' + i + ': ' + h.slice(Math.max(0, i - 130), i + 130).replace(/\s+/g, ' '));
    i += 6; n++;
  }
  if (!n) console.log('  none');
}
