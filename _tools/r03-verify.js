'use strict';
// R03 verification: CTA-to-footer gap on 5 pages, seamless home background pixel check.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { launch, sleep } = require('./responsive-audit/lib/cdp');

function decodePng(buf) {
  // minimal 8-bit truecolour (RGB/RGBA) PNG reader
  let pos = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      cur[i] = v & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { w, h, bpp, data: out };
}
function avg(buf, bpp) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < buf.length; i += bpp) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; n++; }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

const PAGES = ['index', 'laser', 'facial', 'prices', 'doctors'];

(async function () {
  const launched = await launch();
  try {
    for (const p of PAGES) {
      for (const vp of (p === 'index' ? [{ w: 1440, h: 1000, mobile: false, tag: '1440' }, { w: 390, h: 844, mobile: true, tag: '390' }] : [{ w: 1440, h: 1000, mobile: false, tag: '1440' }])) {
        const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
        await launched.cdp.send('Page.enable', {}, sessionId);
        await launched.cdp.send('Runtime.enable', {}, sessionId);
        await launched.cdp.send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile }, sessionId);
        await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + p + '.html' }, sessionId);
        await sleep(2400);
        const info = await launched.cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(function(){
            var zone=document.querySelector('.ft25-cta-zone');
            var cta=document.querySelector('.ft25-cta'),foot=document.querySelector('.ft25-footer');
            var cr=cta.getBoundingClientRect(),fr=foot.getBoundingClientRect(),zr=zone.getBoundingClientRect();
            return {gap:Math.round(fr.top-cr.bottom), zoneBg:getComputedStyle(zone).backgroundColor,
              ctaBottomPage:Math.round(cr.bottom+scrollY), zoneTopPage:Math.round(zr.top+scrollY), footTopPage:Math.round(fr.top+scrollY)};
          })()`
        }, sessionId);
        await sleep(600);
        const v = info.result.value;
        let px = null;
        if (p === 'index') {
          const clipAt = async (x, y) => {
            const c = { x: Math.round(x), y: Math.round(y), width: 4, height: 4, scale: 1 };
            const s = await launched.cdp.send('Page.captureScreenshot', { format: 'png', clip: c, captureBeyondViewport: true }, sessionId);
            const im = decodePng(Buffer.from(s.data, 'base64'));
            return avg(im.data, im.bpp);
          };
          const zTop = v.zoneTopPage, x = vp.w > 500 ? 200 : 12;
          px = {
            above: await clipAt(x, zTop - 4),
            inTop: await clipAt(x, zTop + 12),
            mid: await clipAt(x, zTop + 60),
            belowCard: await clipAt(x, v.ctaBottomPage + 40),
            nearFooter: await clipAt(x, v.footTopPage - 12)
          };
        }
        console.log(p + ' @' + vp.tag + ' gap=' + v.gap + ' zoneBg=' + v.zoneBg + (px ? ' px=' + JSON.stringify(px) : ''));
        if (p === 'index') {
          const shot = await launched.cdp.send('Page.captureScreenshot', {
            format: 'png', captureBeyondViewport: true,
            clip: { x: 0, y: v.zoneTopPage - 60, width: vp.w, height: Math.min(vp.h, 420), scale: 1 }
          }, sessionId);
          fs.writeFileSync(path.resolve('_tools/reports/r03-junction-' + vp.tag + '.png'), Buffer.from(shot.data, 'base64'));
        }
        await launched.cdp.send('Target.closeTarget', { targetId });
      }
    }
  } finally { await launched.cleanup(); }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
