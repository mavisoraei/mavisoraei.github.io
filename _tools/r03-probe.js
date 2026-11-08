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
        function info(el){if(!el)return null;var cs=getComputedStyle(el);return {tag:el.tagName,cls:(el.className||'').toString().slice(0,50),bg:cs.backgroundColor,bgImg:cs.backgroundImage.slice(0,160),pos:cs.position,zi:cs.zIndex};}
        var zone=document.querySelector('.ft25-cta-zone');
        var cta=document.querySelector('.ft25-cta');
        var foot=document.querySelector('.ft25-footer');
        var body=document.body, html=document.documentElement;
        var main=document.querySelector('main');
        var lastMain=main?main.lastElementChild:null;
        var ctaRect=cta.getBoundingClientRect();
        var footRect=foot.getBoundingClientRect();
        var imgs=[].slice.call(document.querySelectorAll('img')).filter(function(i){return /lobby|clinic|pic\\/new/i.test(i.currentSrc||i.src);}).map(function(i){return (i.currentSrc||i.src).split('/').pop();});
        return {html:info(html),body:info(body),main:info(main),lastMain:info(lastMain),zone:info(zone),cta:info(cta),foot:info(foot),
          gap:Math.round(footRect.top-ctaRect.bottom), ctaBottom:Math.round(ctaRect.bottom), footTop:Math.round(footRect.top),
          imgs:imgs, sheetBg:info(document.querySelector('.sheet__bg'))};
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
