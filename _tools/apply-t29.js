'use strict';
const fs = require('fs');

const edits = [
  ['doctors.html', 'Dr. Atefeh Norouhmohammadi</a>\r\nThey are part', 'Dr. Atefeh Norouhmohammadi</a>.\r\nThey are part'],
  ['doctors.html', 'Case Gallery</a> You can see it by filtering', 'Case Gallery</a>. You can see it by filtering'],
  ['face-analysis.html', 'Spartina Calculator</a> It helps you alongside', 'Spartina Calculator</a>. It helps you alongside'],
  ['index.html', 'Lemon Medical Aesthetic Clinic</a> In Nisantasi, near', 'Lemon Medical Aesthetic Clinic</a>. In Nisantasi, near']
];

for (const [file, from, to] of edits) {
  const text = fs.readFileSync(file, 'utf8');
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${file}: expected 1 match, got ${count}`);
  fs.writeFileSync(file, text.replace(from, to), 'utf8');
  console.log(`${file}: 1 edit`);
}
