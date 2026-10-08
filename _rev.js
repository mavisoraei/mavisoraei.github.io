const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'hero-arch-prototype.html');
const pats = ['"Review"', 'reviewRating', 'blockquote', '★', 'aria-label="5', 'aria-label="Rating', 'cnp-', 'patientReviews', 'reviews'];
for (const f of files) {
  const st = fs.statSync(f);
  if (st.size < 5000) continue;
  const h = fs.readFileSync(f, 'utf8');
  const found = pats.filter(p => h.includes(p));
  console.log(f + (found.length ? ' -> ' + found.join(', ') : ''));
}
