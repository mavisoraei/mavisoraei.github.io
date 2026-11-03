'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const SHOTS = [
  { width: 1440, height: 1000, mobile: false, scroll: 'top', out: '_tools/reports/t28-top-1440.png' },
  { width: 1440, height: 1000, mobile: false, scroll: '#pr-filler-head', out: '_tools/reports/t28-cards-1440.png' },
  { width: 1440, height: 1000, mobile: false, scroll: '.pr-note', out: '_tools/reports/t28-cta-1440.png' },
  { width: 390, height: 844, mobile: true, scroll: 'top', out: '_tools/reports/t28-top-390.png' },
  { width: 390, height: 844, mobile: true, scroll: '#pr-botox-head', out: '_tools/reports/t28-cards-390.png' }
];

(async function () {
  const launched = await launch();
  try {
    for (const shot of SHOTS) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: shot.mobile }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/prices.html' }, sessionId);
      await sleep(2500);
      if (shot.scroll !== 'top') {
        await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            document.querySelectorAll('.reveal-s, .reveal, .reveal-r, .reveal-l').forEach(function (el) { el.style.animation = 'none'; el.style.transform = 'none'; el.style.opacity = '1'; });
            var el = document.querySelector('${shot.scroll}');
            if (el) el.scrollIntoView({ block: 'start' });
          })()`
        }, sessionId);
        await sleep(700);
      }
      const res = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(path.resolve(shot.out), Buffer.from(res.data, 'base64'));
      console.log('wrote ' + shot.out);
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
