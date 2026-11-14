'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const expr = `(function(){
  const map=document.querySelector('.hl-map--placeholder');
  if(!map) return {none:true};
  const copy=map.parentElement.querySelector('.hl-copy');
  const lead=copy?copy.querySelector('.hl-lead'):null;
  const actions=copy?copy.querySelector('.hl-actions'):null;
  const f=map.querySelector('.hl-map-frame');
  const r=map.getBoundingClientRect(),c=copy.getBoundingClientRect(),l=lead.getBoundingClientRect(),a=actions.getBoundingClientRect();
  return {vw:innerWidth,map:{t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height),l:Math.round(r.left),r:Math.round(r.right),radius:getComputedStyle(map).borderRadius},
    copy:{t:Math.round(c.top),b:Math.round(c.bottom),h:Math.round(c.height),l:Math.round(c.left),r:Math.round(c.right)},
    leadTop:Math.round(l.top),actionsBottom:Math.round(a.bottom),
    topDelta:Math.round(l.top-r.top),bottomDelta:Math.round(r.bottom-a.bottom),colGap:Math.round(r.left-c.right),
    frame:f?{src:f.getAttribute('src'),loading:f.getAttribute('loading'),ref:f.getAttribute('referrerpolicy'),title:f.getAttribute('title'),pe:getComputedStyle(f)['pointer-events'],radius:getComputedStyle(f).borderRadius}:null};
})()`;

(async function () {
  const L = await launch();
  try {
    for (const page of ['index.html', 'contact.html']) {
      for (const vp of [{ width: 1440, height: 900, mobile: false }, { width: 390, height: 844, mobile: true }]) {
        const { targetId } = await L.cdp.send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await L.cdp.send('Target.attachToTarget', { targetId, flatten: true });
        await L.cdp.send('Page.enable', {}, sessionId);
        await L.cdp.send('Runtime.enable', {}, sessionId);
        await L.cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile }, sessionId);
        if (vp.mobile) await L.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
        await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + page }, sessionId);
        await sleep(1800);
        const res = await L.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
        console.log(page, vp.width, JSON.stringify(res.result.value));
        await L.cdp.send('Target.closeTarget', { targetId });
      }
    }
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
