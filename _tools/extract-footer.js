'use strict';
const fs = require('fs');
const t = fs.readFileSync('index.html', 'utf8');
const m = t.match(/<footer[\s\S]*?<\/footer>/i);
if (!m) throw new Error('no footer');
const s = m[0].replace(/></g, '>\n<');
fs.writeFileSync('_tools/reports/t25-current-footer.pretty.html', s);
console.log('length=' + s.length);
