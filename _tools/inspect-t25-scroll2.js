'use strict';
const fs = require('fs');
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
    await sleep(6000);
    console.log('before=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `({scrollY: window.scrollY, lenis: !!window.__lenis, bodyClass: document.body.className, max: document.documentElement.scrollHeight - innerHeight})`)));
    await evalJson(launched.cdp, sessionId, "document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, 12000);");
    await sleep(3000);
    console.log('after=' + JSON.stringify(await evalJson(launched.cdp, sessionId, `(function(){
      function r(sel){var el=document.querySelector(sel);if(!el)return null;var b=el.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),height:Math.round(b.height)};}
      return {scrollY:Math.round(window.scrollY), max:document.documentElement.scrollHeight-innerHeight, faq:r('.faq'), lastFaq:r('.faq-item:last-of-type'), cta:r('.ft25-cta-zone'), card:r('.ft25-cta'), footer:r('.ft25-footer'), hitCard: (function(){var b=document.querySelector('.ft25-cta').getBoundingClientRect();var el=document.elementFromPoint(Math.round(b.left+b.width/2), Math.round(b.top+30));return el?{tag:el.tagName,cls:String(el.className)}:null;})()};
    })()`)));
    const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync('_tools/reports/t25-scroll-1440b.png', Buffer.from(shot.data, 'base64'));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
