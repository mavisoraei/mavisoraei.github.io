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
    const out = await evalJson(launched.cdp, sessionId, `(function(){
      function info(el, label){
        if(!el) return {label:label, missing:true};
        var b=el.getBoundingClientRect();var s=getComputedStyle(el);
        return {label:label,tag:el.tagName,cls:String(el.className),top:Math.round(b.top),bottom:Math.round(b.bottom),height:Math.round(b.height),marginTop:s.marginTop,marginBottom:s.marginBottom,paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,position:s.position,overflow:s.overflow,transform:s.transform,display:s.display};
      }
      var cta=document.querySelector('.ft25-cta-zone');
      var chain=[];var p=cta;while(p&&chain.length<8){chain.push(p.tagName+'.'+String(p.className));p=p.parentElement;}
      var faq=document.querySelector('.faq');
      var sheet=document.querySelector('.sheet');
      var content=document.querySelector('.sheet__content');
      var main=document.querySelector('main');
      return {
        chain:chain,
        faq:info(faq,'faq'),
        cta:info(cta,'cta'),
        card:info(document.querySelector('.ft25-cta'),'card'),
        footer:info(document.querySelector('.ft25-footer'),'footer'),
        sheet:info(sheet,'sheet'),
        sheetContent:info(content,'sheetContent'),
        main:info(main,'main'),
        body:info(document.body,'body'),
        mainChildren: main?Array.prototype.map.call(main.children,function(el){return info(el,el.tagName+'.'+String(el.className).slice(0,40));}):[]
      };
    })()`);
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) { console.error(err && err.stack ? err.stack : err); process.exit(1); });
