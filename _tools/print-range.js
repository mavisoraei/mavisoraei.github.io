'use strict';
const fs = require('fs');
const file = process.argv[2];
const start = Number(process.argv[3] || 0);
const length = Number(process.argv[4] || 3000);
const text = fs.readFileSync(file, 'utf8');
const i = text.search(/<main\b/i);
console.log(text.slice(i + start, i + start + length));
