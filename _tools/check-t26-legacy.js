'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/gallery_new.html' }, sessionId);
    await sleep(2500);
    const res = await launched.cdp.send('Runtime.evaluate', {
      expression: `(function () {
        var c = document.querySelector('.nb-chip[data-filter="doc:havasi"]');
        var before = document.querySelectorAll('.nb-card:not(.is-hidden)').length;
        c.click();
        return {
          before: before,
          after: document.querySelectorAll('.nb-card:not(.is-hidden)').length,
          pressed: c.getAttribute('aria-pressed'),
          avatars: document.querySelectorAll('.nb-doc-info .nb-ava').length,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      })()`,
      returnByValue: true
    }, sessionId);
    console.log(JSON.stringify(res.result.value));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
