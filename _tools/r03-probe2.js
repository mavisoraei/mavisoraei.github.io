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
        var cta=document.querySelector('.ft25-cta');
        var r=cta.getBoundingClientRect();
        window.scrollTo(0, Math.max(0, r.top+window.scrollY-300));
        var zone=document.querySelector('.ft25-cta-zone');
        var out=[];
        function chain(el){var a=[];while(el&&el!==document.documentElement){var cs=getComputedStyle(el);
          a.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,40),bg:cs.backgroundColor,bgImg:cs.backgroundImage.slice(0,100),pos:cs.position,zi:cs.zIndex});el=el.parentElement;}return a;}
        var bg=document.querySelector('.sheet__bg');
        var bcs=getComputedStyle(bg);
        return {chain:chain(zone), sheetBg:{pos:bcs.position,top:bcs.top,height:bcs.height,width:bcs.width,bg:bcs.backgroundImage.slice(0,300)},
          pseudoBefore:getComputedStyle(document.body,'::before').backgroundImage.slice(0,120),
          pseudoAfter:getComputedStyle(document.body,'::after').backgroundImage.slice(0,120),
          archPhoto:(function(){var p=document.querySelector('#arch-intro-photo');if(!p)return null;var c=getComputedStyle(p);return {pos:c.position,zi:c.zIndex,img:p.querySelector('img')?(p.querySelector('img').currentSrc||'').split('/').pop():null};})()};
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
