'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

async function ev(cdp, sid, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sid);
  return res.result.value;
}

const probe = `(function () {
  var chip = document.querySelector('.nb-chip[aria-pressed="true"]');
  var option = document.querySelector('[data-doc-option][aria-selected="true"]');
  return {
    visible: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
    count: document.querySelector('[data-nb-count]').textContent + ' ' + document.querySelector('[data-nb-count-label]').textContent,
    chip: chip ? chip.textContent.trim() : null,
    option: option ? option.dataset.label : null,
    trigger: document.querySelector('.nb-doc-trigger__label').textContent.trim(),
    clearHidden: document.querySelector('.nb-clear').hidden,
    hash: location.hash
  };
})()`;

(async function () {
  const launched = await launch();
  try {
    for (const hash of ['', '#g=lip', '#doc=havasi', '#bogus']) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/gallery.html' + hash }, sessionId);
      await sleep(2200);
      console.log((hash || 'no-hash') + '=' + JSON.stringify(await ev(launched.cdp, sessionId, probe)));
      if (hash === '') {
        await ev(launched.cdp, sessionId, `document.querySelector('.nb-chip[data-filter="g:contour"]').click()`);
        await sleep(250);
        console.log('after-contour=' + JSON.stringify(await ev(launched.cdp, sessionId, probe)));
        await ev(launched.cdp, sessionId, `location.hash = '#doc=dehghani'`);
        await sleep(450);
        console.log('after-hash-doc=' + JSON.stringify(await ev(launched.cdp, sessionId, probe)));
        await ev(launched.cdp, sessionId, `location.hash = '#bogus'`);
        await sleep(450);
        console.log('after-hash-bogus=' + JSON.stringify(await ev(launched.cdp, sessionId, probe)));

        const keyboard = await ev(launched.cdp, sessionId, `(function () {
          var t = document.querySelector('.nb-doc-trigger');
          t.focus();
          t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
          var first = document.activeElement.dataset.label;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
          var end = document.activeElement.dataset.label;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
          var up = document.activeElement.dataset.label;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
          var home = document.activeElement.dataset.label;
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
          return { first: first, end: end, up: up, home: home, closed: document.querySelector('.nb-doc-popover').hidden };
        })()`);
        console.log('keyboard=' + JSON.stringify(keyboard));

        const outside = await ev(launched.cdp, sessionId, `(function () {
          var t = document.querySelector('.nb-doc-trigger');
          t.click();
          var open = !document.querySelector('.nb-doc-popover').hidden;
          document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          return { open: open, closed: document.querySelector('.nb-doc-popover').hidden, focus: document.activeElement === t };
        })()`);
        console.log('outside=' + JSON.stringify(outside));
      }
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
