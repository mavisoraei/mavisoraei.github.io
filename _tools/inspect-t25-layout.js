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
    await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' }, sessionId);
    await sleep(2500);
    await evalJson(launched.cdp, sessionId, "document.querySelector('.ft25-cta-zone').scrollIntoView({ block: 'center' })");
    await sleep(1000);
    const result = await evalJson(launched.cdp, sessionId, `(function () {
      function r(sel) {
        var el = document.querySelector(sel);
        if (!el) return null;
        var b = el.getBoundingClientRect();
        var s = getComputedStyle(el);
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), height: Math.round(b.height), position: s.position, z: s.zIndex, marginTop: s.marginTop, marginBottom: s.marginBottom, transform: s.transform };
      }
      var faq = document.querySelector('.faq');
      var first = document.querySelector('.faq-item');
      var cta = document.querySelector('.ft25-cta-zone');
      var card = document.querySelector('.ft25-cta');
      var footer = document.querySelector('.ft25-footer');
      var logo = document.querySelector('.ft25-logo');
      var fr = first ? first.getBoundingClientRect() : null;
      var hit = fr ? document.elementFromPoint(Math.round(fr.left + fr.width / 2), Math.round(fr.top + 20)) : null;
      return {
        scrollY: Math.round(scrollY),
        faq: r('.faq'),
        faqItem: r('.faq-item'),
        cta: r('.ft25-cta-zone'),
        card: r('.ft25-cta'),
        footer: r('.ft25-footer'),
        main: r('main'),
        lastMainChild: (function () { var m = document.querySelector('main'); var c = m && m.lastElementChild; if (!c) return null; var b = c.getBoundingClientRect(); return { tag: c.tagName, cls: c.className, top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height) }; })(),
        hitAtFaqTop: hit ? { tag: hit.tagName, cls: hit.className } : null,
        logo: { naturalWidth: logo.naturalWidth, complete: logo.complete, currentSrc: logo.currentSrc },
        footerImages: Array.prototype.map.call(document.querySelectorAll('.ft25-footer img, .ft25-cta img'), function (img) { return { src: img.getAttribute('src'), complete: img.complete, w: img.naturalWidth, h: img.naturalHeight }; })
      };
    })()`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
