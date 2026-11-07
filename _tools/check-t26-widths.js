'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function ev(cdp, sid, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sid);
  return res.result.value;
}

(async function () {
  const launched = await launch();
  try {
    for (const width of [1440, 1200, 1024, 900, 768, 560, 390]) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, mobile: width <= 560 }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/gallery.html' }, sessionId);
      await sleep(2200);

      const before = await ev(launched.cdp, sessionId, `(function () {
        function r(el) { var b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width), top: Math.round(b.top), height: Math.round(b.height) }; }
        var p = document.querySelector('.nb-filters');
        var s = document.querySelector('.nb-chip-scroll');
        var chips = Array.prototype.map.call(document.querySelectorAll('.nb-chip'), function (el) { var b = el.getBoundingClientRect(); return { t: el.textContent.trim(), l: Math.round(b.left), w: Math.round(b.width), y: Math.round(b.top), h: Math.round(b.height) }; });
        var tr = document.querySelector('.nb-doc-trigger');
        var side = document.querySelector('.nb-filter-side');
        return {
          panel: r(p), wrap: r(document.querySelector('.nb-wrap')), grid: r(document.querySelector('.nb-grid')),
          scroll: { client: s.clientWidth, total: s.scrollWidth, mask: getComputedStyle(s).maskImage },
          rows: Array.from(new Set(chips.map(function (c) { return c.y; }))).length,
          heights: Array.from(new Set(chips.map(function (c) { return c.h; }))),
          chipStart: chips[0].l, chipEnd: chips[chips.length - 1].l + chips[chips.length - 1].w,
          trigger: r(tr), side: r(side), count: document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      })()`);

      await ev(launched.cdp, sessionId, `document.querySelector('.nb-doc-trigger').click()`);
      await sleep(220);
      const after = await ev(launched.cdp, sessionId, `(function () {
        var p = document.querySelector('.nb-doc-popover');
        var b = p.getBoundingClientRect();
        return { hidden: p.hidden, rect: { left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width), top: Math.round(b.top), height: Math.round(b.height) }, overflow: document.documentElement.scrollWidth > innerWidth, expanded: document.querySelector('.nb-doc-trigger').getAttribute('aria-expanded') };
      })()`);

      if (width === 390) {
        const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
        fs.writeFileSync(path.resolve('_tools/reports/t26-popover-390.png'), Buffer.from(shot.data, 'base64'));
        await ev(launched.cdp, sessionId, `document.querySelector('[data-filter="doc:havasi"]').click()`);
        await sleep(300);
        const selection = await ev(launched.cdp, sessionId, `(function () {
          var c = document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent;
          var side = document.querySelector('.nb-filter-side').getBoundingClientRect();
          var clear = document.querySelector('.nb-clear').getBoundingClientRect();
          return { count: c, trigger: document.querySelector('.nb-doc-trigger__label').textContent.trim(), clear: !document.querySelector('.nb-clear').hidden, sideRight: Math.round(side.right), clearRight: Math.round(clear.right), overflow: document.documentElement.scrollWidth > innerWidth };
        })()`);
        const shot2 = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
        fs.writeFileSync(path.resolve('_tools/reports/t26-390-doctor.png'), Buffer.from(shot2.data, 'base64'));
        console.log(width + ' selection=' + JSON.stringify(selection));
      }

      console.log(width + ' before=' + JSON.stringify(before));
      console.log(width + ' popover=' + JSON.stringify(after));
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
