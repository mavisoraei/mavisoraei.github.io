'use strict';
const fs = require('fs');
const targets = {
  'face-analysis.html': [27],
  'gallery.html': [80],
  'gallery_new.html': [1368]
};
for (const file of Object.keys(targets)) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (const n of targets[file]) {
    if (lines[n - 1] != null) lines[n - 1] = lines[n - 1].replace(/[ \t]+$/, '');
  }
  let out = lines.join('\n');
  if (eol === '\r\n') out = out.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (bom ? '\uFEFF' : '') + out, 'utf8');
  console.log('trimmed', file, targets[file].join(','));
}
