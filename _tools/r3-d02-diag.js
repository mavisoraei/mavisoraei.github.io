'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
const PAGE = process.argv[2] || 'laser.html';

const expr = `(function(){
  const bar=document.querySelector('.lm-svc-tocbar');
  const inn=document.querySelector('.lm-svc-tocbar__in');
  if(!bar) return {none:true};
  const r=bar.getBoundingClientRect(),ir=inn?inn.getBoundingClientRect():null;
  const s=getComputedStyle(bar),p=getComputedStyle(bar,'::before'),ins=inn?getComputedStyle(inn):null;
  const px=Math.round((r.left+r.right)/2), py=Math.round((r.top+r.bottom)/2);
  const hit=document.elementFromPoint(px,py);
  const hitLeft=document.elementFromPoint(60,py);
  function d(e){return e?e.tagName+'.'+(e.className&&String(e.className).split(' ')[0]):'null'}
  return {scrollY:Math.round(scrollY),bar:{l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height)},
    inn:ir?{l:Math.round(ir.left),r:Math.round(ir.right),t:Math.round(ir.top),h:Math.round(ir.height)}:null,
    stuck:bar.classList.contains('is-stuck'),barS:{bg:s.backgroundColor,shadow:s.boxShadow,filter:s.filter,bf:s.backdropFilter,overflow:s.overflow},
    before:{content:p.content,display:p.display,bg:p.backgroundImage,shadow:p.boxShadow,filter:p.filter,bf:p.backdropFilter,opacity:p.opacity,w:p.width,left:p.left},
    innS:ins?{shadow:ins.boxShadow,mask:ins.maskImage,overflow:ins.overflow}:null,
    hitMid:d(hit),hitLeft:d(hitLeft)};
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
    const first = res.result.value;
    console.log('AT TOP', JSON.stringify(first));
    if (first.bar) {
      const target = Math.max(0, first.bar.t + first.scrollY - 500);
      await L.cdp.send('Runtime.evaluate', { expression: `scrollTo(0,${target})`, returnByValue: true }, sessionId);
      await sleep(300);
      res = await L.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
      console.log('SCROLLED', JSON.stringify(res.result.value));
      const shot = await L.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      require('fs').writeFileSync('_tools/reports/d2-' + PAGE.replace('.html', '') + '-1440.png', Buffer.from(shot.data, 'base64'));
    }
    await L.cdp.send('Target.closeTarget', { targetId });
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
