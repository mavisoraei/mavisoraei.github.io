'use strict';
const { launch, sleep } = require('./responsive-audit/lib/cdp');

const PAGES = ['laser.html', 'facial.html'];
const VIEWPORTS = [
  { width: 1440, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true }
];

function expression() {
  return `(function () {
    document.querySelectorAll('.reveal-s, .reveal, .reveal-r, .reveal-l').forEach(function (el) {
      el.style.animation = 'none';
      el.style.transform = 'none';
      el.style.opacity = '1';
    });
    var main = document.querySelector('main');
    var body = document.querySelector('.svc-body');
    var mainRect = main ? main.getBoundingClientRect() : { left: 0, right: 0, width: 0 };
    var bodyRect = body ? body.getBoundingClientRect() : { left: 0, right: 0, width: 0 };
    var sections = Array.prototype.map.call(document.querySelectorAll('.svc-sec'), function (sec, i) {
      var label = sec.querySelector('.svc-sec__label');
      var content = sec.querySelector('.svc-sec__content');
      var h2 = sec.querySelector('h2');
      var children = content ? Array.prototype.slice.call(content.children) : [];
      var textBlocks = children.filter(function (el) {
        return el.tagName !== 'FIGURE' && el.tagName !== 'TABLE' && !el.classList.contains('svc-wide');
      });
      var wideBlocks = children.filter(function (el) {
        return el.tagName === 'TABLE' || (el.tagName === 'FIGURE' && !el.classList.contains('portrait')) || el.classList.contains('svc-wide');
      });
      var lefts = textBlocks.map(function (el) { return Math.round(el.getBoundingClientRect().left); });
      var rights = textBlocks.map(function (el) { return Math.round(el.getBoundingClientRect().right); });
      var secRect = sec.getBoundingClientRect();
      var labelRect = label ? label.getBoundingClientRect() : null;
      return {
        i: i,
        h2: h2 ? h2.textContent.trim().slice(0, 42) : '(intro)',
        display: getComputedStyle(sec).display,
        secLeft: Math.round(secRect.left),
        secRight: Math.round(secRect.right),
        labelLeft: labelRect ? Math.round(labelRect.left) : null,
        labelWidth: labelRect ? Math.round(labelRect.width) : null,
        textLefts: Array.from(new Set(lefts)),
        textRightMax: rights.length ? Math.max.apply(null, rights) : null,
        wide: wideBlocks.map(function (el) {
          var r = el.getBoundingClientRect();
          return { tag: el.tagName, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
        })
      };
    });
    return {
      main: { left: Math.round(mainRect.left), right: Math.round(mainRect.right), width: Math.round(mainRect.width) },
      body: { left: Math.round(bodyRect.left), right: Math.round(bodyRect.right), width: Math.round(bodyRect.width) },
      sections: sections
    };
  })()`;
}

(async function () {
  const launched = await launch();
  try {
    for (const page of PAGES) {
      for (const viewport of VIEWPORTS) {
        const { targetId } = await launched.cdp.send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await launched.cdp.send('Target.attachToTarget', { targetId, flatten: true });
        await launched.cdp.send('Page.enable', {}, sessionId);
        await launched.cdp.send('Runtime.enable', {}, sessionId);
        await launched.cdp.send('Emulation.setDeviceMetricsOverride', {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
          mobile: viewport.mobile
        }, sessionId);
        await launched.cdp.send('Page.navigate', { url: 'http://localhost:8000/' + page }, sessionId);
        await sleep(2500);
        const res = await launched.cdp.send('Runtime.evaluate', {
          expression: expression(),
          returnByValue: true
        }, sessionId);
        console.log('\n=== ' + page + ' @' + viewport.width + ' ===');
        console.log(JSON.stringify(res.result.value, null, 2));
        await launched.cdp.send('Target.closeTarget', { targetId });
      }
    }
  } finally {
    await launched.cleanup();
  }
})().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
