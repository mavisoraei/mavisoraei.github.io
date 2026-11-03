'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const URL = 'http://localhost:8000/prices.html';
const VIEWPORTS = [
  { width: 1440, height: 1000, mobile: false },
  { width: 390, height: 844, mobile: true }
];

function probe() {
  return `(function () {
    document.querySelectorAll('.reveal-s, .reveal, .reveal-r, .reveal-l').forEach(function (el) {
      el.style.animation = 'none';
      el.style.transform = 'none';
      el.style.opacity = '1';
    });
    function rect(el) {
      var r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), top: Math.round(r.top), height: Math.round(r.height) };
    }
    var hero = document.querySelector('.pr-hero');
    var lead = hero.querySelector('.lead');
    var leadStyle = getComputedStyle(lead);
    var leadRect = lead.getBoundingClientRect();
    var grid = document.querySelector('.pr-grid--single');
    var cards = Array.prototype.map.call(document.querySelectorAll('.pr-block'), function (card) {
      var r = rect(card);
      var style = getComputedStyle(card);
      return {
        id: card.id || '(dose)',
        width: r.width,
        padding: style.padding,
        radius: style.borderRadius,
        background: style.backgroundImage,
        h2: card.querySelector('h2') ? card.querySelector('h2').textContent.trim().slice(0, 40) : '',
        h2Id: card.querySelector('h2') ? card.querySelector('h2').id : ''
      };
    });
    var rowPriceWidths = Array.from(new Set(Array.prototype.map.call(document.querySelectorAll('.pr-rows li > b'), function (b) {
      return Math.round(b.getBoundingClientRect().width);
    })));
    var listPriceWidths = Array.from(new Set(Array.prototype.map.call(document.querySelectorAll('.pr-price'), function (b) {
      return Math.round(b.getBoundingClientRect().width);
    })));
    var firstLink = document.querySelector('.pr-rows a');
    var firstLinkStyle = firstLink ? getComputedStyle(firstLink) : null;
    var firstRowStyle = document.querySelector('.pr-rows li') ? getComputedStyle(document.querySelector('.pr-rows li')) : null;
    var laserTables = Array.prototype.map.call(document.querySelectorAll('.lp-scroll .pr-table'), function (table) {
      return Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) {
        return Math.round(th.getBoundingClientRect().width);
      });
    });
    var benefits = Array.prototype.map.call(document.querySelectorAll('.pr-benefit'), function (card) {
      return {
        title: card.querySelector('.pr-benefit__title') ? card.querySelector('.pr-benefit__title').textContent.trim() : '',
        sentence: card.querySelector('p') ? card.querySelector('p').textContent.trim() : '',
        link: card.querySelector('.pr-benefit__link') ? card.querySelector('.pr-benefit__link').getAttribute('href') : '',
        linkText: card.querySelector('.pr-benefit__link') ? card.querySelector('.pr-benefit__link').textContent.trim() : '',
        width: rect(card).width
      };
    });
    var tocbar = document.querySelector('.lm-svc-tocbar');
    var chips = Array.prototype.map.call(document.querySelectorAll('.lm-svc-tocbar a'), function (a) {
      return { short: a.getAttribute('data-short'), href: a.getAttribute('href'), text: a.textContent.trim() };
    });
    return {
      h1: document.querySelectorAll('h1').length,
      hero: {
        h1: hero.querySelector('h1').textContent.trim(),
        updated: hero.querySelector('.pr-updated') ? hero.querySelector('.pr-updated').textContent.trim() : '',
        lead: lead.textContent.trim(),
        leadWidth: Math.round(leadRect.width),
        leadHeight: Math.round(leadRect.height),
        leadLineHeight: parseFloat(leadStyle.lineHeight),
        leadLines: Math.round(leadRect.height / parseFloat(leadStyle.lineHeight)),
        top: rect(hero).top
      },
      benefits: benefits,
      benefitColumns: getComputedStyle(document.querySelector('.pr-benefits__grid')).gridTemplateColumns,
      tocbar: tocbar ? {
        position: getComputedStyle(tocbar).position,
        top: rect(tocbar).top,
        chips: chips
      } : null,
      grid: { width: rect(grid).width, left: rect(grid).left, right: rect(grid).right },
      cards: cards,
      cardCount: cards.length,
      rows: {
        priceWidths: rowPriceWidths,
        listPriceWidths: listPriceWidths,
        gridTemplate: firstRowStyle ? firstRowStyle.gridTemplateColumns : null,
        linkDecoration: firstLinkStyle ? firstLinkStyle.textDecorationLine : null,
        priceAlign: document.querySelector('.pr-rows b') ? getComputedStyle(document.querySelector('.pr-rows b')).textAlign : null,
        priceNumeric: document.querySelector('.pr-rows b') ? getComputedStyle(document.querySelector('.pr-rows b')).fontVariantNumeric : null
      },
      laserTables: laserTables,
      cta: (function () {
        var cta = document.querySelector('.pr-note');
        var links = Array.prototype.map.call(cta.querySelectorAll('a'), function (a) {
          return { text: a.textContent.trim(), href: a.getAttribute('href'), cls: a.className };
        });
        return { width: rect(cta).width, links: links, h2: cta.querySelector('h2') ? cta.querySelector('h2').textContent.trim() : '' };
      })(),
      sampleNote: document.querySelector('.pr-sample-note') ? document.querySelector('.pr-sample-note').textContent.trim() : '',
      aside: !!document.querySelector('.pr-side'),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  })()`;
}

(async function () {
  const launched = await launch();
  try {
    for (const viewport of VIEWPORTS) {
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
      await launched.cdp.send('Page.navigate', { url: URL }, sessionId);
      await sleep(2500);

      const base = await launched.cdp.send('Runtime.evaluate', { expression: probe(), returnByValue: true }, sessionId);
      console.log('\n=== prices @' + viewport.width + ' ===');
      console.log(JSON.stringify(base.result.value, null, 2));

      if (viewport.width === 1440) {
        /* Active chip: put the Fillers H2 inside the observer's middle band. */
        await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            var h = document.querySelector('#pr-filler-head');
            var y = h.getBoundingClientRect().top + window.scrollY - (window.innerHeight * 0.42);
            window.scrollTo(0, y);
          })()`
        }, sessionId);
        await sleep(700);
        const active = await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            var a = document.querySelector('.lm-svc-tocbar a[href="#pr-filler-head"]');
            var bar = document.querySelector('.lm-svc-tocbar');
            return { active: a.classList.contains('is-active'), aria: a.getAttribute('aria-current'), barTop: Math.round(bar.getBoundingClientRect().top) };
          })()`,
          returnByValue: true
        }, sessionId);
        console.log('active-chip=' + JSON.stringify(active.result.value));

        /* Hover a linked row: row background and link underline. */
        await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            var a = document.querySelector('#pr-botox .pr-rows a');
            a.scrollIntoView({ block: 'center' });
          })()`
        }, sessionId);
        await sleep(500);
        const linkRect = await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            var a = document.querySelector('#pr-botox .pr-rows a');
            var r = a.getBoundingClientRect();
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
          })()`,
          returnByValue: true
        }, sessionId);
        await launched.cdp.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: linkRect.result.value.x,
          y: linkRect.result.value.y
        }, sessionId);
        await sleep(250);
        const hover = await launched.cdp.send('Runtime.evaluate', {
          expression: `(function () {
            var a = document.querySelector('#pr-botox .pr-rows a');
            var row = a.closest('li');
            return {
              linkDecoration: getComputedStyle(a).textDecorationLine,
              rowBackground: getComputedStyle(row).backgroundColor
            };
          })()`,
          returnByValue: true
        }, sessionId);
        console.log('hover=' + JSON.stringify(hover.result.value));
      }

      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
