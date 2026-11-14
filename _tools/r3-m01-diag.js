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
    if(r.left<-0.5||r.right>innerWidth+0.5)bad.push({tag:e.tagName.toLowerCase(),cls:(e.className&&String(e.className).split(' ').slice(0,2).join('.'))||'',t:e.textContent.trim().replace(/\\s+/g,' ').slice(0,45),l:+r.left.toFixed(1),r:+r.right.toFixed(1),w:+r.width.toFixed(1)});
  }
  const h=document.querySelector('.lm-hero-v2__title');
  const h1=document.querySelector('h1');
  const intro=document.getElementById('intro');
  const iris=intro?getComputedStyle(intro):null;
  return {vw:innerWidth,ih:innerHeight,body:document.body.className,
    intro:{exists:!!intro,display:iris?iris.display:null,opacity:iris?iris.opacity:null,visibility:iris?iris.visibility:null,pe:iris?iris.pointerEvents:null},
    html:document.documentElement.className,
    h1:{text:h1?h1.textContent.trim().slice(0,40):null,fs:h1?getComputedStyle(h1).fontSize:null,rect:h1?h1.getBoundingClientRect().toJSON():null},
    heroTitle:{fs:h?getComputedStyle(h).fontSize:null,rect:h?h.getBoundingClientRect().toJSON():null},
    eyebrow:(function(){const e=document.querySelector('.lm-hero-v2__eyebrow');if(!e)return null;const r=e.getBoundingClientRect();return {fs:getComputedStyle(e).fontSize,l:+r.left.toFixed(1),r:+r.right.toFixed(1),w:+r.width.toFixed(1)}})(),
    badCount:bad.length,bad:bad.slice(0,20),scrollW:document.documentElement.scrollWidth};
})()`;

(async function () {
  const L = await launch();
  try {
    const { targetId } = await L.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await L.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await L.cdp.send('Page.enable', {}, sessionId);
    await L.cdp.send('Runtime.enable', {}, sessionId);
    await L.cdp.send('Emulation.setDeviceMetricsOverride', { width: 428, height: 926, deviceScaleFactor: 1, mobile: true }, sessionId);
    await L.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
    const t0 = Date.now();
    await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/index.html' }, sessionId);
    for (const wait of [600, 2000, 2500, 2000]) {
      await sleep(wait);
      const r = await L.cdp.send('Runtime.evaluate', { expression: collect, returnByValue: true }, sessionId);
      console.log('t=' + ((Date.now() - t0) / 1000).toFixed(2), JSON.stringify(r.result.value));
    }
    await L.cdp.send('Target.closeTarget', { targetId });
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
