const fs = require('fs');
const h = fs.readFileSync('laser.html', 'utf8');
const rows = [...h.matchAll(/<div class="cnp-row"[^>]*>/g)];
console.log('row opens: ' + rows.length);
rows.forEach((r, i) => console.log('  row#' + (i + 1) + ' ' + r[0]));
const groups = [...h.matchAll(/<div class="cnp-group"[^>]*>/g)];
console.log('group opens: ' + groups.length);
// count cards per group
let idx = 0;
for (const g of groups) {
  const end = h.indexOf('</div>', g.index);
  const seg = h.slice(g.index, end);
  console.log('  group#' + (++idx) + ' ' + g[0].slice(0, 40) + ' cards=' + (seg.split('class="cnp-card"').length - 1));
}
// which inner pages link inner-unify.css
for (const f of fs.readdirSync('.').filter(x => x.endsWith('.html'))) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('inner-unify.css')) console.log('LINKS inner-unify: ' + f + ' size=' + fs.statSync(f).size);
}
