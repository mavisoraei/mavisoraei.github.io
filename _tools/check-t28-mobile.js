'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/prices.html' }, sessionId);
    await sleep(2500);
    const res = await launched.cdp.send('Runtime.evaluate', {
      expression: `(function () {
        function r(el) { var b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width) }; }
        var cards = Array.prototype.map.call(document.querySelectorAll('.pr-block'), function (el) { return r(el).width; });
        var uniq = Array.from(new Set(cards));
        var grid = document.querySelector('.pr-grid--single');
        var main = document.querySelector('.pr-main');
        return {
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          grid: r(grid),
          main: r(main),
          mainColumns: getComputedStyle(main).gridTemplateColumns,
          cardWidths: uniq,
          cardCount: cards.length,
          benefitColumns: getComputedStyle(document.querySelector('.pr-benefits__grid')).gridTemplateColumns,
          cta: r(document.querySelector('.pr-note')),
          tocbar: { position: getComputedStyle(document.querySelector('.lm-svc-tocbar')).position, width: r(document.querySelector('.lm-svc-tocbar')).width },
          priceWidths: Array.from(new Set(Array.prototype.map.call(document.querySelectorAll('.pr-rows b, .pr-price'), function (el) { return Math.round(el.getBoundingClientRect().width); })))
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log(JSON.stringify(res.result.value, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
