/* Lemon AI - backend adapter. ONLY this file talks to a backend; the UI (ai-app.js) never calls fetch itself.
   Brother: set config.base and implement the endpoints below (paths are proposals, change freely).
   POST /face/simulate  multipart: photo (file), areas (JSON array of strings), level ("Natural"|"Balanced"|"Noticeable")
                        -> { afterUrl: "https://...", summary: "text" }
   POST /body/simulate  multipart: photo (file), goal (number, kg) -> { afterUrl, summary }
   POST /ask            multipart: message (text) -> { text: "answer", cta: true|false }   (cta = show "Book a consultation")
   Demo mode (localhost, or ?demo=1) returns mock data. Otherwise, without config.base, every call throws 'AI backend not configured'. */
(() => {
  const h = location.hostname;
  const demo = h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local') || new URLSearchParams(location.search).has('demo');
  const config = { base: '' };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const configured = () => !!config.base;
  async function post(path, fd) {
    const r = await fetch(config.base + path, { method: 'POST', body: fd });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  const guard = () => { if (!demo && !configured()) throw new Error('AI backend not configured'); };
  async function analyzeFace(photo, opts) {
    guard();
    if (configured()) { const fd = new FormData(); fd.append('photo', photo); fd.append('areas', JSON.stringify(opts.areas)); fd.append('level', opts.level); return post('/face/simulate', fd); }
    await wait(300);
    return { afterUrl: URL.createObjectURL(photo), summary: 'Sample preview with a ' + opts.level.toLowerCase() + ' result on: ' + opts.areas.join(', ') + '. A Lemon physician confirms what is suitable at the examination.' };
  }
  async function analyzeBody(photo, opts) {
    guard();
    if (configured()) { const fd = new FormData(); fd.append('photo', photo); fd.append('goal', opts.goal); return post('/body/simulate', fd); }
    await wait(300);
    return { afterUrl: URL.createObjectURL(photo), summary: 'Sample preview for a target change of ' + opts.goal + ' kg. Real results depend on your body and plan, set at the examination.' };
  }
  async function askQuestion(message) {
    guard();
    if (configured()) { const fd = new FormData(); fd.append('message', message); return post('/ask', fd); }
    await wait(900);
    return { text: 'Thank you for asking. A Lemon physician can answer this properly after seeing you. Prices are on the Pricing page, and you can book a consultation here.', cta: true };
  }
  window.LemonAI = { demo, config, configured, analyzeFace, analyzeBody, askQuestion };
})();
