'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function evalJson(cdp, sessionId, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  return res.result.value;
}

function probe() {
  return `(function () {
    function r(el) {
      if (!el) return null;
      var b = el.getBoundingClientRect();
      return { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), bottom: Math.round(b.bottom), width: Math.round(b.width), height: Math.round(b.height) };
    }
    function cs(el) { return getComputedStyle(el); }
    var footer = document.querySelector('.ft25-footer');
    var cta = document.querySelector('.ft25-cta');
    var grid = document.querySelector('.ft25-grid');
    var brand = document.querySelector('.ft25-brand');
    var desc = document.querySelector('.ft25-desc');
    var social = document.querySelector('.ft25-social a');
    var logo = document.querySelector('.ft25-logo');
    var title = document.querySelector('.ft25-title');
    var firstLink = document.querySelector('.ft25-links a');
    var contactIcon = document.querySelector('.ft25-contact-item svg');
    var contactItem = document.querySelector('.ft25-contact-item');
    var ctaButtons = Array.prototype.map.call(document.querySelectorAll('.ft25-cta-actions a'), function (el) {
      return { text: el.textContent.trim(), href: el.getAttribute('href'), rect: r(el), cls: el.className };
    });
    var cols = Array.prototype.map.call(document.querySelectorAll('.ft25-col'), function (el) {
      return { open: el.open, rect: r(el), title: el.querySelector('.ft25-title').textContent.trim() };
    });
    var descLines = 0;
    if (desc && desc.firstChild) {
      var range = document.createRange();
      range.selectNodeContents(desc);
      descLines = range.getClientRects().length;
    }
    var gridStyle = cs(grid);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      h1: document.querySelectorAll('h1').length,
      footer: r(footer),
      footerBg: cs(footer).backgroundColor,
      cta: r(cta),
      ctaBg: cs(cta).backgroundImage,
      ctaRadius: cs(cta).borderRadius,
      ctaAboveFooter: !!(cta && footer && cta.getBoundingClientRect().bottom <= footer.getBoundingClientRect().top + 1),
      ctaGrid: cs(cta).gridTemplateColumns,
      ctaButtons: ctaButtons,
      mascot: r(document.querySelector('.ft25-cta-mascot')),
      grid: r(grid),
      gridCols: gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
      gridGap: gridStyle.columnGap + ' / ' + gridStyle.rowGap,
      brand: r(brand),
      logoCount: document.querySelectorAll('.ft25-logo').length,
      logoRect: r(logo),
      logoNatural: logo ? { w: logo.naturalWidth, h: logo.naturalHeight } : null,
      desc: r(desc),
      descColor: cs(desc).color,
      descFont: cs(desc).fontSize,
      descLine: cs(desc).lineHeight,
      descLines: descLines,
      descChars: desc ? desc.textContent.replace(/\s+/g, ' ').trim().length : 0,
      social: r(social),
      socialRadius: cs(social).borderRadius,
      title: {
        text: title ? title.textContent.trim() : '',
        color: cs(title).color,
        font: cs(title).fontSize,
        family: cs(title).fontFamily,
        weight: cs(title).fontWeight,
        spacing: cs(title).letterSpacing,
        transform: cs(title).textTransform
      },
      link: {
        color: cs(firstLink).color,
        font: cs(firstLink).fontSize,
        weight: cs(firstLink).fontWeight,
        line: cs(firstLink).lineHeight,
        count: document.querySelectorAll('.ft25-links a').length
      },
      contactIcon: r(contactIcon),
      contactItem: { color: cs(contactItem).color, font: cs(contactItem).fontSize, weight: cs(contactItem).fontWeight },
      cols: cols,
      openCount: cols.filter(function (c) { return c.open; }).length,
      oldBlocks: {
        top: document.querySelectorAll('.f-top').length,
        mascot: document.querySelectorAll('.f-mascot').length,
        trust: document.querySelectorAll('.f-trust').length
      },
      bottom: {
        text: document.querySelector('.ft25-copy') ? document.querySelector('.ft25-copy').textContent.replace(/\s+/g, ' ').trim() : '',
        year: document.querySelector('.ft25-copy [data-year]') ? document.querySelector('.ft25-copy [data-year]').textContent : '',
        lang: document.querySelector('.ft25-lang') ? document.querySelector('.ft25-lang').textContent : '',
        privacy: document.querySelector('.ft25-legal a') ? document.querySelector('.ft25-legal a').getAttribute('href') : '',
        hasLicence: /licen[cs]e/i.test(document.querySelector('.ft25-bar').textContent)
      }
    };
  })()`;
}

async function shot(cdp, sessionId, file) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync(path.join(__dirname, 'reports', file), Buffer.from(result.data, 'base64'));
  console.log('screenshot=' + file);
}

(async function () {
  const launched = await launch();
  try {
    for (const viewport of [
      { width: 1440, height: 1000, mobile: false },
      { width: 1280, height: 900, mobile: false },
      { width: 1024, height: 900, mobile: false },
      { width: 768, height: 900, mobile: false },
      { width: 390, height: 844, mobile: true }
    ]) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile
      }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' }, sessionId);
      await sleep(5000);

      console.log('\n=== T25 index @' + viewport.width + ' ===');
      console.log(JSON.stringify(await evalJson(launched.cdp, sessionId, probe())));

      if (viewport.width === 390) {
        await evalJson(launched.cdp, sessionId, "document.querySelectorAll('.ft25-title')[0].click()");
        await sleep(150);
        console.log('mobile after first click=' + JSON.stringify(await evalJson(launched.cdp, sessionId, "Array.prototype.map.call(document.querySelectorAll('.ft25-col'), function (el) { return el.open; })")));
        await evalJson(launched.cdp, sessionId, "document.querySelectorAll('.ft25-title')[1].click()");
        await sleep(150);
        console.log('mobile after second click=' + JSON.stringify(await evalJson(launched.cdp, sessionId, "Array.prototype.map.call(document.querySelectorAll('.ft25-col'), function (el) { return el.open; })")));
      } else {
        await evalJson(launched.cdp, sessionId, "document.querySelectorAll('.ft25-title')[0].click()");
        await sleep(150);
        console.log('desktop after summary click=' + JSON.stringify(await evalJson(launched.cdp, sessionId, "Array.prototype.map.call(document.querySelectorAll('.ft25-col'), function (el) { return el.open; })")));
      }

      await evalJson(launched.cdp, sessionId, "Array.prototype.forEach.call(document.querySelectorAll('.ft25-col'), function (el) { el.open = " + (viewport.width < 641 ? 'false' : 'true') + "; }); var y = document.documentElement.scrollHeight; if (window.__lenis && typeof window.__lenis.scrollTo === 'function') window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);");
      await sleep(4000);
      await shot(launched.cdp, sessionId, 't25-footer-' + viewport.width + '.png');
      await evalJson(launched.cdp, sessionId, "var c = document.querySelector('.ft25-cta-zone'); var cy = c.getBoundingClientRect().top + window.scrollY - 120; if (window.__lenis && typeof window.__lenis.scrollTo === 'function') window.__lenis.scrollTo(cy, { immediate: true }); else window.scrollTo(0, cy);");
      await sleep(4000);
      await shot(launched.cdp, sessionId, 't25-cta-' + viewport.width + '.png');
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });

