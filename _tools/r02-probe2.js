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
        var ss=document.styleSheets[0];
        var counts={}, samples={};
        function walk(list){for(var j=0;j<list.length;j++){var r=list[j];
          if(r.cssRules&&r.type!==1){walk(r.cssRules);continue;}
          var s=r.selectorText||'';
          ['faq','ft25','btn','case-treat','pr-benefit'].forEach(function(k){if(s.indexOf(k)>=0){counts[k]=(counts[k]||0)+1;if(!samples[k])samples[k]=s;}});
        }}
        walk(ss.cssRules);
        return {counts:counts,samples:samples,last:Array.from(ss.cssRules).slice(-3).map(function(r){return r.cssText.slice(0,80);})};
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
