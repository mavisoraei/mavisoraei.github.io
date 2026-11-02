'use strict';
const fs = require('fs');
const path = require('path');

const pages = ['index.html', 'laser.html', 'facial.html', 'services.html', 'doctors.html', 'blog.html', 'areas.html', 'gallery.html', 'gallery_new.html', 'prices.html', 'contact.html', 'ai-analysis.html', 'face-analysis.html'];
const shared = [
  'style.css',
  'assets/css/ai-flow.css', 'assets/css/arch-intro.css', 'assets/css/booking.css', 'assets/css/contact-modal.css',
  'assets/css/home-sections.css', 'assets/css/inline-text.css', 'assets/css/inner-unify.css', 'assets/css/nav-extras.css',
  'assets/js/ai-api.js', 'assets/js/ai-app.js', 'assets/js/ai-flow.js', 'assets/js/arch-intro.js', 'assets/js/booking.js',
  'assets/js/contact-modal.js', 'assets/js/home-sections.js', 'assets/js/nav-extras.js', 'data/availability.json'
];
const patterns = [
  ['Toman / تومان', /Toman|toman|تومان/g],
  ['Persian / Arabic-Indic digits', /[\u06F0-\u06F9\u0660-\u0669]/g],
  ['West Tehran', /West Tehran/g],
  ['Tehran', /Tehran/g],
  ['Chitgar', /Chitgar/g],
  ['District 22', /District 22/g],
  ['Kharazi', /Kharazi/g],
  ['Ardestani', /Ardestani|Ardastani/g],
  ['Parseh', /Parseh/g],
  ['Iran Mall', /Iran Mall/g],
  ['Iranian', /Iranian/g],
  ['Iran (standalone)', /\bIran\b/g],
  ['Neshan', /Neshan/g],
  ['Balad', /Balad/g],
  ['Phone +98', /\+98/g],
  ['Phone 021', /\b021\b/g],
  ['Phone 0912', /0912/g],
  ['Phone 090', /\b090\d/g],
  ['Tehran time', /Tehran time/g],
  ['TTAC', /TTAC/g],
  ['Enamad', /Enamad|enamad/g],
  ['Tehran City Medical Practice License', /Tehran City Medical Practice License/g],
  ['1405', /1405/g],
  ['Price index', /price index/gi],
  ['Instalment / installment', /installment|instalment/gi],
  ['Payment apps', /BeautyPay|Beautypay|DigiPay|SnapPay|DoctorPay|Tara and Kipa/gi],
  ['Area / removed page links', /(?:west-tehran|district-22|chitgar|tehran-beauty-price-index|installment-payment|installment-gel-injections)\.html/gi],
  ['fa-IR / fa_IR', /fa-IR|fa_IR/g],
  ['dir="rtl"', /dir="rtl"/g]
];
const files = pages.concat(shared);
const results = {};
for (const [name] of patterns) results[name] = { total: 0, files: {} };
let hotlinks = new Set();
const hotlinkCounts = new Map();
const hotlinkByFile = {};
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const [name, re] of patterns) {
    const matches = text.match(re);
    if (matches) {
      results[name].total += matches.length;
      results[name].files[file] = matches.length;
    }
  }
  if (pages.includes(file)) {
    const re = /https:\/\/lemonclinic\.org\/[^"'\s)]+\.(?:webp|avif|png|jpe?g|svg)/gi;
    const found = text.match(re) || [];
    hotlinkByFile[file] = new Set(found).size;
    found.forEach(function (u) {
      hotlinks.add(u);
      hotlinkCounts.set(u, (hotlinkCounts.get(u) || 0) + 1);
    });
  }
}
console.log('AFTER COUNTS');
for (const [name] of patterns) {
  console.log(name + '\t' + results[name].total + '\t' + JSON.stringify(results[name].files));
}
console.log('HOTLINKED UNIQUE\t' + hotlinks.size);
console.log('HOTLINKED BY FILE\t' + JSON.stringify(hotlinkByFile));
const groups = {};
for (const u of hotlinks) {
  const m = u.match(/lemonclinic\.org\/([^/]+)\//);
  const key = m ? m[1] : 'root';
  groups[key] = (groups[key] || 0) + 1;
}
console.log('HOTLINK GROUPS\t' + JSON.stringify(groups));
const named = Array.from(hotlinks).filter(function (u) { return /logo|mascot|consultant|map|favicon|apple-touch/i.test(u); });
console.log('NAMED HOTLINKS');
named.slice(0, 40).forEach(function (u) { console.log(u); });
const csv = ['url,references,group'];
Array.from(hotlinks).sort().forEach(function (u) {
  const m = u.match(/lemonclinic\.org\/([^/]+)\//);
  const group = m ? m[1] : 'root';
  csv.push('"' + u.replace(/"/g, '""') + '",' + (hotlinkCounts.get(u) || 0) + ',' + group);
});
fs.writeFileSync('_tools/reports/localization-hotlinks-after.csv', csv.join('\n') + '\n', 'utf8');
console.log('wrote _tools/reports/localization-hotlinks-after.csv');
