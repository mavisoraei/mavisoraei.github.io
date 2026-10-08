const fs = require('fs');
const files = ['areas.html','blog.html','contact.html','doctors.html','face-analysis.html','facial.html','gallery.html','gallery_new.html','prices.html','services.html','laser.html'];
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const heads = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('== ' + f + ' (' + heads.length + ' h2)');
  console.log('   ' + heads.join(' | '));
}
