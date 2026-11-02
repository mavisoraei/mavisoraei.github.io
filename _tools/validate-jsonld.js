'use strict';
const fs = require('fs');
const pages = ['index.html', 'laser.html', 'facial.html', 'services.html', 'doctors.html', 'blog.html', 'areas.html', 'gallery.html', 'gallery_new.html', 'prices.html', 'contact.html', 'ai-analysis.html', 'face-analysis.html'];
let count = 0;
for (const file of pages) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(text))) {
    JSON.parse(match[1]);
    count += 1;
  }
}
console.log('jsonld blocks parsed: ' + count);
