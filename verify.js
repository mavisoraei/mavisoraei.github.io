const fs = require('fs');
const r = fs.readFileSync('F:/Webflow/Lemon/lemoon.html', 'utf-8');
const persianRegex = /[\u0600-\u06FF]/;
const remaining = [...r].filter(ch => persianRegex.test(ch));
console.log('=== FINAL CHECK ===');
console.log('lang="en":', r.includes('lang="en"'));
console.log('dir="ltr":', r.includes('dir="ltr"'));
console.log('Has Inter font:', r.includes('fonts.googleapis.com/css2?family=Inter'));
console.log('No savepage:', !r.match(/savepage/gi));
console.log('No RTL direction:', !r.match(/direction:\s*rtl/g));
console.log('No font-fa:', !r.match(/font-fa/g));
console.log('Remaining Persian chars:', remaining.length);
console.log('File size:', r.length, 'bytes');
console.log('Server: http://localhost:8000/');
console.log('All done!');
try { fs.unlinkSync('F:/Webflow/Lemon/final_clean.js'); } catch(e) {}
