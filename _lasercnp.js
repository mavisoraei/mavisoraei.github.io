const fs = require('fs');
const h = fs.readFileSync('laser.html', 'utf8');
const i = h.indexOf('cnp');
console.log('first cnp @' + i);
const start = h.lastIndexOf('<section', i);
const end = h.indexOf('</section>', i) + '</section>'.length;
console.log('section [' + start + '..' + end + '] len=' + (end - start));
console.log(h.slice(start, end));
