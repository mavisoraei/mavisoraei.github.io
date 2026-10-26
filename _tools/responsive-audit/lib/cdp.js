'use strict';

/* Minimal Chrome DevTools Protocol client + headless Chrome launcher.
   No npm dependencies: Node >= 22 ships a global WebSocket, which is all the
   protocol needs. Written for the responsive audit but usable standalone. */

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const http = require('http');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function httpJson(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
        try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function chromeCandidates() {
  const out = [];
  if (process.env.CHROME_PATH) out.push(process.env.CHROME_PATH);
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || '';
    out.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      local ? path.join(local, 'Google\\Chrome\\Application\\chrome.exe') : '',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    );
  } else if (process.platform === 'darwin') {
    out.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else {
    out.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    );
  }
  return out.filter((candidate) => candidate && fs.existsSync(candidate));
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.closed = false;

    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data)); }
      catch (err) { return; }
      this._dispatch(msg);
    });
    ws.addEventListener('close', () => {
      this.closed = true;
      for (const [, waiter] of this.pending) {
        waiter.reject(new Error('CDP socket closed while waiting for ' + waiter.method));
      }
      this.pending.clear();
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('Could not open DevTools WebSocket')), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    if (this.closed) return Promise.reject(new Error('CDP socket already closed'));
    const id = ++this.nextId;
    const message = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    this.ws.send(JSON.stringify(message));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
    });
  }

  _dispatch(msg) {
    if (msg.id) {
      const waiter = this.pending.get(msg.id);
      if (!waiter) return;
      this.pending.delete(msg.id);
      if (msg.error) {
        const err = new Error(waiter.method + ': ' + msg.error.message);
        err.code = msg.error.code;
        err.data = msg.error.data;
        waiter.reject(err);
      } else {
        waiter.resolve(msg.result);
      }
      return;
    }
    if (!msg.method) return;
    const handlers = this.listeners.get(msg.method);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      try { handler(msg.params, msg.sessionId); } catch (err) { /* listener errors must not kill the run */ }
    }
  }

  on(method, handler) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(handler);
    return () => {
      const set = this.listeners.get(method);
      if (set) set.delete(handler);
    };
  }

  close() {
    try { this.ws.close(); } catch (err) { /* already gone */ }
  }
}

async function launch() {
  const executable = chromeCandidates()[0];
  if (!executable) {
    throw new Error('Chrome/Chromium not found. Set CHROME_PATH to a Chrome, Edge or Chromium executable.');
  }

  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lemon-responsive-audit-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--remote-allow-origins=*',
    '--user-data-dir=' + profile,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-device-scale-factor=1',
    '--window-size=1440,900',
    'about:blank'
  ];

  const child = spawn(executable, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  let version;
  const deadline = Date.now() + 20000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    try {
      version = await httpJson('http://127.0.0.1:' + port + '/json/version');
      break;
    } catch (err) {
      lastError = err;
      await sleep(200);
    }
  }
  if (!version) {
    try { child.kill(); } catch (err) { /* noop */ }
    throw new Error(
      'Headless Chrome did not expose a DevTools endpoint.' +
      (lastError ? '\nLast error: ' + lastError.message : '') +
      (stderr ? '\nChrome stderr:\n' + stderr.slice(-1200) : '')
    );
  }

  const cdp = await CDP.connect(version.webSocketDebuggerUrl);

  const cleanup = async () => {
    try { cdp.close(); } catch (err) { /* noop */ }
    try { child.kill(); } catch (err) { /* noop */ }
    await sleep(400);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.rmSync(profile, { recursive: true, force: true });
        break;
      } catch (err) {
        await sleep(300);
      }
    }
  };

  return {
    cdp,
    port,
    executable,
    browser: version.Browser || 'unknown',
    cleanup
  };
}

module.exports = { CDP, launch, sleep, chromeCandidates };
