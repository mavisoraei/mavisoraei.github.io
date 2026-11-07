'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function evalJson(cdp, sessionId, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  return res.result.value;
}

(async function () {
  const launched = await launch();
  try {
    for (const viewport of [{ width: 1440, height: 1000, mobile: false }, { width: 390, height: 844, mobile: true }]) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/gallery.html' }, sessionId);
      await sleep(2500);
      const data = await evalJson(launched.cdp, sessionId, `(function () {
        function r(el) { var b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; }
        var main = document.querySelector('main');
        var wrap = document.querySelector('.nb-wrap');
        var filters = document.querySelector('.nb-filters');
        var rows = Array.prototype.map.call(document.querySelectorAll('.nb-frow'), r);
        var labels = Array.prototype.map.call(document.querySelectorAll('.nb-flabel'), r);
        var chips = Array.prototype.map.call(document.querySelectorAll('.nb-chip'), function (el) { return { text: el.textContent.trim().replace(/\\s+/g, ' '), rect: r(el), top: Math.round(el.getBoundingClientRect().top), height: Math.round(el.getBoundingClientRect().height) }; });
        var tops = Array.from(new Set(chips.map(function (c) { return c.top; })));
        return {
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          main: r(main),
          wrap: r(wrap),
          filters: r(filters),
          rows: rows,
          labels: labels,
          chips: chips,
          chipTops: tops,
          chipHeights: Array.from(new Set(chips.map(function (c) { return c.height; }))),
          lastChipTop: chips.length ? chips[chips.length - 1].top : null,
          h1: document.querySelectorAll('h1').length
        };
      })()`);
      console.log('\\n=== gallery before @' + viewport.width + ' ===');
      console.log(JSON.stringify(data, null, 2));
      const res = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const out = '_tools/reports/t26-before-' + viewport.width + '.png';
      fs.writeFileSync(path.resolve(out), Buffer.from(res.data, 'base64'));
      console.log('wrote ' + out);
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
