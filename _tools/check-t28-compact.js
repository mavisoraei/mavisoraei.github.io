'use strict';
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
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/prices.html' }, sessionId);
      await sleep(2500);

      const base = await evalJson(launched.cdp, sessionId, `(function () {
        function r(el) { var b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width) }; }
        var cards = Array.prototype.map.call(document.querySelectorAll('.pr-block'), function (el) { return r(el).width; });
        var row = document.querySelector('.pr-rows li');
        var b = document.querySelector('.pr-rows b');
        var link = document.querySelector('.pr-rows a');
        var grid = document.querySelector('.pr-grid--single');
        var toc = document.querySelector('.lm-svc-tocbar');
        var cta = document.querySelector('.pr-note');
        return {
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          grid: r(grid),
          cardWidths: Array.from(new Set(cards)),
          cardCount: cards.length,
          benefitColumns: getComputedStyle(document.querySelector('.pr-benefits__grid')).gridTemplateColumns,
          cta: r(cta),
          tocbar: { position: getComputedStyle(toc).position, width: r(toc).width, chips: toc.querySelectorAll('a').length },
          row: {
            gridTemplate: row ? getComputedStyle(row).gridTemplateColumns : null,
            priceWidth: b ? Math.round(b.getBoundingClientRect().width) : null,
            priceAlign: b ? getComputedStyle(b).textAlign : null,
            priceNumeric: b ? getComputedStyle(b).fontVariantNumeric : null,
            linkDecoration: link ? getComputedStyle(link).textDecorationLine : null
          },
          laserTables: Array.prototype.map.call(document.querySelectorAll('.lp-scroll .pr-table'), function (table) {
            return Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return Math.round(th.getBoundingClientRect().width); });
          }),
          sampleNote: !!document.querySelector('.pr-sample-note'),
          aside: !!document.querySelector('.pr-side')
        };
      })()`);
      console.log('\n=== compact @' + viewport.width + ' ===');
      console.log(JSON.stringify(base, null, 2));

      if (viewport.width === 1440) {
        const active = await evalJson(launched.cdp, sessionId, `(function () {
          var h = document.querySelector('#pr-filler-head');
          var y = h.getBoundingClientRect().top + window.scrollY - (window.innerHeight * 0.42);
          window.scrollTo(0, y);
          return true;
        })()`);
        await sleep(800);
        const chip = await evalJson(launched.cdp, sessionId, `(function () {
          var a = document.querySelector('.lm-svc-tocbar a[href="#pr-filler-head"]');
          var bar = document.querySelector('.lm-svc-tocbar');
          return { active: a.classList.contains('is-active'), aria: a.getAttribute('aria-current'), barTop: Math.round(bar.getBoundingClientRect().top) };
        })()`);
        console.log('active-chip=' + JSON.stringify(chip));

        await evalJson(launched.cdp, sessionId, `(function () {
          var a = document.querySelector('#pr-botox .pr-rows a');
          var y = a.getBoundingClientRect().top + window.scrollY - (window.innerHeight * 0.5);
          window.scrollTo(0, y);
          return true;
        })()`);
        await sleep(800);
        const pt = await evalJson(launched.cdp, sessionId, `(function () {
          var a = document.querySelector('#pr-botox .pr-rows a');
          var r = a.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), top: Math.round(r.top), height: Math.round(r.height) };
        })()`);
        await launched.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y, button: 'none', buttons: 0, clickCount: 0 }, sessionId);
        await sleep(400);
        const hover = await evalJson(launched.cdp, sessionId, `(function () {
          var a = document.querySelector('#pr-botox .pr-rows a');
          var row = a.closest('li');
          return { linkDecoration: getComputedStyle(a).textDecorationLine, rowBackground: getComputedStyle(row).backgroundColor };
        })()`);
        console.log('hover-point=' + JSON.stringify(pt));
        console.log('hover=' + JSON.stringify(hover));
      }

      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
