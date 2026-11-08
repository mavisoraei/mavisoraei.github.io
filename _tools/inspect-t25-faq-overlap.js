'use strict';
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
    const result = await evalJson(launched.cdp, sessionId, `(function(){
      function rr(el){var b=el.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),height:Math.round(b.height)};}
      var f=document.querySelector('.ft25-footer');
      var fy=f.getBoundingClientRect().top+window.scrollY-Math.max(0,innerHeight-f.offsetHeight-24);
      if(window.__lenis&&typeof window.__lenis.scrollTo==='function')window.__lenis.scrollTo(fy,{immediate:true});else window.scrollTo(0,fy);
      return {fy:Math.round(fy)};
    })()`);
    await sleep(5000);
    const out = await evalJson(launched.cdp, sessionId, `(function(){
      function rr(el){var b=el.getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),right:Math.round(b.right),height:Math.round(b.height)};}
      var faq=document.querySelector('.faq');
      var items=Array.prototype.map.call(document.querySelectorAll('.faq-item'),function(el){return {top:rr(el).top,bottom:rr(el).bottom,open:el.open,summary:el.querySelector('summary')?el.querySelector('summary').textContent.trim():''};});
      var card=document.querySelector('.ft25-cta');
      var cta=document.querySelector('.ft25-cta-zone');
      var hit=document.elementsFromPoint(800,240).slice(0,6).map(function(el){return {tag:el.tagName,cls:String(el.className).slice(0,70)};});
      return {scrollY:Math.round(window.scrollY),faq:rr(faq),cta:rr(cta),card:rr(card),footer:rr(document.querySelector('.ft25-footer')),items:items,hit:hit,faqParent:faq.parentElement?faq.parentElement.tagName+'.'+faq.parentElement.className:null};
    })()`);
    console.log(JSON.stringify(result));
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
