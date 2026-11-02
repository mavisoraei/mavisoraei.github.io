'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const PAGES = ['laser.html', 'facial.html'];

function bodyOf(html) {
  const start = html.indexOf('<article class="svc-body">');
  if (start === -1) throw new Error('no svc-body');
  const end = html.indexOf('</article>', start);
  return html.slice(start, end + 10);
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function idsOf(html) {
  return Array.from(html.matchAll(/\bid="([^"]+)"/g)).map(function (m) { return m[1]; });
}

function hrefsOf(html) {
  return Array.from(html.matchAll(/\bhref="([^"]+)"/g)).map(function (m) { return m[1]; });
}

let failed = false;
for (const page of PAGES) {
  const old = execFileSync('git', ['show', 'HEAD:' + page], { encoding: 'utf8' });
  const oldWithoutLead = old.replace(/<p class="svc-lead wrap">[\s\S]*?<\/p>/, '');
  const current = fs.readFileSync(page, 'utf8');
  const oldBody = bodyOf(oldWithoutLead);
  const newBody = bodyOf(current);
  const oldText = textOf(oldBody);
  const newText = textOf(newBody);
  const oldIds = idsOf(oldBody);
  const newIds = idsOf(newBody);
  const oldHrefs = hrefsOf(oldBody);
  const newHrefs = hrefsOf(newBody);
  const textOk = oldText === newText;
  const idsOk = JSON.stringify(oldIds) === JSON.stringify(newIds);
  const hrefsOk = JSON.stringify(oldHrefs) === JSON.stringify(newHrefs);
  console.log(page + ': text=' + (textOk ? 'PASS' : 'FAIL') +
    ', ids=' + (idsOk ? 'PASS' : 'FAIL') +
    ', hrefs=' + (hrefsOk ? 'PASS' : 'FAIL') +
    ', oldText=' + oldText.length + ', newText=' + newText.length);
  if (!textOk) {
    let i = 0;
    while (i < oldText.length && oldText[i] === newText[i]) i += 1;
    console.log('  first text diff at ' + i + ':');
    console.log('  old: ' + oldText.slice(Math.max(0, i - 80), i + 160));
    console.log('  new: ' + newText.slice(Math.max(0, i - 80), i + 160));
    failed = true;
  }
  if (!idsOk) {
    console.log('  old ids: ' + oldIds.join(','));
    console.log('  new ids: ' + newIds.join(','));
    failed = true;
  }
  if (!hrefsOk) {
    console.log('  old hrefs: ' + oldHrefs.join(','));
    console.log('  new hrefs: ' + newHrefs.join(','));
    failed = true;
  }
}
if (failed) process.exit(1);
