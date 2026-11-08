'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');
(async function () {
  const launched = await launch();
  try {
    const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await launched.cdp.send('Page.enable', {}, sessionId);
    await launched.cdp.send('Runtime.enable', {}, sessionId);
    await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/laser.html' }, sessionId);
    await sleep(2200);
    const r = await launched.cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(function(){
        var el=document.querySelector('.faq h2');var hits=[];
        for(var i=0;i<document.styleSheets.length;i++){
          var ss=document.styleSheets[i];var rs;try{rs=ss.cssRules;}catch(e){continue;}
          (function walk(list,ctx){
            for(var j=0;j<list.length;j++){var r=list[j];
              if(r.cssRules&&r.type!==1){walk(r.cssRules,ctx+' > '+r.cssText.slice(0,30));continue;}
              if(!r.selectorText)continue;
              var m=false;try{m=el.matches(r.selectorText);}catch(e){}
              if(m)hits.push((ss.href?ss.href.split('/').pop():'inline')+' ['+ctx+'] '+r.selectorText+' {'+(r.style.textAlign?'text-align:'+r.style.textAlign+';':'')+'}');
            }
          })(rs,'root');
        }
        return {computed:getComputedStyle(el).textAlign,hits:hits};
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
