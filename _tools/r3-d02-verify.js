'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
const fs = require('fs');
const PAGE = process.argv[2] || 'laser.html';
const TAG = PAGE.replace(/\.html$/, '');

const expr = `(function(){
  const bar=document.querySelector('.lm-svc-tocbar');
  if(!bar) return {none:true};
  const r=bar.getBoundingClientRect(),p=getComputedStyle(bar,'::before');
  return {scrollY:Math.round(scrollY),stuck:bar.classList.contains('is-stuck'),
    bar:{l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top),b:Math.round(r.bottom)},
    before:{opacity:p.opacity,visibility:p.visibility,bg:p.backgroundColor,w:p.width,bf:p.backdropFilter,shadow:p.boxShadow,border:p.borderBottomWidth}};
})()`;

(async function () {
  const L = await launch();
  try {
    const { targetId } = await L.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await L.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await L.cdp.send('Page.enable', {}, sessionId);
    await L.cdp.send('Runtime.enable', {}, sessionId);
    await L.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + PAGE }, sessionId);
    await sleep(1800);
    let res = await L.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
    const base = res.result.value;
    if (!base.bar) { console.log('NO BAR', JSON.stringify(base)); return; }
    const naturalTop = base.bar.t + base.scrollY;

    const go = async (y, name) => {
      await L.cdp.send('Runtime.evaluate', { expression: `scrollTo(0,${Math.max(0, y)})`, returnByValue: true }, sessionId);
      await sleep(900);
      const r = await L.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
      console.log(name, JSON.stringify(r.result.value));
      const shot = await L.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(`_tools/reports/d2-${TAG}-${name}.png`, Buffer.from(shot.data, 'base64'));
      return r.result.value;
    };

    await go(naturalTop - 500, 'static');
    await go(naturalTop + 200, 'stuck');
    await L.cdp.send('Target.closeTarget', { targetId });
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
