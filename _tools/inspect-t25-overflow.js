'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function evalJson(cdp, sessionId, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  return res.result.value;
}

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' }, sessionId);
    await sleep(5000);
    console.log(JSON.stringify(await evalJson(launched.cdp, sessionId, `(function () {
      var vw = window.innerWidth;
      var out = [];
      Array.prototype.forEach.call(document.querySelectorAll('*'), function (el) {
        var b = el.getBoundingClientRect();
        if (b.width && (b.right > vw + 1 || b.left < -1)) {
          out.push({ tag: el.tagName, cls: String(el.className).slice(0, 90), left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width), sw: el.scrollWidth, cw: el.clientWidth });
        }
      });
      out.sort(function (a, b) { return b.right - a.right; });
      return { vw: vw, scrollWidth: document.documentElement.scrollWidth, out: out.slice(0, 30) };
    })()`), null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
