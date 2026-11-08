'use strict';
const fs = require('fs');
const path = require('path');

const START = '<!-- T25 FOOTER START -->';
const END = '<!-- T25 FOOTER END -->';
const partial = fs.readFileSync(path.join(__dirname, 'partials', 'footer.html'), 'utf8').trim();
const pages = [
  'index.html',
  'laser.html',
  'facial.html',
  'services.html',
  'doctors.html',
  'blog.html',
  'areas.html',
  'gallery.html',
  'gallery_new.html',
  'prices.html',
  'contact.html',
  'ai-analysis.html',
  'face-analysis.html'
];

for (const file of pages) {
  let text = fs.readFileSync(file, 'utf8');
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  let how = '';

  const startIdx = text.indexOf(START);
  const endIdx = text.indexOf(END);
  if (startIdx !== -1 && endIdx > startIdx) {
    text = text.slice(0, startIdx) + partial + text.slice(endIdx + END.length);
    how = 'replaced existing T25 block';
  } else {
    const footer = text.match(/<footer\b[\s\S]*?<\/footer>/i);
    if (footer) {
      text = text.replace(footer[0], partial);
      how = 'replaced old footer';
    } else {
      const bodyClose = text.lastIndexOf('</body>');
      if (bodyClose === -1) throw new Error(file + ': no footer and no </body>');
      text = text.slice(0, bodyClose) + partial + newline + text.slice(bodyClose);
      how = 'inserted before </body> (page had no footer)';
    }
  }

  const beforeVersion = (text.match(/style\.css\?v=1\.0\.35/g) || []).length;
  text = text.replace(/style\.css\?v=1\.0\.35/g, 'style.css?v=1.0.36');

  const footerCount = (text.match(/<footer\b/gi) || []).length;
  const markerCount = (text.match(/T25 FOOTER START/g) || []).length;
  if (footerCount !== 1 || markerCount !== 1) {
    throw new Error(file + ': footerCount=' + footerCount + ' markerCount=' + markerCount);
  }

  fs.writeFileSync(file, text, 'utf8');
  console.log(file + ': ' + how + '; style version bumped=' + beforeVersion);
}
