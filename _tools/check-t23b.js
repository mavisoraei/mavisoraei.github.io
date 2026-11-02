'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/doctors.html' }, sessionId);
    await sleep(2500);
    const expression = `(function () {
      document.querySelectorAll('.reveal-s').forEach(function (el) {
        el.style.animation = 'none';
        el.style.transform = 'none';
        el.style.opacity = '1';
      });
      var rows = Array.prototype.map.call(document.querySelectorAll('.spread'), function (row, i) {
        var p = row.querySelector('.spread-photo');
        var c = row.querySelector('.spread-copy');
        var ph = p ? p.getBoundingClientRect().height : 0;
        var ch = c ? c.getBoundingClientRect().height : 0;
        return {
          i: i,
          row: Math.round(row.getBoundingClientRect().height),
          photo: Math.round(ph),
          copy: Math.round(ch),
          equal: Math.abs(ph - ch) < 1,
          display: getComputedStyle(row).display,
          alignItems: getComputedStyle(row).alignItems,
          photoAlignSelf: p ? getComputedStyle(p).alignSelf : '',
          copyAlignSelf: c ? getComputedStyle(c).alignSelf : ''
        };
      });
      var photo = document.querySelector('.spread-photo');
      var img = document.querySelector('.spread-photo img');
      var copy = document.querySelector('.spread-copy');
      return {
        background: photo ? getComputedStyle(photo).backgroundImage : '',
        blend: img ? getComputedStyle(img).mixBlendMode : '',
        copyAlign: copy ? getComputedStyle(copy).textAlign : '',
        rows: rows
      };
    })()`;
    const res = await launched.cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
    console.log(JSON.stringify(res.result.value, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
