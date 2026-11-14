'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const expr = `(function(){
  const boxes=[...document.querySelectorAll('.spread-photo')].map(function(e){
    const r=e.getBoundingClientRect(),s=getComputedStyle(e),img=e.querySelector('img'),is=getComputedStyle(img);
    return {w:+r.width.toFixed(1),h:+r.height.toFixed(1),l:Math.round(r.left),r:Math.round(r.right),ratio:+(r.width/r.height).toFixed(3),
      shadow:s.boxShadow,transform:s.transform,aspect:s.aspectRatio,
      fit:is.objectFit,pos:is.objectPosition};
  });
  return {vw:innerWidth,canHover:matchMedia('(hover: hover) and (pointer: fine)').matches,
    reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,boxes:boxes};
})()`;

async function attach(L, width, height, mobile) {
  const { targetId } = await L.cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await L.cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await L.cdp.send('Page.enable', {}, sessionId);
  await L.cdp.send('Runtime.enable', {}, sessionId);
  await L.cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }, sessionId);
  if (mobile) await L.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
  return { targetId, sessionId };
}

async function read(L, sessionId) {
  const r = await L.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
  return r.result.value;
}

(async function () {
  const L = await launch();
  try {
    // Desktop: rest + hover + leave.
    let { targetId, sessionId } = await attach(L, 1440, 900, false);
    await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/doctors.html' }, sessionId);
    await sleep(1800);
    let data = await read(L, sessionId);
    console.log('1440 rest', JSON.stringify(data));
    const b = data.boxes[0];
    const scrollY = await L.cdp.send('Runtime.evaluate', { expression: "document.querySelector('.spread-photo').getBoundingClientRect().top+scrollY-200", returnByValue: true }, sessionId);
    await L.cdp.send('Runtime.evaluate', { expression: `scrollTo(0,${scrollY.result.value})`, returnByValue: true }, sessionId);
    await sleep(300);
    const r = await L.cdp.send('Runtime.evaluate', { expression: "document.querySelector('.spread-photo').getBoundingClientRect().toJSON()", returnByValue: true }, sessionId);
    const box = r.result.value;
    await L.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + box.width * 0.75, y: box.y + box.height * 0.3 }, sessionId);
    await sleep(350);
    let hover = await L.cdp.send('Runtime.evaluate', { expression: "getComputedStyle(document.querySelector('.spread-photo')).transform", returnByValue: true }, sessionId);
    console.log('1440 hover transform', hover.result.value);
    await L.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 }, sessionId);
    await sleep(700);
    let leave = await L.cdp.send('Runtime.evaluate', { expression: "getComputedStyle(document.querySelector('.spread-photo')).transform", returnByValue: true }, sessionId);
    console.log('1440 after leave', leave.result.value);
    await L.cdp.send('Target.closeTarget', { targetId });

    // Phone: touch emulation.
    ({ targetId, sessionId } = await attach(L, 390, 844, true));
    await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/doctors.html' }, sessionId);
    await sleep(1800);
    data = await read(L, sessionId);
    console.log('390 touch', JSON.stringify(data));
    await L.cdp.send('Target.closeTarget', { targetId });

    // Desktop with reduced motion.
    ({ targetId, sessionId } = await attach(L, 1440, 900, false));
    await L.cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    await L.cdp.send('Page.navigate', { url: 'http://localhost:8000/doctors.html' }, sessionId);
    await sleep(1800);
    const rr = await L.cdp.send('Runtime.evaluate', { expression: "document.querySelector('.spread-photo').getBoundingClientRect().toJSON()", returnByValue: true }, sessionId);
    const rb = rr.result.value;
    await L.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rb.x + rb.width * 0.75, y: rb.y + 40 }, sessionId);
    await sleep(350);
    let rm = await L.cdp.send('Runtime.evaluate', { expression: "getComputedStyle(document.querySelector('.spread-photo')).transform", returnByValue: true }, sessionId);
    console.log('1440 reduced-motion hover', rm.result.value);
    await L.cdp.send('Target.closeTarget', { targetId });
  } finally { await L.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
