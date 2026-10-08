const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'hero-arch-prototype.html');
const pats = ['cnp-rail', 'cnp-card', 'cnp-track', 'review', 'stars', 'testimonial', 'quote', 'avis', 'نظر'];
for (const f of files) {
  const st = fs.statSync(f);
  if (st.size < 5000) continue;
  const h = fs.readFileSync(f, 'utf8');
  const found = pats.filter(p => h.toLowerCase().includes(p.toLowerCase()));
  if (found.length) console.log(f + ' | ' + st.size + ' | ' + found.join(', '));
}
