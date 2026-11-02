'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const SHOTS = [
  { page: 'laser.html', anchor: '#roller-or-shots-why-it-matters', out: '_tools/reports/t27-laser.png' },
  { page: 'facial.html', anchor: '#what-a-facial-does', out: '_tools/reports/t27-facial.png' }
];

(async function () {
  const launched = await launch();
  try {
    for (const shot of SHOTS) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false
      }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + shot.page }, sessionId);
      await sleep(2500);
      await launched.cdp.send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.reveal-s, .reveal, .reveal-r, .reveal-l').forEach(function (el) { el.style.animation = 'none'; el.style.transform = 'none'; el.style.opacity = '1'; }); document.querySelector('${shot.anchor}').scrollIntoView({ block: 'start' });`
      }, sessionId);
      await sleep(800);
      const res = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(path.resolve(shot.out), Buffer.from(res.data, 'base64'));
      console.log('wrote ' + shot.out);
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
