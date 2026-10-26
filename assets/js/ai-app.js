/* Lemon AI Smart Mirror: UI flow with ONE hash router. Mock data via ai-api.js. Renders inside <main id="main">. */
(() => {
  'use strict';
  const main = document.getElementById('main'), api = window.LemonAI;
  if (!main || !api) { console.error('ai-app: needs <main id="main"> and ai-api.js loaded first'); return; }
  main.classList.add('ai-on');
  const $ = (s, r = main) => r.querySelector(s);
  const $$ = (s, r = main) => Array.from(r.querySelectorAll(s));
  const S = { photo: null, url: '', areas: new Set(), level: 1, goal: 5, chat: [], pending: false, navs: 0, tok: 0, result: null, body: { weight: 80, height: 170, loss: 8, adult: false, tab: 0, monthReady: false, monthTimer: null } };
  const AREAS = ['Lips', 'Cheeks', 'Under-eye', 'Jawline', 'Chin', 'Nose', 'Forehead'], LEVELS = ['Natural', 'Balanced', 'Noticeable'];
  const FLOW = { face: ['upload', 'areas', 'processing', 'result'], body: ['upload', 'goal', 'verify', 'result'] };
  const TITLES = { upload: 'Your photo', areas: 'Areas', goal: 'Your goal', verify: 'Verify', processing: 'Analyzing', result: 'Your preview' };
  const MASCOT = '/mascot/full-v2/mascot.webp';
  const P = { back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M5 12h14M13 6l6 6-6 6"/>', up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z"/>' };
  const ic = p => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const go = (h, replace) => replace ? location.replace(h) : (location.hash = h);
  const book = (service) => (window.LemonBooking && window.LemonBooking.open) ? window.LemonBooking.open({ service: service || 'consultation' }) : (location.href = '/contact.html');
  const contact = () => { const b = document.querySelector('[data-contact-open]'); b ? b.click() : (location.href = '/contact.html'); };
  let timers = [];
  // Body flow config - edit here only
  const BODY_CFG = {
    verifyContact: false,        // example: true to require verification
    shareUnlock: false,          // example: true to enable share-to-unlock
    priceEstimate: 16000000,     // example value - hard code no clinic-specific number in logic
    currencyLabel: 'Toman',      // example label
    durationText: '1-2 months'   // example text
  };

  function top(kind, stepIdx, title, total) {
    const n = typeof total === 'number' ? total : (FLOW[kind] ? FLOW[kind].length : 0);
    const seg = n ? Array.from({ length: n }, (_, i) => '<i class="' + (i < stepIdx ? 'on' : '') + '"></i>').join('') : '';
    return '<div class="ai-top">' + (stepIdx >= 0 || kind === 'ask' ? '<button class="ai-back" type="button" aria-label="Go back">' + ic(P.back) + '</button>' : '<span></span>') +
      '<div style="text-align:center"><h1 id="ai-h" tabindex="-1">' + esc(title) + '</h1>' + (n ? '<div class="ai-stepnum">' + stepIdx + ' / ' + n + '</div>' : '') + '</div>' +
      '<span></span></div>' +
      (n ? '<div class="ai-bar" aria-label="Step progress">' + seg + '</div>' : '');
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
    ['f1', 'f2'].forEach(id => { const el = $('#' + id); if (el) el.addEventListener('change', e => take(e.target.files && e.target.files[0])); });
    const d = $('#drop'); if (d) {
      ['dragover', 'dragenter'].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(t => d.addEventListener(t, e => { e.preventDefault(); d.classList.remove('over'); }));
      d.addEventListener('drop', e => take(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]));
    }
    const nx = $('#next'); if (nx) nx.addEventListener('click', () => S.photo && go(next));
  }
  function slider(before, after) {
    return '<div class="ba" style="--pos:50%"><img class="ba-a" src="' + esc(after) + '" alt="After preview"><img class="ba-b" src="' + esc(before) + '" alt="Your original photo">' +
      '<span class="ba-line"></span><span class="ba-knob">&#8249;&#8250;</span><span class="pill l">Before</span><span class="pill r">After</span>' +
      '<input type="range" min="0" max="100" value="50" aria-label="Compare before and after"></div>';
  }
  function processing(kind) {
    const tok = S.tok;
    const lines = kind === 'face' ? ['Detecting your face', 'Mapping facial proportions', 'Preparing your preview', 'Almost there'] : ['Detecting your silhouette', 'Reading proportions', 'Preparing your preview', 'Almost there'];
    let i = 0; const live = $('#live');
    if (live) timers.push(setInterval(() => { i = (i + 1) % lines.length; live.textContent = lines[i]; }, 900));
    const job = kind === 'face' ? api.analyzeFace(S.photo, { areas: [...S.areas], level: LEVELS[S.level] }) : api.analyzeBody(S.photo, { goal: S.body.loss });
    Promise.all([job, new Promise(r => setTimeout(r, 3200))]).then(([res]) => { if (tok !== S.tok) return; S.result = res; go('#/' + kind + '/result', true); })
      .catch(() => { if (tok !== S.tok) return; const p = $('.ai-proc'); if (p) p.innerHTML = '<p class="ai-err">We could not create your preview right now. Please try again or contact us.</p><button class="ai-btn" id="retry" type="button">Try again</button>'; const rt = $('#retry'); if (rt) rt.addEventListener('click', route); });
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

  function render(html) {
    const wrap = document.createElement('div');
    wrap.className = 'aiapp';
    wrap.innerHTML = html;
    main.replaceChildren(wrap);
  }

  function clamp(v,min,max){ return Math.min(max, Math.max(min,v)); }
  function calcBMI(w,h){ const m = h/100; if(m<=0)return 99; return w/(m*m); }
  function checkGoalClamp(){
    const b = S.body;
    const bmiCur = calcBMI(b.weight,b.height);
    const bmiAfter = calcBMI(Math.max(0,b.weight - b.loss), b.height);
    if(bmiAfter < 18.5){
      // clamp loss
      const targetW = 18.5 * (b.height/100)*(b.height/100);
      let maxLoss = b.weight - targetW;
      if(maxLoss < 0) maxLoss = 0;
      if(b.loss > maxLoss + 1e-6){
        b.loss = Math.max(0, Math.round(maxLoss*10)/10);
        return true;
      }
    }
    if(b.loss > 30){
      b.loss = 30;
      return true;
    }
    return false;
  }

  function renderBodyGoal(){
    const b = S.body;
    checkGoalClamp();
    const clamped = checkGoalClamp();
    const shareHtml = (BODY_CFG.shareUnlock === false) ? '' : '<div class="ai-body-note">One preview is created per contact. Want another try? Share Lemon\'s post with 3 friends</div>';
    // build three cards
    const card = (key, label, unit, val) => {
      return '<div class="ai-metric glass-card" data-metric="'+esc(key)+'">' +
        '<div class="ai-metric-head"><span class="ai-metric-label">'+esc(label)+'</span><span class="ai-metric-unit">'+esc(unit)+'</span></div>' +
        '<button class="ai-metric-val" type="button" data-edit="'+esc(key)+'" aria-label="Edit '+esc(label)+'">'+val.toFixed(key==='loss'?1:0)+'</button>' +
        '<div class="ai-metric-ctrl"><button class="ai-metric-btn" type="button" data-dec="'+esc(key)+'" aria-label="Decrease">−</button>' +
        '<div class="ai-metric-mid"><input class="ai-metric-range" type="range" data-range="'+esc(key)+'" min="'+(key==='weight'?'40':'height'==='170'?'120':'0')+'" max="'+(key==='weight'?'160':'height'==='170'?'220':'30')+'" step="'+(key==='loss'?'0.5':'1')+'" value="'+val+'"></div>' +
        '<button class="ai-metric-btn" type="button" data-inc="'+esc(key)+'" aria-label="Increase">+</button></div>' +
        '</div>';
    };
    // set proper ranges
    let html = top('body', 1, 'Your goal', 4);
    html += '<div class="ai-illus">Illustrative preview, not a guarantee or medical advice.</div>';
    html += '<div class="ai-metrics">';
    html += '<div class="ai-metric glass-card" data-metric="weight"><div class="ai-metric-head"><span class="ai-metric-label">Current weight</span><span class="ai-metric-unit">kg</span></div><button class="ai-metric-val" type="button" data-edit="weight">'+b.weight+'</button><div class="ai-metric-ctrl"><button class="ai-metric-btn" type="button" data-dec="weight">−</button><div class="ai-metric-mid"><input class="ai-metric-range" type="range" data-range="weight" min="40" max="160" step="1" value="'+b.weight+'"></div><button class="ai-metric-btn" type="button" data-inc="weight">+</button></div></div>';
    html += '<div class="ai-metric glass-card" data-metric="height"><div class="ai-metric-head"><span class="ai-metric-label">Height</span><span class="ai-metric-unit">cm</span></div><button class="ai-metric-val" type="button" data-edit="height">'+b.height+'</button><div class="ai-metric-ctrl"><button class="ai-metric-btn" type="button" data-dec="height">−</button><div class="ai-metric-mid"><input class="ai-metric-range" type="range" data-range="height" min="120" max="220" step="1" value="'+b.height+'"></div><button class="ai-metric-btn" type="button" data-inc="height">+</button></div></div>';
    html += '<div class="ai-metric glass-card" data-metric="loss"><div class="ai-metric-head"><span class="ai-metric-label">Weight-loss goal</span><span class="ai-metric-unit">kg</span></div><button class="ai-metric-val" type="button" data-edit="loss">'+b.loss.toFixed(1)+'</button><div class="ai-metric-ctrl"><button class="ai-metric-btn" type="button" data-dec="loss">−</button><div class="ai-metric-mid"><input class="ai-metric-range" type="range" data-range="loss" min="0" max="30" step="0.5" value="'+b.loss+'"></div><button class="ai-metric-btn" type="button" data-inc="loss">+</button></div></div>';
    html += '</div>';
    if(clamped){
      html += '<div class="ai-clamp">For a larger goal, please talk to a doctor <a href="#" data-book-doctor>book a consultation</a></div>';
    }
    html += '<label class="ai-check"><input type="checkbox" id="adult" '+(b.adult?'checked':'')+'> <span>I am 18 or older</span></label>';
    if(shareHtml) html += shareHtml;
    html += '<button class="ai-btn" id="body-goal-next" type="button" '+(b.adult?'':'disabled')+'>Next</button>';
    render(html);
    // bind
    const back = $('.ai-back'); if(back) back.onclick = ()=>{ if(history.length>1) history.back(); else go('#/body/upload'); };
    // ranges
    $$('[data-range]').forEach(r=>{ r.oninput = (e)=>{
      const k = e.target.getAttribute('data-range');
      if(k==='weight') S.body.weight = clamp(+e.target.value,40,160);
      if(k==='height') S.body.height = clamp(+e.target.value,120,220);
      if(k==='loss') S.body.loss = clamp(+e.target.value,0,30);
      checkGoalClamp();
      renderBodyGoal();
    };});
    // inc/dec with hold? simple
    $$('[data-inc]').forEach(btn=>{ btn.onclick = ()=>{ const k=btn.getAttribute('data-inc'); if(k==='weight')S.body.weight=clamp(S.body.weight+1,40,160); if(k==='height')S.body.height=clamp(S.body.height+1,120,220); if(k==='loss'){ S.body.loss=clamp(S.body.loss+0.5,0,30); checkGoalClamp(); } renderBodyGoal(); };});
    $$('[data-dec]').forEach(btn=>{ btn.onclick = ()=>{ const k=btn.getAttribute('data-dec'); if(k==='weight')S.body.weight=clamp(S.body.weight-1,40,160); if(k==='height')S.body.height=clamp(S.body.height-1,120,220); if(k==='loss'){ S.body.loss=clamp(S.body.loss-0.5,0,30); checkGoalClamp(); } renderBodyGoal(); };});
    // edit
    $$('[data-edit]').forEach(btn=>{ btn.onclick = ()=>{
      const k = btn.getAttribute('data-edit');
      const cur = k==='loss'?S.body.loss:(k==='weight'?S.body.weight:S.body.height);
      const inp = document.createElement('input'); inp.type='number'; inp.className='ai-metric-input'; inp.value = k==='loss'?cur.toFixed(1):cur;
      if(k==='loss'){ inp.step='0.5'; inp.min='0'; inp.max='30'; }
      if(k==='weight'){ inp.step='1'; inp.min='40'; inp.max='160'; }
      if(k==='height'){ inp.step='1'; inp.min='120'; inp.max='220'; }
      btn.replaceWith(inp); inp.focus(); inp.select();
      const commit = ()=>{
        let v = parseFloat(inp.value);
        if(isNaN(v)) v = cur;
        if(k==='weight') S.body.weight = Math.round(clamp(v,40,160));
        if(k==='height') S.body.height = Math.round(clamp(v,120,220));
        if(k==='loss'){ v = Math.round(clamp(v,0,30)*2)/2; S.body.loss = v; checkGoalClamp(); }
        renderBodyGoal();
      };
      inp.onblur = commit; inp.onkeydown = (e)=>{ if(e.key==='Enter'){e.preventDefault(); inp.blur();} if(e.key==='Escape'){e.preventDefault(); renderBodyGoal();}};
    };});
    const adult = $('#adult'); if(adult){ adult.onchange = ()=>{ S.body.adult = adult.checked; const nxt=$('#body-goal-next'); if(nxt) nxt.disabled = !adult.checked; }; }
    const nxt = $('#body-goal-next'); if(nxt){ nxt.onclick = ()=>{
      if(!S.body.adult) return;
      checkGoalClamp();
      if(BODY_CFG.verifyContact){
        go('#/body/verify');
      }else{
        go('#/body/result');
      }
    };}
    const bd = $$('[data-book-doctor]'); bd.forEach(x=>x.onclick=(e)=>{e.preventDefault(); book('consultation');});
    const h1 = $('#ai-h'); if(h1) h1.focus({preventScroll:true});
  }

  function renderBodyVerify(){
    render('<div class="aiapp"><div style="padding:40px 20px;text-align:center">Verify</div></div>');
  }

  function renderBodyResult(){
    const b = S.body;
    if(!S.body.monthReady && !S.body.monthTimer){
      S.body.monthTimer = setTimeout(()=>{ S.body.monthReady = true; route(); }, 4000);
    }
    let html = top('body', 4, 'Your preview', 4);
    html += '<div class="ai-illus">Illustrative preview, not a guarantee or medical advice.</div>';
    html += '<div class="ai-res-head"><button class="ai-res-btn" id="res-back" aria-label="Back">←</button><button class="ai-res-btn" id="res-restart" aria-label="Restart">⟳</button></div>';
    html += '<div class="ai-tabs" role="tablist" aria-label="Preview tabs"><button class="ai-tab" data-tab="0" role="tab" aria-selected="true">Now</button><button class="ai-tab" data-tab="1" role="tab" aria-selected="false">Month 1</button><button class="ai-tab" data-tab="2" role="tab" aria-selected="false">With ambassador <span class="ai-lock">🔒</span></button></div>';
    // image card
    if(S.body.tab === 1 && !S.body.monthReady){
      html += '<div class="ai-imgcard glass-card"><div class="ai-imgwrap ai-blur"><img src="'+esc(S.url||MASCOT)+'" alt="User photo"><div class="ai-loadpanel glass-card"><div class="ai-spinner"></div><div class="ai-loadtxt">Creating your preview...</div><div class="ai-loadsub">This takes 1-2 minutes. Please keep this page open.</div></div></div></div>';
    }else{
      html += '<div class="ai-imgcard glass-card"><div class="ai-imgwrap"><img src="'+esc(S.url||MASCOT)+'" alt="User photo"><span class="ai-badge">'+(S.body.tab===1?'Month 1 change':'Your photo')+'</span><button class="ai-enlarge" id="enlarge" type="button">Enlarge</button></div></div>';
    }
    html += '<div class="ai-est">Estimated cost of your course: about '+BODY_CFG.priceEstimate+' '+esc(BODY_CFG.currencyLabel)+'</div>';
    html += '<div class="ai-estnote">The first course is firm; the final amount is set by the doctor after a consultation.</div>';
    html += '<button class="ai-btn" id="book-cons">Book a free consultation</button><button class="ai-btn ghost" id="send-plan">Send me the plan and price</button>';
    render(html);
    const back = $('.ai-back'); if(back) back.onclick = ()=>{ go('#/body/goal'); };
    $('#res-back').onclick = ()=>{ go('#/body/goal'); };
    $('#res-restart').onclick = ()=>{ location.hash='#/start'; };
    $$('.ai-tab').forEach(t=>{ t.onclick = ()=>{
      const idx = +t.getAttribute('data-tab');
      if(idx===2){
        if(BODY_CFG.shareUnlock){
          // show share overlay? just alert or simple overlay
          alert('Share to unlock');
        }
        return;
      }
      S.body.tab = idx;
      route();
    };});
    $('#book-cons').onclick = ()=>{ book('consultation'); };
    $('#send-plan').onclick = ()=>{
      // simple sheet
      const ov = document.createElement('div'); ov.className='ai-ov'; ov.innerHTML='<div class="ai-sheet2"><button class="ai-sheet2-x" id="spx">×</button><div class="ai-sheet2-title">Send me the plan and price</div><div class="ai-field"><label>Name</label><input id="sp-name"></div><div class="ai-field"><label>Email or phone</label><input id="sp-contact"></div><button class="ai-btn" id="spsend">Send</button></div>';
      document.body.appendChild(ov);
      $('#spx').onclick=()=>ov.remove();
      $('#spsend').onclick=async ()=>{
        const name=$('#sp-name').value, c=$('#sp-contact').value;
        try{ await api.sendPlanPrice({name,email:c.includes('@')?c:'',phone:c.includes('@')?'':c}); alert('Sent'); ov.remove(); }catch(e){alert('Error');}
      };
    };
    if($('#enlarge')){
      $('#enlarge').onclick = ()=>{
        const ov = document.createElement('div'); ov.className='ai-ov'; ov.innerHTML='<div class="ai-light"><button class="ai-light-x" id="lx">×</button><img src="'+esc(S.url||MASCOT)+'"></div>';
        document.body.appendChild(ov);
        $('#lx').onclick=()=>ov.remove();
        ov.onclick=(e)=>{ if(e.target===ov) ov.remove(); };
      };
    }
    const h1 = $('#ai-h'); if(h1) h1.focus({preventScroll:true});
  }

  function route() {
    S.tok++; timers.forEach(clearInterval); timers = [];
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/');
    const kind = parts[0], step = parts[1];
    // body flow override
    if(kind === 'body'){
      if(!step || step === 'upload'){
        // reuse existing upload logic
        let html = top('body', 0, 'Upload photo', 4);
        html += '<p class="ai-sub">Choose a photo</p><div class="ai-drop" id="drop">' + (S.url ? '<img src="'+esc(S.url)+'" alt="Your photo preview">' : '<p>Drag a photo here, or choose one below.</p>') + '</div>' +
          '<div class="ai-row"><label class="ai-btn ghost">'+ic(P.up)+' Choose a photo<input id="f1" type="file" accept="image/*" hidden></label>' +
          '<label class="ai-btn ghost">'+ic(P.cam)+' Take a photo<input id="f2" type="file" accept="image/*" capture="user" hidden></label></div>' +
          '<p class="ai-err" id="err" role="alert"></p>' +
          '<div style="display:flex;gap:8px;margin-top:12px"><button class="ai-btn ghost" style="width:auto" id="bup-back">Back</button><button class="ai-btn" style="width:auto" id="bup-next" '+(S.photo?'':'disabled')+'>Continue</button></div>';
        render(html);
        const back = $('.ai-back'); if(back) back.onclick = ()=>{ go('#/start'); };
        $('#bup-back').onclick = ()=>{ go('#/start'); };
        ['f1','f2'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange=e=>take(e.target.files&&e.target.files[0]); });
        const d=$('#drop'); if(d){ ['dragover','dragenter'].forEach(t=>d.addEventListener(t,e=>{e.preventDefault();d.classList.add('over');})); ['dragleave','drop'].forEach(t=>d.addEventListener(t,e=>{e.preventDefault();d.classList.remove('over');})); d.addEventListener('drop',e=>take(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0])); }
        $('#bup-next').onclick = ()=>{ if(S.photo) go('#/body/goal'); };
        window.scrollTo(0,0); const h1=$('#ai-h'); if(h1) h1.focus({preventScroll:true}); return;
      }
      if(step === 'goal'){
        renderBodyGoal(); return;
      }
      if(step === 'verify'){
        if(!BODY_CFG.verifyContact){ go('#/body/result', true); return; }
        // bottom sheet style
        let html = top('body', 2, 'Verify your contact', 4);
        html += '<div class="ai-illus">Illustrative preview, not a guarantee or medical advice.</div>';
        html += '<p class="ai-sub">Verify your contact</p><p class="ai-text">Enter the 6-digit code sent to you</p>';
        html += '<div class="ai-code" id="codebox"><input maxlength="1" inputmode="numeric"><input maxlength="1" inputmode="numeric"><input maxlength="1" inputmode="numeric"><input maxlength="1" inputmode="numeric"><input maxlength="1" inputmode="numeric"><input maxlength="1" inputmode="numeric"></div>';
        html += '<button class="ai-btn" id="vconfirm">Confirm and continue</button><button class="ai-btn ghost" id="vchange">Change number</button><div class="ai-resend">Resend in <span id="vcd">60</span>s</div>';
        render(html);
        const back = $('.ai-back'); if(back) back.onclick = ()=>{ go('#/body/goal'); };
        const inputs = $$('.ai-code input');
        inputs.forEach((inp,i)=>{ inp.oninput=()=>{
          inp.value = inp.value.replace(/\D/g,'').slice(0,1);
          if(inp.value && i<5) inputs[i+1].focus();
        }; inp.onkeydown=(e)=>{ if(e.key==='Backspace' && !inp.value && i>0){ inputs[i-1].focus(); } }; });
        // paste
        inputs[0].addEventListener('paste',(e)=>{
          const data = (e.clipboardData||window.clipboardData).getData('text')||'';
          const digits = data.replace(/\D/g,'').slice(0,6).split('');
          digits.forEach((d,j)=>{ if(inputs[j]) inputs[j].value=d; });
          if(digits.length) inputs[Math.min(5,digits.length-1)].focus();
          e.preventDefault();
        });
        let cd=60; const cdel=$('#vcd'); const iv=setInterval(()=>{cd--; if(cdel) cdel.textContent=cd; if(cd<=0){ clearInterval(iv); }},1000);
        $('#vconfirm').onclick = async ()=>{
          const code = inputs.map(x=>x.value).join('');
          try{ await api.verifyContact(code); go('#/body/result'); }catch(e){ alert('Error'); }
        };
        $('#vchange').onclick = ()=>{ go('#/body/goal'); };
        const h1=$('#ai-h'); if(h1) h1.focus({preventScroll:true}); return;
      }
      if(step === 'result'){
        renderBodyResult(); return;
      }
    }

    let html = '', bind = () => {};
    if (FLOW[kind]) {
      const idx = FLOW[kind].indexOf(step) + 1;
      if (!idx) return go('#/start', true);
      if (idx > 1 && !S.photo) return go('#/' + kind + '/upload', true);
      html = top(kind, idx, TITLES[step]);
      const next = '#/' + kind + '/' + FLOW[kind][idx];
      if (step === 'upload') { html += picker(kind); bind = () => bindPicker(next); }
      else if (step === 'areas') {
        html += '<p class="ai-sub">Choose the areas you would like to preview.</p><div class="ai-chips" id="areas">' + AREAS.map(a => '<button type="button" class="chip' + (S.areas.has(a) ? ' on' : '') + '" aria-pressed="' + S.areas.has(a) + '">' + esc(a) + '</button>').join('') + '</div>' +
          '<label class="ai-lab" for="lv">Intensity: <b id="lvt">' + esc(LEVELS[S.level]) + '</b></label><input id="lv" class="ai-range" type="range" min="0" max="2" step="1" value="' + S.level + '"><div class="ai-scale"><span>Natural</span><span>Balanced</span><span>Noticeable</span></div>' +
          '<button class="ai-btn" id="next" type="button"' + (S.areas.size ? '' : ' disabled') + '>Create my preview ' + ic(P.next) + '</button>';
        bind = () => {
          const areas = $('#areas'); if (areas) areas.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const a = b.textContent; S.areas.has(a) ? S.areas.delete(a) : S.areas.add(a); b.classList.toggle('on'); b.setAttribute('aria-pressed', S.areas.has(a) ? 'true' : 'false'); const nxt=$('#next'); if(nxt) nxt.disabled = !S.areas.size; });
          const lv = $('#lv'); if(lv) lv.addEventListener('input', e => { S.level = +e.target.value; const lvt=$('#lvt'); if(lvt) lvt.textContent = LEVELS[S.level]; });
          const nxt=$('#next'); if(nxt) nxt.addEventListener('click', () => S.areas.size && go(next));
        };
      } else if (step === 'goal') {
        html += '<p class="ai-sub">Tell us about your target.</p><label class="ai-lab" for="gl">Target weight change: <b id="glt">' + S.goal + ' kg</b></label><input id="gl" class="ai-range" type="range" min="2" max="30" step="1" value="' + S.goal + '"><div class="ai-scale"><span>2 kg</span><span>30 kg</span></div>' +
          '<button class="ai-btn" id="next" type="button">Create my preview ' + ic(P.next) + '</button>';
        bind = () => { const gl=$('#gl'); if(gl) gl.addEventListener('input', e => { S.goal = +e.target.value; const glt=$('#glt'); if(glt) glt.textContent = S.goal + ' kg'; }); const nxt=$('#next'); if(nxt) nxt.addEventListener('click', () => go(next)); };
      } else if (step === 'processing') {
        html += '<div class="ai-proc"><div class="ai-photo"><img src="' + esc(S.url) + '" alt=""><span class="scan"></span></div><p class="ai-live" id="live" aria-live="polite">Detecting ' + (kind === 'face' ? 'your face' : 'your silhouette') + '</p></div>';
        bind = () => processing(kind);
      } else {
        const r = S.result || {};
        const chips = kind === 'face' ? [...S.areas].map(a => '<span class="chip on">' + esc(a) + '</span>').join('') + '<span class="chip">' + esc(LEVELS[S.level]) + '</span>' : '<span class="chip">Target: ' + S.goal + ' kg</span>';
        html += (api.demo ? '<p class="ai-ribbon">Demo preview - not a real analysis. The "after" image is a placeholder.</p>' : '') + slider(S.url, r.afterUrl || S.url) +
          '<div class="ai-chips">' + chips + '</div><p class="ai-note">' + esc(r.summary || '') + '</p>' +
          '<button class="ai-btn" id="bk" type="button">Book an appointment</button><a class="ai-btn ghost" href="#/' + kind + '/' + (kind === 'face' ? 'areas' : 'goal') + '">Try again</a>';
        bind = () => { const ba=$('.ba input'); if(ba) ba.addEventListener('input', e => { const b=$('.ba'); if(b) b.style.setProperty('--pos', e.target.value + '%'); }); const bk=$('#bk'); if(bk) bk.addEventListener('click', ()=>book()); };
      }
    } else if (kind === 'ask') {
      if (!S.chat.length) S.chat.push({ r: 'a', t: 'Hi, I am the Lemon assistant. Ask me anything about treatments, prices or booking.' });
      html = top('ask', 0, 'Ask us') + '<div class="ai-chat" id="chat" aria-live="polite"></div><div class="ai-chips" id="sug">' +
        ['How much does a lip filler cost?', 'Is it painful?', 'How long do results last?'].map(q => '<button type="button" class="chip">' + esc(q) + '</button>').join('') +
        '</div><form id="cf" class="ai-msg"><input id="ci" placeholder="Type your question" maxlength="400" autocomplete="off" aria-label="Your question"><button class="ai-send" aria-label="Send">' + ic(P.next) + '</button></form>';
      bind = () => { drawChat(); const sug=$('#sug'); if(sug) sug.addEventListener('click', e => { if(e.target.classList.contains('chip')) send(e.target.textContent); }); const cf=$('#cf'); if(cf) cf.addEventListener('submit', e => { e.preventDefault(); const i=$('#ci'); if(i){ send(i.value); i.value=''; } }); };
    } else {
      html = top(null, 0, 'AI Smart Mirror') + '<p class="ai-sub">A real preview on your own photo, in seconds.</p>';
      if (api.demo || api.configured()) {
        const card = (h, t, d) => '<a class="ai-card" href="' + h + '"><img src="' + MASCOT + '" alt="" width="48" height="84"><span><b>' + esc(t) + '</b><small>' + esc(d) + '</small></span>' + ic(P.next) + '</a>';
        html += card('#/face/upload', 'Face', 'See filler and contour on your own photo before injection.') + card('#/body/upload', 'Body', 'See yourself after weight loss.') + card('#/ask', 'Any questions? Ask us', 'Chat with the Lemon assistant.');
        if (api.demo) html += '<p class="ai-ribbon">Demo preview - not a real analysis.</p>';
      } else {
        html += '<div class="ai-notice"><p>Our AI analysis is being upgraded. Please contact us to book a consultation.</p><button class="ai-btn" id="cc" type="button">Contact us</button></div>';
        bind = () => { const cc=$('#cc'); if(cc) cc.addEventListener('click', contact); };
      }
      html += '<p class="ai-foot">Your photo is used only for this analysis and does not replace a doctor\'s examination.</p>';
    }
    render(html);
    const back = $('.ai-back'); if (back) back.addEventListener('click', () => { if(history.length>1){ history.back(); } else { go('#/start'); } });
    bind(); window.scrollTo(0, 0);
    const h1 = $('#ai-h'); if (h1) h1.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', () => { S.navs++; route(); });
  // initialize defaults
  if(S.body.weight===undefined){ S.body={weight:80,height:170,loss:8,adult:false,tab:0,monthReady:false,monthTimer:null}; }
  route();
})();
