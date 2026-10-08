const fs = require('fs');
const files = ['areas.html','blog.html','contact.html','doctors.html','face-analysis.html','facial.html','gallery.html','gallery_new.html','prices.html','services.html'];
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const cls = new Set();
  for (const m of h.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && cls.add(c));
  const arr = [...cls].sort();
  console.log('== ' + f + ' (' + arr.length + '): ' + arr.join(' '));
}
