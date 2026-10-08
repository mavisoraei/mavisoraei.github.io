const fs = require('fs');
const h = fs.readFileSync('doctors.html', 'utf8');
const i = h.indexOf('spread-rev');
console.log('spread-rev @' + i);
console.log(h.slice(i - 900, i + 900).replace(/\s+/g, ' '));
