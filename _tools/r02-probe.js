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
        var el=document.querySelector('.faq h2');
        var out={tag:el.tagName, cls:el.className, matches:el.matches('.faq h2'), closest:!!el.closest('.faq'), inline:el.getAttribute('style'), computed:getComputedStyle(el).textAlign, parentAlign:getComputedStyle(el.parentElement).textAlign, sheets:[], rules:[]};
        for(var i=0;i<document.styleSheets.length;i++){
          var ss=document.styleSheets[i];var rs;
          out.sheets.push((ss.href?ss.href.split('/').pop():'inline')+':'+(ss.disabled?'disabled':'on'));
          try{rs=ss.cssRules;}catch(e){out.sheets.push('THROW:'+e.message);continue;}
          out.sheets.push('rules='+rs.length);
          (function walk(list,sheet){
            for(var j=0;j<list.length;j++){
              var rule=list[j];
              if(rule.cssRules){walk(rule.cssRules,sheet);continue;}
              if(!rule.selectorText) continue;
              if(/faq/.test(rule.selectorText)) out.rules.push(sheet+': '+rule.cssText.slice(0,180));
            }
          })(rs, ss.href?ss.href.split('/').pop():'inline');
        }
        return out;
      })()`
    }, sessionId);
    console.log(JSON.stringify(r.result.value, null, 2));
    await launched.cdp.send('Target.closeTarget', { targetId });
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
