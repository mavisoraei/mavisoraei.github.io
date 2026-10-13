/* Lemon AI Smart Mirror: UI flow with ONE hash router. Mock data via ai-api.js. Renders inside <main id="main">. */
(() => {
  'use strict';
  const main = document.getElementById('main'), api = window.LemonAI;
  if (!main || !api) { console.error('ai-app: needs <main id="main"> and ai-api.js loaded first'); return; }
  main.classList.add('ai-on');
  const $ = (s, r = main) => r.querySelector(s);
  const S = { photo: null, url: '', areas: new Set(), level: 1, goal: 5, chat: [], pending: false, navs: 0, tok: 0, result: null };
  const AREAS = ['Lips', 'Cheeks', 'Under-eye', 'Jawline', 'Chin', 'Nose', 'Forehead'], LEVELS = ['Natural', 'Balanced', 'Noticeable'];
  const FLOW = { face: ['upload', 'areas', 'processing', 'result'], body: ['upload', 'goal', 'processing', 'result'] };
  const TITLES = { upload: 'Your photo', areas: 'Areas', goal: 'Your goal', processing: 'Analyzing', result: 'Your preview' };
  const MASCOT = '/mascot/full-v2/mascot.webp';
  const P = { back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M5 12h14M13 6l6 6-6 6"/>', up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z"/>' };
  const ic = p => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = (h, replace) => replace ? location.replace(h) : (location.hash = h);
  const book = () => (window.LemonBooking && window.LemonBooking.open) ? window.LemonBooking.open({ service: 'consultation' }) : (location.href = '/contact.html');
  const contact = () => { const b = document.querySelector('[data-contact-open]'); b ? b.click() : (location.href = '/contact.html'); };
  let timers = [];

  function top(kind, step, title) {
    const n = FLOW[kind] ? FLOW[kind].length : 0;
    const seg = n ? Array.from({ length: n }, (_, i) => '<i class="' + (i < step ? 'on' : '') + '"></i>').join('') : '';
    return '<div class="ai-top">' + (step || kind === 'ask' ? '<button class="ai-back" type="button" aria-label="Back">' + ic(P.back) + '</button>' : '<span></span>') +
      '<h1 id="ai-h" tabindex="-1">' + title + '</h1><span class="ai-count">' + (n ? step + ' / ' + n : '') + '</span></div>' +
      (n ? '<div class="ai-bar" aria-hidden="true">' + seg + '</div>' : '');
  }
  const msg = t => { const e = $('#err'); if (e) e.textContent = t; };
  function take(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) return msg('Please choose an image file.');
    if (f.size > 15 * 1024 * 1024) return msg('Please choose a photo under 15 MB.');
    if (S.url) URL.revokeObjectURL(S.url);
    S.photo = f; S.url = URL.createObjectURL(f); route();
  }
  function picker(kind) {
    const tips = kind === 'face' ? ['Face the camera, whole face in the frame', 'Soft, even light, no glasses or hat', 'Relaxed expression, no heavy filters'] : ['Stand straight, full body in the frame', 'Plain background, good light', 'Fitted clothing so your shape is visible'];
    return '<div class="ai-drop" id="drop">' + (S.url ? '<img src="' + S.url + '" alt="Your photo preview">' : '<p>Drag a photo here, or choose one below.</p>') + '</div>' +
      '<div class="ai-row"><label class="ai-btn ghost">' + ic(P.up) + ' Choose a photo<input id="f1" type="file" accept="image/*" hidden></label>' +
      '<label class="ai-btn ghost">' + ic(P.cam) + ' Take a photo<input id="f2" type="file" accept="image/*" capture="user" hidden></label></div>' +
      '<p class="ai-err" id="err" role="alert"></p><ul class="ai-tips">' + tips.map(t => '<li>' + t + '</li>').join('') + '</ul>' +
      '<button class="ai-btn" id="next" type="button"' + (S.photo ? '' : ' disabled') + '>Continue ' + ic(P.next) + '</button>';
  }
  function bindPicker(next) {
    ['f1', 'f2'].forEach(id => $('#' + id).addEventListener('change', e => take(e.target.files[0])));
    const d = $('#drop');
    ['dragover', 'dragenter'].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.remove('over'); }));
    d.addEventListener('drop', e => take(e.dataTransfer.files[0]));
    $('#next').addEventListener('click', () => S.photo && go(next));
  }
  function slider(before, after) {
    return '<div class="ba" style="--pos:50%"><img class="ba-a" src="' + after + '" alt="After preview"><img class="ba-b" src="' + before + '" alt="Your original photo">' +
      '<span class="ba-line"></span><span class="ba-knob">&#8249;&#8250;</span><span class="pill l">Before</span><span class="pill r">After</span>' +
      '<input type="range" min="0" max="100" value="50" aria-label="Compare before and after"></div>';
  }
  function processing(kind) {
    const tok = S.tok;
    const lines = kind === 'face' ? ['Detecting your face', 'Mapping facial proportions', 'Preparing your preview', 'Almost there'] : ['Detecting your silhouette', 'Reading proportions', 'Preparing your preview', 'Almost there'];
    let i = 0; const live = $('#live');
    timers.push(setInterval(() => { i = (i + 1) % lines.length; live.textContent = lines[i]; }, 900));
    const job = kind === 'face' ? api.analyzeFace(S.photo, { areas: [...S.areas], level: LEVELS[S.level] }) : api.analyzeBody(S.photo, { goal: S.goal });
    Promise.all([job, new Promise(r => setTimeout(r, 3200))]).then(([res]) => { if (tok !== S.tok) return; S.result = res; go('#/' + kind + '/result', true); })
      .catch(() => { if (tok !== S.tok) return; $('.ai-proc').innerHTML = '<p class="ai-err">We could not create your preview right now. Please try again or contact us.</p><button class="ai-btn" id="retry" type="button">Try again</button>'; $('#retry').addEventListener('click', route); });
  }
  function drawChat() {
    const el = $('#chat'); if (!el) return;
    el.innerHTML = S.chat.map(m => '<div class="b ' + m.r + '">' + esc(m.t) + (m.cta ? '<br><button class="ai-btn mini" type="button" data-book>Book a consultation</button>' : '') + '</div>').join('') + (S.pending ? '<div class="b a typing" aria-label="Typing"><i></i><i></i><i></i></div>' : '');
    el.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', book));
    el.scrollTop = el.scrollHeight;
  }
  async function send(t) {
    t = t.trim(); if (!t || S.pending) return;
    S.chat.push({ r: 'u', t }); S.pending = true; drawChat();
    try { const r = await api.askQuestion(t); S.chat.push({ r: 'a', t: r.text, cta: r.cta }); }
    catch (e) { S.chat.push({ r: 'a', t: 'Sorry, I cannot answer right now. Please contact us.', cta: true }); }
    S.pending = false; drawChat();
  }

  function route() {
    S.tok++; timers.forEach(clearInterval); timers = [];
    const [kind, step] = location.hash.replace(/^#\/?/, '').split('/');
    let html = '', bind = () => {};
    if (FLOW[kind]) {
      const idx = FLOW[kind].indexOf(step) + 1;
      if (!idx) return go('#/start', true);
      if (idx > 1 && !S.photo) return go('#/' + kind + '/upload', true);
      html = top(kind, idx, TITLES[step]);
      const next = '#/' + kind + '/' + FLOW[kind][idx];
      if (step === 'upload') { html += picker(kind); bind = () => bindPicker(next); }
      else if (step === 'areas') {
        html += '<p class="ai-sub">Choose the areas you would like to preview.</p><div class="ai-chips" id="areas">' + AREAS.map(a => '<button type="button" class="chip' + (S.areas.has(a) ? ' on' : '') + '" aria-pressed="' + S.areas.has(a) + '">' + a + '</button>').join('') + '</div>' +
          '<label class="ai-lab" for="lv">Intensity: <b id="lvt">' + LEVELS[S.level] + '</b></label><input id="lv" class="ai-range" type="range" min="0" max="2" step="1" value="' + S.level + '"><div class="ai-scale"><span>Natural</span><span>Balanced</span><span>Noticeable</span></div>' +
          '<button class="ai-btn" id="next" type="button"' + (S.areas.size ? '' : ' disabled') + '>Create my preview ' + ic(P.next) + '</button>';
        bind = () => {
          $('#areas').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const a = b.textContent; S.areas.has(a) ? S.areas.delete(a) : S.areas.add(a); b.classList.toggle('on'); b.setAttribute('aria-pressed', S.areas.has(a)); $('#next').disabled = !S.areas.size; });
          $('#lv').addEventListener('input', e => { S.level = +e.target.value; $('#lvt').textContent = LEVELS[S.level]; });
          $('#next').addEventListener('click', () => S.areas.size && go(next));
        };
      } else if (step === 'goal') {
        html += '<p class="ai-sub">Tell us about your target.</p><label class="ai-lab" for="gl">Target weight change: <b id="glt">' + S.goal + ' kg</b></label><input id="gl" class="ai-range" type="range" min="2" max="30" step="1" value="' + S.goal + '"><div class="ai-scale"><span>2 kg</span><span>30 kg</span></div>' +
          '<button class="ai-btn" id="next" type="button">Create my preview ' + ic(P.next) + '</button>';
        bind = () => { $('#gl').addEventListener('input', e => { S.goal = +e.target.value; $('#glt').textContent = S.goal + ' kg'; }); $('#next').addEventListener('click', () => go(next)); };
      } else if (step === 'processing') {
        html += '<div class="ai-proc"><div class="ai-photo"><img src="' + S.url + '" alt=""><span class="scan"></span></div><p class="ai-live" id="live" aria-live="polite">Detecting ' + (kind === 'face' ? 'your face' : 'your silhouette') + '</p></div>';
        bind = () => processing(kind);
      } else {
        const r = S.result || {};
        const chips = kind === 'face' ? [...S.areas].map(a => '<span class="chip on">' + esc(a) + '</span>').join('') + '<span class="chip">' + LEVELS[S.level] + '</span>' : '<span class="chip">Target: ' + S.goal + ' kg</span>';
        html += (api.demo ? '<p class="ai-ribbon">Demo preview - not a real analysis. The "after" image is a placeholder.</p>' : '') + slider(S.url, r.afterUrl || S.url) +
          '<div class="ai-chips">' + chips + '</div><p class="ai-note">' + esc(r.summary || '') + '</p>' +
          '<button class="ai-btn" id="bk" type="button">Book an appointment</button><a class="ai-btn ghost" href="#/' + kind + '/' + (kind === 'face' ? 'areas' : 'goal') + '">Try again</a>';
        bind = () => { $('.ba input').addEventListener('input', e => $('.ba').style.setProperty('--pos', e.target.value + '%')); $('#bk').addEventListener('click', book); };
      }
    } else if (kind === 'ask') {
      if (!S.chat.length) S.chat.push({ r: 'a', t: 'Hi, I am the Lemon assistant. Ask me anything about treatments, prices or booking.' });
      html = top('ask', 0, 'Ask us') + '<div class="ai-chat" id="chat" aria-live="polite"></div><div class="ai-chips" id="sug">' +
        ['How much does a lip filler cost?', 'Is it painful?', 'How long do results last?'].map(q => '<button type="button" class="chip">' + q + '</button>').join('') +
        '</div><form id="cf" class="ai-msg"><input id="ci" placeholder="Type your question" maxlength="400" autocomplete="off" aria-label="Your question"><button class="ai-send" aria-label="Send">' + ic(P.next) + '</button></form>';
      bind = () => { drawChat(); $('#sug').addEventListener('click', e => e.target.classList.contains('chip') && send(e.target.textContent)); $('#cf').addEventListener('submit', e => { e.preventDefault(); const i = $('#ci'); send(i.value); i.value = ''; }); };
    } else {
      html = top(null, 0, 'AI Smart Mirror') + '<p class="ai-sub">A real preview on your own photo, in seconds.</p>';
      if (api.demo || api.configured()) {
        const card = (h, t, d) => '<a class="ai-card" href="' + h + '"><img src="' + MASCOT + '" alt="" width="48" height="84"><span><b>' + t + '</b><small>' + d + '</small></span>' + ic(P.next) + '</a>';
        html += card('#/face/upload', 'Face', 'See filler and contour on your own photo before injection.') + card('#/body/upload', 'Body', 'See yourself after weight loss.') + card('#/ask', 'Any questions? Ask us', 'Chat with the Lemon assistant.');
        if (api.demo) html += '<p class="ai-ribbon">Demo preview - not a real analysis.</p>';
      } else {
        html += '<div class="ai-notice"><p>Our AI analysis is being upgraded. Please contact us to book a consultation.</p><button class="ai-btn" id="cc" type="button">Contact us</button></div>';
        bind = () => $('#cc').addEventListener('click', contact);
      }
      html += '<p class="ai-foot">Your photo is used only for this analysis and does not replace a doctor\'s examination.</p>';
    }
    main.innerHTML = '<div class="aiapp">' + html + '</div>';
    const back = $('.ai-back'); if (back) back.addEventListener('click', () => S.navs > 0 ? history.back() : go('#/start'));
    bind(); window.scrollTo(0, 0);
    const h1 = $('#ai-h'); if (h1) h1.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => { S.navs++; route(); });
  route();
})();
