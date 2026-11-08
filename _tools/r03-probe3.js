'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
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
    const r = await launched.cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(function(){
        var g=function(s){var el=document.querySelector(s);if(!el)return null;var r=el.getBoundingClientRect();return {top:Math.round(r.top+scrollY),bottom:Math.round(r.bottom+scrollY),h:Math.round(r.height)};};
        return {sheet:g('.sheet'),bg:g('.sheet__bg'),main:g('main'),zone:g('.ft25-cta-zone'),cta:g('.ft25-cta'),footer:g('.ft25-footer'),docH:document.documentElement.scrollHeight};
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
