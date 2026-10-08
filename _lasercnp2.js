const fs = require('fs');
const h = fs.readFileSync('laser.html', 'utf8');
const i = h.indexOf('cnp');
const start = h.lastIndexOf('<section', i);
console.log('section start @' + start);
console.log(h.slice(start, start + 3400));
console.log('\n--- counts:');
for (const t of ['cnp-rows', 'cnp-row', 'cnp-group', 'cnp-card', 'cnp-cta', 'cnp-head', 'is-rev']) {
  console.log(t + ' = ' + (h.split(t).length - 1));
}
