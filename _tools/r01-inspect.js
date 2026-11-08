'use strict';
// R01 inspection: find anchors that gain an underline/border/line on hover.
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const PAGES = ['index.html', 'laser.html', 'facial.html', 'doctors.html', 'prices.html', 'gallery.html'];

const PROPS = [
  'textDecorationLine', 'textDecorationStyle', 'textDecorationColor',
  'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor',
  'backgroundImage', 'boxShadow'
];

(async function () {
  const launched = await launch();
  try {
    for (const page of PAGES) {
      const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await launched.cdp.send('Page.enable', {}, sessionId);
      await launched.cdp.send('Runtime.enable', {}, sessionId);
      await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
      await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + page }, sessionId);
      await sleep(2200);
      await launched.cdp.send('Runtime.evaluate', {
        expression: `document.querySelectorAll('.reveal-s,.reveal,.reveal-r,.reveal-l').forEach(function(e){e.style.animation='none';e.style.transform='none';e.style.opacity='1';});`
      }, sessionId);

      const listRes = await launched.cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(function(){
          var out=[];
          var anchors=document.querySelectorAll('a[href], button');
          for(var i=0;i<anchors.length;i++){
            var a=anchors[i];
            var r=a.getBoundingClientRect();
            if(r.width<8||r.height<8) continue;
            out.push({i:i, tag:a.tagName, cls:(a.className&&a.className.baseVal!==undefined?a.className.baseVal:String(a.className||'')).slice(0,90), txt:(a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,42)});
          }
          return out;
        })()`
      }, sessionId);
      const anchors = listRes.result.value;

      const rows = [];
      for (const a of anchors) {
        const before = await launched.cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(function(){
            var els=document.querySelectorAll('a[href], button');var el=els[${a.i}];
            el.scrollIntoView({block:'center'});
            var cs=getComputedStyle(el);var af=getComputedStyle(el,'::after');
            var o={};${JSON.stringify(PROPS)}.forEach(function(p){o[p]=cs[p];});
            o.afterContent=af.content;o.afterHeight=af.height;o.afterWidth=af.width;o.afterBg=af.backgroundImage;o.afterTransform=af.transform;o.afterPosition=af.position;
            return o;
          })()`
        }, sessionId);
        await sleep(40);
        const rectRes = await launched.cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(function(){var els=document.querySelectorAll('a[href], button');var r=els[${a.i}].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`
        }, sessionId);
        const pt = rectRes.result.value;
        await launched.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y, button: 'none' }, sessionId);
        await sleep(450);
        const after = await launched.cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(function(){
            var els=document.querySelectorAll('a[href], button');var el=els[${a.i}];
            var cs=getComputedStyle(el);var af=getComputedStyle(el,'::after');
            var o={};${JSON.stringify(PROPS)}.forEach(function(p){o[p]=cs[p];});
            o.afterContent=af.content;o.afterHeight=af.height;o.afterWidth=af.width;o.afterBg=af.backgroundImage;o.afterTransform=af.transform;o.afterPosition=af.position;
            return o;
          })()`
        }, sessionId);
        const b = before.result.value, f = after.result.value;
        const diff = {};
        for (const k of Object.keys(b)) {
          if (b[k] !== f[k]) diff[k] = [b[k], f[k]];
        }
        // keep only real underline/line gains
        const sig = [];
        if (diff.textDecorationLine && diff.textDecorationLine[1].includes('underline') && !diff.textDecorationLine[0].includes('underline')) sig.push('textDecorationLine');
        if (diff.borderBottomWidth && parseFloat(diff.borderBottomWidth[1]) > 0 && parseFloat(diff.borderBottomWidth[0]) === 0) sig.push('borderBottomWidth');
        if (diff.backgroundImage && /gradient/.test(diff.backgroundImage[1]) && diff.backgroundImage[0] !== diff.backgroundImage[1]) sig.push('backgroundImage');
        if (diff.afterContent && diff.afterContent[0] !== diff.afterContent[1]) sig.push('afterContent');
        if (diff.afterHeight && diff.afterHeight[0] !== diff.afterHeight[1]) sig.push('afterHeight');
        if (diff.afterWidth && diff.afterWidth[0] !== diff.afterWidth[1]) sig.push('afterWidth');
        if (diff.afterBg && diff.afterBg[0] !== diff.afterBg[1] && diff.afterBg[1] !== 'none') sig.push('afterBg');
        if (sig.length) {
          const d = {}; sig.forEach(k => d[k] = diff[k]);
          rows.push({ cls: a.cls, txt: a.txt, sig: sig, diff: d });
        }
        await launched.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2, button: 'none' }, sessionId);
      }
      console.log('\n=== ' + page + ' ===');
      for (const r of rows) console.log(JSON.stringify(r));
      await launched.cdp.send('Target.closeTarget', { targetId });
    }
  } finally {
    await launched.cleanup();
  }
})().catch(e => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
