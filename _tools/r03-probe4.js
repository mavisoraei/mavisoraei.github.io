'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
const PAGES = ['index', 'laser', 'facial', 'prices', 'doctors'];
(async function () {
  const launched = await launch();
  try {
    for (const p of PAGES) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + p + '.html' }, sessionId);
      await sleep(2300);
      const r = await launched.cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(function(){
          var g=function(s){var el=document.querySelector(s);if(!el)return null;var r=el.getBoundingClientRect();return {top:Math.round(r.top+scrollY),bottom:Math.round(r.bottom+scrollY),h:Math.round(r.height)};};
          var cs=function(s,prop){var el=document.querySelector(s);return el?getComputedStyle(el)[prop]:null;};
          var zone=g('.ft25-cta-zone'),cta=g('.ft25-cta'),foot=g('.ft25-footer');
          var before=document.querySelector('.ft25-cta-zone')?document.querySelector('.ft25-cta-zone').previousElementSibling:null;
          return {page:'${p}', bodyBg:cs('body','backgroundColor'), htmlBg:cs('html','backgroundColor'),
            bodyClass:document.body.className.slice(0,60),
            zone:zone,cta:cta,foot:foot,gap:foot&&cta?Math.round(foot.top-cta.bottom):null,
            prevTag:before?before.tagName+'.'+before.className.slice(0,30):null,
            prevBg:before?getComputedStyle(before).backgroundColor:null,
            zoneBg:cs('.ft25-cta-zone','backgroundColor'), zonePadEnd:cs('.ft25-cta-zone','paddingBottom')};
        })()`
      }, sessionId);
      console.log(JSON.stringify(r.result.value));
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
