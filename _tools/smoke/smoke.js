'use strict';

/* T00 — smoke test harness.
 *
 *   node _tools/smoke/smoke.js
 *
 * Drives headless Chrome over CDP (same approach as the responsive audit and the
 * booking-dialog checks), loads the 13 built pages at 1440x900 and 390x844 with
 * touch emulation, and records:
 *   - console errors / uncaught page errors
 *   - failed same-origin requests (status >= 400) and other failed requests
 *   - horizontal overflow (scrollWidth > innerWidth + 2, intentional horizontal
 *     scrollers exempted)
 *   - the number of visible h1 elements
 *
 * The first run writes _tools/reports/smoke-baseline.json and reports PASS
 * (pre-existing problems are tolerated). Later runs compare against that
 * baseline and fail only on NEW problems.
 */

const fs = require('fs');
const path = require('path');
const { launch, sleep } = require('../responsive-audit/lib/cdp');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORTS = path.join(ROOT, '_tools', 'reports');
const BASE = 'http://localhost:8000';
const BASELINE = path.join(REPORTS, 'smoke-baseline.json');
const LATEST_JSON = path.join(REPORTS, 'smoke-latest.json');
const LATEST_MD = path.join(REPORTS, 'smoke-latest.md');

const PAGES = [
  'index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas',
  'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis',
  'facial-fillers-2', 'mesogel-skin-boosters', 'botox'
];
const WIDTHS = [
  { width: 1440, height: 900, mobile: false },
  { width: 428, height: 926, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 360, height: 800, mobile: true }
];

function sanitise(value, max = 300) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function waitEvent(cdp, method, sessionId, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const off = cdp.on(method, (params, sid) => {
      if (sid !== sessionId || done) return;
      done = true;
      off();
      resolve({ event: true, params });
    });
    setTimeout(() => {
      if (done) return;
      done = true;
      off();
      resolve({ event: false });
    }, timeoutMs);
  });
}

async function evaluate(cdp, sessionId, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: false,
    userGesture: true
  }, sessionId);
  if (res.exceptionDetails) {
    const detail = res.exceptionDetails.exception
      ? (res.exceptionDetails.exception.description || res.exceptionDetails.exception.value)
      : res.exceptionDetails.text;
    throw new Error(sanitise(detail));
  }
  return res.result ? res.result.value : undefined;
}

const MEASURE = `(function () {
  var vw = window.innerWidth;
  var se = document.scrollingElement || document.documentElement;
  var sw = Math.max(se ? se.scrollWidth : 0, document.body ? document.body.scrollWidth : 0);
  var scrollerRe = /(carousel|marquee|slider|scroller|swiper|ticker|scroll-snap|hscroll|h-scroll|scroll-row|scroll-strip|drag-row|drag-scroll|rail)/i;

  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    if (el.closest('[hidden]')) return false;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    return true;
  }
  function inOverlay(el) {
    var node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      var pos = getComputedStyle(node).position;
      if (pos === 'fixed' || pos === 'absolute') return true;
      node = node.parentElement;
    }
    return false;
  }
  function inScroller(el) {
    var node = el.parentElement;
    var hops = 0;
    while (node && node !== document.body && node !== document.documentElement && hops < 16) {
      var s = getComputedStyle(node);
      var cls = typeof node.className === 'string' ? node.className : '';
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') return true;
      if (scrollerRe.test(cls) && (s.overflowX === 'hidden' || s.overflowX === 'clip' || s.overflowX === 'auto' || s.overflowX === 'scroll')) return true;
      node = node.parentElement;
      hops++;
    }
    return false;
  }
  function selector(el) {
    if (el.id) return '#' + el.id;
    var cls = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).filter(Boolean).slice(0, 2) : [];
    return el.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '');
  }

  var offenders = [];
  var all = document.body ? document.body.querySelectorAll('*') : [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (!visible(el) || inScroller(el)) continue;
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 2 && r.left < vw) {
      offenders.push(selector(el) + ' right=' + Math.round(r.right));
      if (offenders.length >= 8) break;
    }
  }

  /* M1: a visible text box that crosses the viewport edge is clipped copy,
     even when an ancestor's overflow hides it. Horizontal scrollers are
     exempted (their off-screen cards are intentional); everything else is
     not. */
  var textOffenders = [];
  for (var k = 0; k < all.length; k++) {
    var tel = all[k];
    if (!visible(tel) || inScroller(tel) || inOverlay(tel)) continue;
    if (tel.closest('script,style,noscript,svg')) continue;
    var textRects = [];
    var range = document.createRange();
    for (var n = 0; n < tel.childNodes.length; n++) {
      var node = tel.childNodes[n];
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      range.selectNodeContents(node);
      var rects = range.getClientRects();
      for (var q = 0; q < rects.length; q++) textRects.push(rects[q]);
    }
    for (var q2 = 0; q2 < textRects.length; q2++) {
      var tr = textRects[q2];
      if (tr.width < 1 || tr.height < 1) continue;
      if (tr.bottom <= 0 || tr.top >= innerHeight) continue;
      if (tr.right <= 0 || tr.left >= vw) continue;
      if (tr.left < -2 || tr.right > vw + 2) {
        textOffenders.push(selector(tel) + ' left=' + Math.round(tr.left) + ' right=' + Math.round(tr.right) + ' "' + node.textContent.trim().replace(/\\s+/g, ' ').slice(0, 32) + '"');
        break;
      }
    }
    if (textOffenders.length >= 8) break;
  }

  var h1s = [];
  var nodes = document.querySelectorAll('h1');
  for (var j = 0; j < nodes.length; j++) {
    if (visible(nodes[j])) h1s.push((nodes[j].textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90));
  }

  return {
    innerWidth: vw,
    scrollWidth: sw,
    overflow: sw > vw + 2,
    offenders: offenders,
    textOffenders: textOffenders,
    h1Count: h1s.length,
    h1Text: h1s.join(' | ')
  };
})()`;

function issueKeys(page, width, sample) {
  const keys = [];
  const at = page + '@' + width;
  sample.consoleErrors
    .filter((text) => !/^Failed to load resource:/i.test(text))
    .forEach((text) => keys.push('console|' + at + '|' + text));
  sample.pageErrors.forEach((text) => keys.push('pageerror|' + at + '|' + text));
  sample.failedSameOrigin.forEach((r) => keys.push('req-same|' + at + '|' + r.url + '|' + r.status));
  /* Off-site failures are reported in the table but not compared: the pages
     hotlink lemonclinic.org and a transient timeout must not fail a local run. */
  if (sample.overflow) {
    if (sample.offenders.length) {
      sample.offenders.forEach((o) => keys.push('overflow|' + at + '|' + o));
    } else {
      keys.push('overflow|' + at + '|scrollWidth ' + sample.scrollWidth);
    }
  }
  (sample.textOffenders || []).forEach((o) => keys.push('textclip|' + at + '|' + o));
  if (sample.h1Count !== 1) keys.push('h1|' + at + '|count ' + sample.h1Count);
  return keys;
}

async function runSample(cdp, page, viewport) {
  const url = BASE + '/' + page + '.html';
  const sample = {
    page,
    width: viewport.width,
    consoleErrors: [],
    pageErrors: [],
    failedSameOrigin: [],
    failedOther: [],
    overflow: false,
    scrollWidth: 0,
    innerWidth: viewport.width,
    offenders: [],
    textOffenders: [],
    h1Count: 0,
    h1Text: ''
  };

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const cleanups = [];
  const seenConsole = new Set();
  const seenPage = new Set();
  const seenFail = new Set();
  const requestUrls = new Map();

  try {
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    try { await cdp.send('Log.enable', {}, sessionId); } catch (err) { /* optional */ }

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile
    }, sessionId);
    if (viewport.mobile) {
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
    }

    cleanups.push(cdp.on('Runtime.consoleAPICalled', (params, sid) => {
      if (sid !== sessionId || params.type !== 'error') return;
      const text = sanitise(params.args.map((a) => a.value != null ? a.value : (a.description || a.type)).join(' '));
      if (text && !seenConsole.has(text)) { seenConsole.add(text); sample.consoleErrors.push(text); }
    }));
    cleanups.push(cdp.on('Runtime.exceptionThrown', (params, sid) => {
      if (sid !== sessionId) return;
      const d = params.exceptionDetails;
      const text = sanitise(d.exception ? (d.exception.description || d.exception.value) : d.text);
      if (text && !seenPage.has(text)) { seenPage.add(text); sample.pageErrors.push(text); }
    }));
    cleanups.push(cdp.on('Log.entryAdded', (params, sid) => {
      if (sid !== sessionId || !params.entry || params.entry.level !== 'error') return;
      const text = sanitise(params.entry.text);
      if (text && !seenConsole.has(text)) { seenConsole.add(text); sample.consoleErrors.push(text); }
    }));
    cleanups.push(cdp.on('Network.requestWillBeSent', (params, sid) => {
      if (sid !== sessionId) return;
      requestUrls.set(params.requestId, params.request.url);
    }));
    cleanups.push(cdp.on('Network.responseReceived', (params, sid) => {
      if (sid !== sessionId) return;
      const res = params.response;
      if (res.status < 400) return;
      const key = res.url + '|' + res.status;
      if (seenFail.has(key)) return;
      seenFail.add(key);
      const item = { url: sanitise(res.url, 240), status: res.status };
      if (res.url.indexOf(BASE + '/') === 0) sample.failedSameOrigin.push(item);
      else sample.failedOther.push({ url: item.url, error: 'HTTP ' + res.status });
    }));
    cleanups.push(cdp.on('Network.loadingFailed', (params, sid) => {
      if (sid !== sessionId || params.canceled) return;
      const url = requestUrls.get(params.requestId) || '(unknown)';
      const key = url + '|' + params.errorText;
      if (seenFail.has(key)) return;
      seenFail.add(key);
      const item = { url: sanitise(url, 240), error: sanitise(params.errorText, 120) };
      if (url.indexOf(BASE + '/') === 0) sample.failedSameOrigin.push(item);
      else sample.failedOther.push(item);
    }));

    const loaded = waitEvent(cdp, 'Page.loadEventFired', sessionId, 20000);
    await cdp.send('Page.navigate', { url }, sessionId);
    await loaded;
    await sleep(1400);

    /* M1: the home intro is a real first-paint layer. Wait for it to lift
       (max ~4.3s total) before measuring, so the hero is the visible page. */
    if (page === 'index') {
      for (let i = 0; i < 15; i++) {
        const gone = await evaluate(cdp, sessionId, "!document.getElementById('intro')");
        if (gone) break;
        await sleep(200);
      }
      await sleep(300);
    }

    const measured = await evaluate(cdp, sessionId, MEASURE);
    Object.assign(sample, measured);
  } catch (err) {
    sample.pageErrors.push('smoke harness: ' + sanitise(err.message));
  } finally {
    cleanups.forEach((off) => { try { off(); } catch (err) {} });
    try { await cdp.send('Target.closeTarget', { targetId }); } catch (err) {}
  }
  return sample;
}

function renderMarkdown(run, comparisons, newIssues) {
  const lines = [];
  lines.push('# Smoke test — latest run');
  lines.push('');
  lines.push('- Date: ' + run.createdAt);
  lines.push('- Pages: ' + PAGES.length + ' × ' + WIDTHS.length + ' viewports (1440×900, 390×844 touch)');
  lines.push('- Baseline: ' + (run.baselineUsed ? '`smoke-baseline.json`' : 'created on this run'));
  lines.push('- Result: **' + (newIssues.length ? 'SMOKE FAIL ' + newIssues.length : 'SMOKE PASS') + '**');
  lines.push('');
  lines.push('| Page | Width | Console | Page errors | Failed same-origin | Failed other | Overflow | H1 | New issues |');
  lines.push('|---|---:|---:|---:|---:|---:|---|---:|---:|');
  run.samples.forEach((s) => {
    const cmp = comparisons[s.page + '@' + s.width] || { newCount: 0 };
    lines.push('| ' + s.page + ' | ' + s.width + ' | ' + s.consoleErrors.length + ' | ' +
      s.pageErrors.length + ' | ' + s.failedSameOrigin.length + ' | ' + s.failedOther.length + ' | ' +
      (s.overflow ? 'yes' + (s.offenders.length ? ' (' + s.offenders.join('; ') + ')' : '') : 'no') + ' | ' +
      s.h1Count + ' | ' + cmp.newCount + ' |');
  });
  lines.push('');
  if (newIssues.length) {
    lines.push('## New issues');
    lines.push('');
    newIssues.forEach((issue) => lines.push('- `' + issue + '`'));
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

async function main() {
  fs.mkdirSync(REPORTS, { recursive: true });
  const launched = await launch();
  const run = {
    createdAt: new Date().toISOString(),
    baselineUsed: fs.existsSync(BASELINE),
    samples: []
  };
  let baseline = null;
  if (run.baselineUsed) {
    try { baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch (err) { baseline = null; }
  }

  try {
    for (const page of PAGES) {
      for (const viewport of WIDTHS) {
        process.stdout.write('smoke ' + page + '@' + viewport.width + ' ... ');
        const sample = await runSample(launched.cdp, page, viewport);
        run.samples.push(sample);
        console.log(sample.consoleErrors.length + ' console, ' + sample.pageErrors.length + ' page, ' +
          sample.failedSameOrigin.length + '/' + sample.failedOther.length + ' failed, ' +
          (sample.overflow ? 'overflow' : 'no overflow') + ', textclip=' + (sample.textOffenders.length) + ', h1=' + sample.h1Count);
      }
    }
  } finally {
    await launched.cleanup();
  }

  const baselineKeys = new Set();
  if (baseline && Array.isArray(baseline.samples)) {
    baseline.samples.forEach((s) => issueKeys(s.page, s.width, s).forEach((k) => baselineKeys.add(k)));
  }

  const comparisons = {};
  const newIssues = [];
  run.samples.forEach((s) => {
    const at = s.page + '@' + s.width;
    const keys = issueKeys(s.page, s.width, s);
    const fresh = run.baselineUsed ? keys.filter((k) => !baselineKeys.has(k)) : [];
    comparisons[at] = { newCount: fresh.length };
    fresh.forEach((k) => newIssues.push(k));
  });

  const result = {
    createdAt: run.createdAt,
    baselineUsed: run.baselineUsed,
    pass: newIssues.length === 0,
    newIssues,
    samples: run.samples
  };
  fs.writeFileSync(LATEST_JSON, JSON.stringify(result, null, 2) + '\n', 'utf8');
  fs.writeFileSync(LATEST_MD, renderMarkdown(run, comparisons, newIssues), 'utf8');

  if (!run.baselineUsed) {
    fs.writeFileSync(BASELINE, JSON.stringify(result, null, 2) + '\n', 'utf8');
    console.log('\nBaseline saved to _tools/reports/smoke-baseline.json');
  }

  console.log('\n' + (newIssues.length ? 'SMOKE FAIL ' + newIssues.length : 'SMOKE PASS'));
  if (newIssues.length) newIssues.forEach((issue) => console.log('  NEW: ' + issue));
}

main().catch((err) => {
  console.error('SMOKE FAIL harness: ' + (err && err.stack ? err.stack : err));
  process.exitCode = 1;
});
