const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'hero-arch-prototype.html');
const words = ['patient', 'experience', 'testimonial', 'feedback', 'rating', 'said', 'Google review', 'recommend', '★★', 'scored'];
for (const f of files) {
  const st = fs.statSync(f);
  if (st.size < 5000) continue;
  const h = fs.readFileSync(f, 'utf8');
  const found = [];
  for (const w of words) {
    const n = h.split(w).length - 1;
    if (n) found.push(w + ':' + n);
  }
  console.log(f + ' -> ' + (found.join(', ') || 'none'));
}
