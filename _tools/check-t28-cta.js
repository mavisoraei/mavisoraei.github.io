'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/prices.html' }, sessionId);
    await sleep(2500);
    const info = await launched.cdp.send('Runtime.evaluate', {
      expression: `(function () {
        var cta = document.querySelector('.pr-note');
        var r = cta.getBoundingClientRect();
        window.scrollTo(0, r.top + window.scrollY - 120);
        return { top: r.top, height: r.height, width: r.width, display: getComputedStyle(cta).display, background: getComputedStyle(cta).backgroundImage, border: getComputedStyle(cta).borderTopWidth, y: r.top + window.scrollY };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log(JSON.stringify(info.result.value, null, 2));
    await sleep(1200);
    const after = await launched.cdp.send('Runtime.evaluate', {
      expression: `(function () { var c = document.querySelector('.pr-note'); var r = c.getBoundingClientRect(); return { top: Math.round(r.top), height: Math.round(r.height), scrollY: Math.round(window.scrollY) }; })()`,
      returnByValue: true
    }, sessionId);
    console.log(JSON.stringify(after.result.value, null, 2));
    const res = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.resolve('_tools/reports/t28-cta-1440b.png'), Buffer.from(res.data, 'base64'));
    console.log('wrote _tools/reports/t28-cta-1440b.png');
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
