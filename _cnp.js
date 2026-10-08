const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');
// extract all rules whose selector mentions .cnp
const rules = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  const sel = m[1].trim();
  if (sel.includes('.cnp') || sel.includes('.star')) rules.push(sel + ' {' + m[2].replace(/\s+/g, ' ').trim() + '}');
}
console.log(rules.join('\n'));
