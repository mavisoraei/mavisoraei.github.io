'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const collect = `(function(){
  function vis(e){const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0&&e.getClientRects().length>0;}
  const bad=[];const all=[...document.querySelectorAll('body *')];
  for(const e of all){
    if(!vis(e))continue;
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    if(e.closest('script,style,noscript,svg'))continue;
    const r=e.getBoundingClientRect();
    if(r.width<1||r.height<1)continue;
    if(r.left<-0.5||r.right>innerWidth+0.5)bad.push({tag:e.tagName.toLowerCase(),cls:(e.className&&String(e.className).split(' ').slice(0,2).join('.'))||'',t:e.textContent.trim().replace(/\\s+/g,' ').slice(0,40),l:+r.left.toFixed(1),r:+r.right.toFixed(1)});
  }
  const h=document.querySelector('.lm-hero-v2__title');
  const e=document.querySelector('.lm-hero-v2__eyebrow');
  const hb=h.getBoundingClientRect(),eb=e.getBoundingClientRect(),hs=getComputedStyle(h),es=getComputedStyle(e);
  return {vw:innerWidth,scrollW:document.documentElement.scrollWidth,
    h1:{fs:hs.fontSize,lh:hs.lineHeight,l:Math.round(hb.left),r:Math.round(hb.right),w:Math.round(hb.width),h:Math.round(hb.height),ws:hs.whiteSpace},
    eyebrow:{fs:es.fontSize,ws:es.whiteSpace,l:Math.round(eb.left),r:Math.round(eb.right),w:Math.round(eb.width),h:Math.round(eb.height)},
    badCount:bad.length,bad:bad.slice(0,14)};
})()`;

(async function () {
  const L = await launch();
  try {
    for (const width of [390, 360]) {
      const { targetId } = await L.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await L.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await L.cdp.send('Page.enable', {}, sessionId);
      await L.cdp.send('Runtime.enable', {}, sessionId);
      await L.cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
      await L.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
      await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' }, sessionId);
      let removedAt = null;
      const t0 = Date.now();
      for (let i = 0; i < 40; i++) {
        await sleep(200);
        const r = await L.cdp.send('Runtime.evaluate', { expression: "!!document.getElementById('intro')", returnByValue: true }, sessionId);
        if (!r.result.value) { removedAt = (Date.now() - t0) / 1000; break; }
      }
      await sleep(2500);
      const res = await L.cdp.send('Runtime.evaluate', { expression: collect, returnByValue: true }, sessionId);
      console.log(width, 'introRemovedAt', removedAt, JSON.stringify(res.result.value));
      await L.cdp.send('Target.closeTarget', { targetId });
    }
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
