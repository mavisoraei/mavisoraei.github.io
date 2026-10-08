const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const hits = [];
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const star = h.split('★').length - 1;
  const cnp = h.split('cnp-card').length - 1;
  const rev = /class="[^"]*review/i.test(h);
  if (star || cnp || rev) hits.push(f + ' size=' + fs.statSync(f).size + ' star=' + star + ' cnp-card=' + cnp + ' reviewClass=' + rev);
}
console.log(hits.join('\n') || 'none');
console.log('total html=' + files.length);
