'use strict';
// R02 verification: FAQ question/answer start-aligned, title centred, icon intact.
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const CASES = [
  { page: 'index.html', out: '_tools/reports/r02-faq-1440.png', w: 1440, h: 1000 },
  { page: 'laser.html', out: '_tools/reports/r02-faq-laser-1440.png', w: 1440, h: 1000 },
  { page: 'index.html', out: '_tools/reports/r02-faq-390.png', w: 390, h: 844, mobile: true }
];

(async function () {
  const launched = await launch();
  try {
    for (const c of CASES) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: c.w, height: c.h, deviceScaleFactor: 1, mobile: !!c.mobile }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + c.page }, sessionId);
      await sleep(2300);
      const r = await launched.cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(function(){
          document.querySelectorAll('.reveal-s,.reveal,.reveal-r,.reveal-l').forEach(function(e){e.style.animation='none';e.style.transform='none';e.style.opacity='1';});
          var q=document.querySelector('.faq-item summary');
          var p=document.querySelector('.faq-item p');
          var h=document.querySelector('.faq h2');
          var item=document.querySelector('.faq-item');
          if(q){q.closest('.faq-item').open=true;q.scrollIntoView({block:'center'});}
          var cs=function(el,prop){return el?getComputedStyle(el)[prop]:null;};
          var af=q?getComputedStyle(q,'::after'):null;
          var content=item?getComputedStyle(item,'::details-content'):null;
          return {
            summaryAlign:cs(q,'textAlign'), answerAlign:cs(p,'textAlign'), titleAlign:cs(h,'textAlign'),
            answerMarginLeft:cs(p,'marginLeft'), answerMaxWidth:cs(p,'maxWidth'),
            plus:af?af.content:null, plusInsetEnd:af?af.insetInlineEnd:null, plusPosition:af?af.position:null,
            transition:content?content.transition:null,
            itemRadius:cs(item,'borderRadius'), itemBg:cs(item,'backgroundColor')
          };
        })()`
      }, sessionId);
      const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(path.resolve(c.out), Buffer.from(shot.data, 'base64'));
      console.log(c.page + ' @' + c.w + ' ' + JSON.stringify(r.result.value));
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
