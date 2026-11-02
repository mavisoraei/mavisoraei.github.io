'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/laser.html' }, sessionId);
    await sleep(2500);
    const res = await launched.cdp.send('Runtime.evaluate', {
      expression: `(function () {
        document.querySelectorAll('.reveal-s, .reveal, .reveal-r, .reveal-l').forEach(function (el) { el.style.animation = 'none'; el.style.transform = 'none'; el.style.opacity = '1'; });
        var fig = document.querySelector('.laser-pack');
        var img = fig.querySelector('img');
        var fr = fig.getBoundingClientRect();
        var ir = img.getBoundingClientRect();
        return {
          fig: { left: fr.left, right: fr.right, width: fr.width, maxWidth: getComputedStyle(fig).maxWidth, widthCss: getComputedStyle(fig).width, textAlign: getComputedStyle(fig).textAlign, display: getComputedStyle(fig).display },
          img: { left: ir.left, right: ir.right, width: ir.width, maxWidth: getComputedStyle(img).maxWidth, widthCss: getComputedStyle(img).width, display: getComputedStyle(img).display }
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log(JSON.stringify(res.result.value, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
