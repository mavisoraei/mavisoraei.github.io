'use strict';
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function evalJson(cdp, sessionId, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  return res.result.value;
}

function baseProbe() {
  return `(function () {
    function r(el) { var b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; }
    var panel = document.querySelector('.nb-filters');
    var wrap = document.querySelector('.nb-wrap');
    var hero = document.querySelector('.pg-hero');
    var work = document.querySelector('.nb-filter-row--work');
    var doctor = document.querySelector('.nb-filter-row--doctor');
    var labels = Array.prototype.map.call(document.querySelectorAll('.nb-flabel'), r);
    var chips = Array.prototype.map.call(document.querySelectorAll('.nb-chip'), function (el) {
      var b = el.getBoundingClientRect();
      return { text: el.textContent.trim(), left: Math.round(b.left), width: Math.round(b.width), height: Math.round(b.height), top: Math.round(b.top), pressed: el.getAttribute('aria-pressed') };
    });
    var trigger = document.querySelector('.nb-doc-trigger');
    var side = document.querySelector('.nb-filter-side');
    var result = document.querySelector('.nb-result');
    var clear = document.querySelector('.nb-clear');
    var count = document.querySelector('[data-nb-count]');
    var countLabel = document.querySelector('[data-nb-count-label]');
    var popover = document.querySelector('.nb-doc-popover');
    var options = Array.prototype.map.call(document.querySelectorAll('[data-doc-option]'), function (el) {
      var av = el.querySelector('.nb-avatar');
      return { label: el.dataset.label, selected: el.getAttribute('aria-selected'), hasImg: !!el.querySelector('img'), initials: av ? av.dataset.initials : '' };
    });
    var scroll = document.querySelector('.nb-chip-scroll');
    var grid = document.querySelector('.nb-grid');
    var style = getComputedStyle(panel);
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      h1: document.querySelectorAll('h1').length,
      panel: r(panel),
      wrap: r(wrap),
      hero: r(hero),
      grid: r(grid),
      panelStyle: { radius: style.borderRadius, background: style.backgroundImage, border: style.borderTopWidth, z: style.zIndex },
      work: r(work),
      doctor: r(doctor),
      labels: labels,
      chips: chips,
      chipHeights: Array.from(new Set(chips.map(function (c) { return c.height; }))),
      chipTops: Array.from(new Set(chips.map(function (c) { return c.top; }))),
      chipScroll: { clientWidth: scroll.clientWidth, scrollWidth: scroll.scrollWidth, mask: getComputedStyle(scroll).maskImage || getComputedStyle(scroll).webkitMaskImage },
      trigger: { text: trigger.textContent.trim().replace(/\\s+/g, ' '), rect: r(trigger), expanded: trigger.getAttribute('aria-expanded') },
      side: r(side),
      result: { text: result.textContent.trim().replace(/\\s+/g, ' '), count: count ? count.textContent : '', label: countLabel ? countLabel.textContent : '' },
      clear: { hidden: clear.hidden, text: clear.textContent.trim() },
      popover: { hidden: popover.hidden },
      options: options,
      visibleCards: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
      activeChip: document.querySelector('.nb-chip[aria-pressed="true"]') ? document.querySelector('.nb-chip[aria-pressed="true"]').textContent.trim() : null,
      activeOption: document.querySelector('[data-doc-option][aria-selected="true"]') ? document.querySelector('[data-doc-option][aria-selected="true"]').dataset.label : null
    };
  })()`;
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
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/gallery.html' }, sessionId);
      await sleep(3000);

      console.log('\\n=== gallery after @' + viewport.width + ' ===');
      console.log(JSON.stringify(await evalJson(launched.cdp, sessionId, baseProbe()), null, 2));

      if (viewport.width === 1440) {
        await evalJson(launched.cdp, sessionId, `document.querySelector('.nb-chip[data-filter="g:lip"]').click()`);
        await sleep(350);
        console.log('after-lip=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `(function () {
          return {
            visible: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
            count: document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent,
            clear: !document.querySelector('.nb-clear').hidden,
            activeChip: document.querySelector('.nb-chip[aria-pressed="true"]').textContent.trim(),
            trigger: document.querySelector('.nb-doc-trigger__label').textContent.trim(),
            hash: location.hash
          };
        })()`)));

        await evalJson(launched.cdp, sessionId, `document.querySelector('.nb-doc-trigger').click()`);
        await sleep(250);
        console.log('popover-open=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `(function () {
          var p = document.querySelector('.nb-doc-popover');
          return {
            hidden: p.hidden,
            expanded: document.querySelector('.nb-doc-trigger').getAttribute('aria-expanded'),
            options: Array.prototype.map.call(document.querySelectorAll('[data-doc-option]'), function (el) { return { label: el.dataset.label, selected: el.getAttribute('aria-selected'), hasImg: !!el.querySelector('img'), initials: el.querySelector('.nb-avatar').dataset.initials }; }),
            active: document.activeElement ? document.activeElement.dataset.label : null,
            rect: (function () { var b = p.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; })()
          };
        })()`)));

        const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
        fs.writeFileSync(path.resolve('_tools/reports/t26-popover-1440.png'), Buffer.from(shot.data, 'base64'));

        await evalJson(launched.cdp, sessionId, `document.querySelector('[data-filter="doc:havasi"]').click()`);
        await sleep(350);
        console.log('after-doctor=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `(function () {
          return {
            visible: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
            count: document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent,
            clear: !document.querySelector('.nb-clear').hidden,
            trigger: document.querySelector('.nb-doc-trigger__label').textContent.trim(),
            triggerAvatar: document.querySelector('[data-doc-avatar]').dataset.initials || 'img',
            activeChip: document.querySelector('.nb-chip[aria-pressed="true"]') ? document.querySelector('.nb-chip[aria-pressed="true"]').textContent.trim() : null,
            activeOption: document.querySelector('[data-doc-option][aria-selected="true"]').dataset.label,
            hash: location.hash
          };
        })()`)));

        await evalJson(launched.cdp, sessionId, `document.querySelector('.nb-clear').click()`);
        await sleep(350);
        console.log('after-clear=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `(function () {
          return {
            visible: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
            count: document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent,
            clearHidden: document.querySelector('.nb-clear').hidden,
            trigger: document.querySelector('.nb-doc-trigger__label').textContent.trim(),
            activeChip: document.querySelector('.nb-chip[aria-pressed="true"]').textContent.trim(),
            activeOption: document.querySelector('[data-doc-option][aria-selected="true"]').dataset.label,
            hash: location.hash
          };
        })()`)));

        /* Keyboard: ArrowDown opens, ArrowDown moves, Escape closes and restores focus. */
        const keyboard = await evalJson(launched.cdp, sessionId, `(function () {
          var t = document.querySelector('.nb-doc-trigger');
          t.focus();
          t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
          var opened = !document.querySelector('.nb-doc-popover').hidden;
          var first = document.activeElement ? document.activeElement.dataset.label : null;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
          var second = document.activeElement ? document.activeElement.dataset.label : null;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          return { opened: opened, first: first, second: second, closed: document.querySelector('.nb-doc-popover').hidden, focus: document.activeElement === t };
        })()`);
        console.log('keyboard=' + JSON.stringify(keyboard));

        /* Missing-photo fallback: force one option image to fail and check the initials show. */
        const fallback = await evalJson(launched.cdp, sessionId, `(function () {
          var option = document.querySelector('[data-filter="doc:dehghani"]');
          var avatar = option.querySelector('.nb-avatar');
          var img = avatar.querySelector('img');
          if (img) img.src = 'http://localhost:8000/does-not-exist-t26.webp';
          return { initials: avatar.dataset.initials, before: !!avatar.querySelector('img') };
        })()`);
        await sleep(700);
        const fallbackAfter = await evalJson(launched.cdp, sessionId, `(function () {
          var option = document.querySelector('[data-filter="doc:dehghani"]');
          var avatar = option.querySelector('.nb-avatar');
          return { img: !!avatar.querySelector('img'), initials: avatar.dataset.initials, content: getComputedStyle(avatar, '::before').content };
        })()`);
        console.log('fallback=' + JSON.stringify(fallback) + ' -> ' + JSON.stringify(fallbackAfter));
      }

      const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(path.resolve('_tools/reports/t26-after-' + viewport.width + '.png'), Buffer.from(shot.data, 'base64'));
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
