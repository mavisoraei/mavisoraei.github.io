'use strict';

/* Responsive audit harness for the local Lemon mirror.
 *
 *   node _tools/responsive-audit/audit.js
 *   node _tools/responsive-audit/audit.js --pages index,laser,facial
 *   node _tools/responsive-audit/audit.js --pages index --widths 360,390
 *
 * Zero dependencies. Drives the installed Chrome/Edge over the DevTools
 * protocol (same CDP approach as the booking-dialog checks), measures each
 * page at each width in a real layout engine, writes a Markdown report and
 * PNG screenshots. It never writes outside _tools/responsive-audit/ and never
 * touches site files. Only http://localhost:8000 is audited.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');
const { launch, sleep } = require('./lib/cdp');
const { probe } = require('./lib/probe');
const { renderReport } = require('./lib/report');

const ROOT = path.resolve(__dirname, '..', '..');
const TOOL_DIR = __dirname;
const BASE = 'http://localhost:8000';
const VIEWPORT_HEIGHT = 900;
const MAX_SHOT_HEIGHT = 10000;

const DEFAULT_PAGES = [
  'index',
  'laser',
  'facial',
  'services',
  'doctors',
  'blog',
  'areas',
  'gallery',
  'gallery_new',
  'prices',
  'contact',
  'ai-analysis',
  'face-analysis'
];
const DEFAULT_WIDTHS = [360, 390, 768, 1024, 1440];
const DEFAULT_SHOT_WIDTHS = [390, 1440];

function parseArgs(argv) {
  const options = {
    pages: DEFAULT_PAGES.slice(),
    widths: DEFAULT_WIDTHS.slice(),
    shotWidths: DEFAULT_SHOT_WIDTHS.slice(),
    outDir: TOOL_DIR,
    shotsDir: path.join(TOOL_DIR, 'shots'),
    startServer: true,
    json: path.join(TOOL_DIR, 'last-run.json')
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (!value) throw new Error(arg + ' needs a value');
      return value;
    };
    if (arg === '--pages') {
      options.pages = next().split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
    } else if (arg === '--widths') {
      options.widths = next().split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    } else if (arg === '--shot-widths') {
      options.shotWidths = next().split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    } else if (arg === '--out') {
      options.outDir = path.resolve(next());
    } else if (arg === '--shots') {
      options.shotsDir = path.resolve(next());
    } else if (arg === '--json') {
      options.json = path.resolve(next());
    } else if (arg === '--no-server') {
      options.startServer = false;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error('Unknown argument: ' + arg);
    }
  }

  const validPage = /^[a-z0-9][a-z0-9._-]*$/i;
  for (const page of options.pages) {
    if (!validPage.test(page)) {
      throw new Error('Invalid page name "' + page + '". Use local page names such as index or laser, not URLs.');
    }
  }
  if (!options.widths.length) throw new Error('No valid widths');
  if (!options.pages.length) throw new Error('No valid pages');
  return options;
}

function printHelp() {
  console.log([
    'Responsive audit — Lemon local mirror (http://localhost:8000 only)',
    '',
    'Usage:',
    '  node _tools/responsive-audit/audit.js [options]',
    '',
    'Options:',
    '  --pages a,b,c       Pages to audit (default: the 13 built pages)',
    '  --widths 360,390    Viewport widths (default: 360,390,768,1024,1440)',
    '  --shot-widths 390,1440  Widths that also get full-page PNGs',
    '  --out DIR           Report directory (default: _tools/responsive-audit)',
    '  --shots DIR         Screenshot directory (default: .../shots)',
    '  --json FILE         Raw data output (default: .../last-run.json)',
    '  --no-server         Do not auto-start server.js if port 8000 is down',
    '  -h, --help          Show this help',
    '',
    'The server must be node server.js on http://localhost:8000.'
  ].join('\n'));
}

function request(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
  });
}

async function ensureServer(enabled) {
  try {
    const status = await request(BASE + '/index.html');
    if (status === 200 || status === 304) return { started: false, child: null };
  } catch (err) {
    // down: fall through
  }

  if (!enabled) {
    throw new Error('Nothing is answering on ' + BASE + '. Start `node server.js` first, or drop --no-server.');
  }

  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const status = await request(BASE + '/index.html', 1000);
      if (status === 200 || status === 304) return { started: true, child };
    } catch (err) {
      /* keep waiting */
    }
    await sleep(300);
  }

  stopServer(child);
  throw new Error('server.js did not come up on ' + BASE + ' within 15s.');
}

function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  } else {
    try { child.kill('SIGTERM'); } catch (err) { /* noop */ }
  }
}

function pageUrl(page) {
  return BASE + '/' + page + '.html';
}

function sanitiseConsoleText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

async function evaluate(cdp, sessionId, expression, opts = {}) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: Boolean(opts.awaitPromise),
    userGesture: true
  }, sessionId);
  if (res.exceptionDetails) {
    const detail = res.exceptionDetails.exception
      ? (res.exceptionDetails.exception.description || res.exceptionDetails.exception.value)
      : res.exceptionDetails.text;
    throw new Error('In-page evaluation failed: ' + sanitiseConsoleText(detail));
  }
  return res.result ? res.result.value : undefined;
}

function waitForEvent(cdp, method, sessionId, timeoutMs) {
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

async function waitFor(cdp, sessionId, expression, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(cdp, sessionId, expression)) return true;
    } catch (err) {
      /* page may be mid-navigation */
    }
    await sleep(120);
  }
  return false;
}

const SKIP_INTRO = `(function () {
  try {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true }));
  } catch (err) {}
  return true;
})()`;

const FORCE_CLEAR_INTRO = `(function () {
  var html = document.documentElement;
  html.classList.remove('intro-play', 'intro-done');
  var intro = document.getElementById('intro');
  if (intro) intro.style.display = 'none';
  html.style.overflow = '';
  if (document.body) document.body.style.overflow = '';
  try {
    if (window.__lenis) { window.__lenis.start(); window.__lenis.scrollTo(0, { immediate: true, force: true }); }
  } catch (err) {}
  return true;
})()`;

const SCROLL_THROUGH = `(async function () {
  var lenis = window.__lenis || window.lenis || window.lenisInstance || null;
  function go(y) {
    if (lenis && typeof lenis.scrollTo === 'function') {
      try { lenis.scrollTo(y, { immediate: true, force: true }); return; } catch (err) {}
    }
    window.scrollTo(0, y);
    document.documentElement.scrollTop = y;
    if (document.body) document.body.scrollTop = y;
  }
  var height = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
  var step = Math.max(320, Math.round(window.innerHeight * 0.75));
  for (var y = 0; y <= height; y += step) {
    go(y);
    await new Promise(function (resolve) { setTimeout(resolve, 100); });
  }
  go(height);
  await new Promise(function (resolve) { setTimeout(resolve, 120); });
  go(0);
  await new Promise(function (resolve) { setTimeout(resolve, 350); });
  return height;
})()`;

const FREEZE_STYLES = `(function () {
  var id = '__responsive_audit_freeze__';
  if (!document.getElementById(id)) {
    var style = document.createElement('style');
    style.id = id;
    style.textContent = [
      'html { scroll-behavior: auto !important; }',
      '*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; }',
      '.reveal, .reveal-r, .reveal-l, .reveal-s, .reveal-delay {',
      '  animation: none !important; opacity: 1 !important; transform: none !important;',
      '}'
    ].join('\\n');
    (document.head || document.documentElement).appendChild(style);
  }
  try {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
  } catch (err) {}
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  return true;
})()`;

const WAIT_IMAGES = `(async function () {
  var images = Array.prototype.slice.call(document.images || []);
  var pending = images.filter(function (img) { return !img.complete; });
  if (pending.length) {
    await Promise.race([
      Promise.all(pending.map(function (img) {
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })),
      new Promise(function (resolve) { setTimeout(resolve, 3000); })
    ]);
  }
  return images.length;
})()`;

async function capture(cdp, sessionId, targetPath, width) {
  let metrics;
  try {
    metrics = await cdp.send('Page.getLayoutMetrics', {}, sessionId);
  } catch (err) {
    metrics = null;
  }
  const content = metrics ? (metrics.cssContentSize || metrics.contentSize) : null;
  const fullHeight = content ? Math.ceil(content.height) : VIEWPORT_HEIGHT;
  const height = Math.max(VIEWPORT_HEIGHT, Math.min(fullHeight, MAX_SHOT_HEIGHT));

  const params = {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 }
  };

  let data;
  try {
    const shot = await cdp.send('Page.captureScreenshot', params, sessionId);
    data = shot.data;
  } catch (err) {
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sessionId);
    data = shot.data;
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
  return {
    file: targetPath,
    height,
    fullHeight,
    clipped: fullHeight > MAX_SHOT_HEIGHT
  };
}

async function runCase(cdp, sessionId, options, page, width) {
  const entry = {
    page,
    width,
    url: pageUrl(page),
    status: 'ok',
    error: null,
    title: '',
    layoutWidth: null,
    probe: null,
    errors: [],
    shot: null,
    startedAt: new Date().toISOString()
  };

  const errors = [];
  const addError = (message) => {
    const clean = sanitiseConsoleText(message);
    if (clean && !errors.includes(clean)) errors.push(clean);
  };

  const offs = [
    cdp.on('Runtime.exceptionThrown', (params, sid) => {
      if (sid !== sessionId) return;
      const detail = params.exceptionDetails;
      addError(detail && detail.exception ? (detail.exception.description || detail.exception.value) : (detail && detail.text));
    }),
    cdp.on('Runtime.consoleAPICalled', (params, sid) => {
      if (sid !== sessionId || params.type !== 'error') return;
      addError((params.args || []).map((arg) => arg.value !== undefined ? arg.value : arg.description).join(' '));
    }),
    cdp.on('Log.entryAdded', (params, sid) => {
      if (sid !== sessionId) return;
      const record = params.entry || {};
      if (record.level !== 'error') return;
      addError((record.text || '') + (record.url ? ' @ ' + record.url : ''));
    })
  ];

  const mobile = width < 1000;
  let loadTimer = null;

  try {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: VIEWPORT_HEIGHT
    }, sessionId);

    await cdp.send('Emulation.setTouchEmulationEnabled', {
      enabled: mobile,
      maxTouchPoints: mobile ? 5 : 0
    }, sessionId);

    await cdp.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    }, sessionId);

    // Begin listening for the load event before navigating.
    const loaded = waitForEvent(cdp, 'Page.loadEventFired', sessionId, 25000);

    const nav = await cdp.send('Page.navigate', { url: entry.url }, sessionId);
    if (nav.errorText) throw new Error('Navigation failed: ' + nav.errorText);

    await loaded;

    await waitFor(cdp, sessionId, `document.readyState === 'complete'`, 12000);

    await evaluate(cdp, sessionId, `document.fonts && document.fonts.ready ? document.fonts.ready.then(function(){ return true; }) : true`, { awaitPromise: true }).catch(() => {});
    await sleep(300);

    // Skip the page-load intro the same way a visitor does (any key), then make
    // sure the scroll lock is gone even if the intro script failed to load.
    await evaluate(cdp, sessionId, SKIP_INTRO).catch(() => {});
    await sleep(250);
    const introGone = await waitFor(
      cdp,
      sessionId,
      `!document.documentElement.classList.contains('intro-play')`,
      2500
    );
    if (!introGone) await evaluate(cdp, sessionId, FORCE_CLEAR_INTRO).catch(() => {});
    await sleep(200);

    await evaluate(cdp, sessionId, SCROLL_THROUGH, { awaitPromise: true }).catch(() => {});
    await evaluate(cdp, sessionId, FREEZE_STYLES).catch(() => {});
    await evaluate(cdp, sessionId, WAIT_IMAGES, { awaitPromise: true }).catch(() => {});
    await sleep(300);

    const title = await evaluate(cdp, sessionId, `document.title || ''`);
    const data = await evaluate(cdp, sessionId, `(${probe.toString()})(${JSON.stringify({ width })})`);

    entry.title = title;
    entry.layoutWidth = data.meta.innerWidth;
    entry.probe = data;
    entry.errors = errors.slice(0, 10);

    if (options.shotWidths.includes(width)) {
      const file = path.join(options.shotsDir, page + '-' + width + '.png');
      try {
        entry.shot = await capture(cdp, sessionId, file, width);
      } catch (err) {
        entry.shotError = sanitiseConsoleText(err.message);
      }
    }
  } catch (err) {
    entry.status = 'error';
    entry.error = sanitiseConsoleText(err.message || err);
    entry.errors = errors.slice(0, 10);
  } finally {
    if (loadTimer) clearTimeout(loadTimer);
    offs.forEach((off) => off());
  }

  return entry;
}

function logProgress(entry, index, total) {
  const prefix = '[' + String(index + 1).padStart(2, ' ') + '/' + total + ']';
  if (entry.status !== 'ok') {
    console.log(prefix + ' ' + entry.page + ' @' + entry.width + '  FAILED — ' + entry.error);
    return;
  }
  const data = entry.probe;
  const flags = [
    data.meta.docScrollWidth > data.meta.innerWidth + 1 ? 'overflow ' + (data.meta.docScrollWidth - data.meta.innerWidth) + 'px' : 'no-overflow',
    'tap<44:' + data.tap.filter((t) => !t.inline).length,
    'copy<14:' + data.type.length,
    'layers:' + data.layers.length,
    'img:' + data.images.length,
    'strings:' + data.strings.length,
    'h1:' + (data.meta.h1 ? data.meta.h1.size + 'px' : 'none'),
    entry.layoutWidth !== entry.width ? 'layout=' + entry.layoutWidth : ''
  ].filter(Boolean);
  const shot = entry.shot ? (entry.shot.clipped ? '  [shot clipped]' : '  [shot]') : '';
  console.log(prefix + ' ' + entry.page + ' @' + entry.width + '  ' + flags.join(' · ') + shot);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error('Run with --help for usage.');
    process.exit(2);
    return;
  }
  if (options.help) {
    printHelp();
    return;
  }

  fs.mkdirSync(options.outDir, { recursive: true });
  fs.mkdirSync(options.shotsDir, { recursive: true });

  let server = { started: false, child: null };
  let chrome = null;

  try {
    server = await ensureServer(options.startServer);
    if (server.started) console.log('Started server.js on ' + BASE);

    chrome = await launch();
    console.log('Chrome: ' + chrome.browser);

    const { targetId } = await chrome.cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await chrome.cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await chrome.cdp.send('Page.enable', {}, sessionId);
    await chrome.cdp.send('Runtime.enable', {}, sessionId);
    await chrome.cdp.send('Log.enable', {}, sessionId);

    const run = {
      startedAt: new Date().toISOString(),
      finishedAt: null,
      base: BASE,
      chrome: chrome.browser,
      chromePath: chrome.executable,
      pages: options.pages,
      widths: options.widths,
      shotWidths: options.shotWidths,
      serverStartedByTool: server.started,
      runs: []
    };

    const total = options.pages.length * options.widths.length;
    let index = 0;
    for (const page of options.pages) {
      for (const width of options.widths) {
        const entry = await runCase(chrome.cdp, sessionId, options, page, width);
        run.runs.push(entry);
        logProgress(entry, index, total);
        index++;
      }
    }

    run.finishedAt = new Date().toISOString();
    fs.writeFileSync(options.json, JSON.stringify(run, null, 2), 'utf8');

    const { markdown, reportPath, summary } = renderReport(run, options);
    fs.writeFileSync(reportPath, markdown, 'utf8');

    console.log('');
    console.log('Report:      ' + reportPath);
    console.log('Raw data:    ' + options.json);
    console.log('Screenshots: ' + options.shotsDir);
    console.log('');
    console.log(
      summary.okRuns + '/' + total + ' runs ok · ' +
      summary.pagesWithOverflow + '/' + options.pages.length + ' pages overflow · ' +
      summary.overflowElements + ' off-viewport elements · ' +
      summary.tapTargets + ' tap targets <44px · ' +
      summary.smallText + ' copy nodes <14px'
    );
    console.log('Top offender selectors:');
    summary.topOffenders.forEach((item, i) => {
      console.log('  ' + String(i + 1).padStart(2, ' ') + '. ' + item.selector + '  (' + item.pages + ' pages, ' + item.hits + ' hits: ' + item.categories.join(', ') + ')');
    });

    await chrome.cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  } finally {
    if (chrome) await chrome.cleanup();
    if (server.started) stopServer(server.child);
  }
}

main().catch((err) => {
  console.error('');
  console.error('Audit failed: ' + (err && err.stack ? err.stack : err));
  process.exit(1);
});
