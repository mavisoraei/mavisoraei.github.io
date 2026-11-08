'use strict';
// R01 verification: hover card CTA + pill CTA, assert no underline; confirm body links keep it.
const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const CASES = [
  { page: 'index.html', sel: '.case-treat', out: '_tools/reports/r01-case-cta-1440.png', w: 1440, h: 1000 },
  { page: 'prices.html', sel: '.pr-benefit__link', out: '_tools/reports/r01-pill-cta-1440.png', w: 1440, h: 1000 },
  { page: 'index.html', sel: '.case-treat', out: '_tools/reports/r01-case-cta-390.png', w: 390, h: 844, mobile: true }
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
      const pos = await launched.cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(function(){
          document.querySelectorAll('.reveal-s,.reveal,.reveal-r,.reveal-l').forEach(function(e){e.style.animation='none';e.style.transform='none';e.style.opacity='1';});
          var el=document.querySelector('${c.sel}');
          el.scrollIntoView({block:'center'});
          var r=el.getBoundingClientRect();
          var inline=document.querySelector('main p a');
          return {x:r.left+r.width/2,y:r.top+r.height/2,inline:inline?getComputedStyle(inline).textDecorationLine:null};
        })()`
      }, sessionId);
      const v = pos.result.value;
      await launched.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: v.x, y: v.y, button: 'none' }, sessionId);
      await sleep(500);
      const st = await launched.cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(function(){
          var el=document.querySelector('${c.sel}');var cs=getComputedStyle(el);
          var af=getComputedStyle(el,'::after');
          return {decoration:cs.textDecorationLine,borderBottom:cs.borderBottomWidth+' '+cs.borderBottomStyle,bg:cs.backgroundImage.slice(0,60),after:af.content+'|'+af.height+'|'+af.width};
        })()`
      }, sessionId);
      const shot = await launched.cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      fs.writeFileSync(path.resolve(c.out), Buffer.from(shot.data, 'base64'));
      console.log(c.page + ' ' + c.sel + ' @' + c.w + ' hover=' + JSON.stringify(st.result.value) + ' inlineLinkRest=' + v.inline);
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
