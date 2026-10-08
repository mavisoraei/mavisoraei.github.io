const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'hero-arch-prototype.html');
const re = /(cnp|rvw|rev-|review-|-review|star|quote|testi|avatar|said|feedback|rating|patient-|say)/i;
for (const f of files) {
  const st = fs.statSync(f);
  if (st.size < 5000) continue;
  const h = fs.readFileSync(f, 'utf8');
  const cls = (h.match(/class="[^"]+"/g) || []).map(c => c.slice(7, -1));
  const hits = [...new Set(cls.filter(c => re.test(c)))];
  if (hits.length) console.log(f + ' -> ' + hits.join(' | '));
}
