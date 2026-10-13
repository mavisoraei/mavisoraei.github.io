// ai-flow.js - AI Face Analysis Flow
// Adapter config as specified

const AI = {
  api: '',
  analyze: '/analyze',
  otpSend: '/otp/send',
  otpVerify: '/otp/verify',
  simulate: '/simulate',
  status: '/simulate/'
};

// Sample/demo values
const DEMO_VALUES = {
  score: 84,
  label: 'Natural beauty',
  apparentAge: 24,
  summary: 'Balanced proportions with natural harmony.',
  subscores: {
    symmetry: 86,
    eyes: 82,
    nose: 88,
    lips: 84,
    jaw: 80
  },
  treatments: ['Natural lip filler - Natural, balanced volume'],
  beforeImage: '/images/ai/ba-before-900.webp',
  afterImage: '/images/ai/ba-after-900.webp'
};

const PHOTO_RETENTION_TEXT = 'Your photo is kept for up to 6 months and then deleted automatically.';

let currentStep = '#/start';
let selectedPhoto = null;
let selectedPhotoDataUrl = null;
let treatments = new Set();
let otpTimer = null;
let otpSeconds = 60;

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function updateProgress(stepIndex) {
  const segs = $all('.ai-progress-seg');
  segs.forEach((seg, i) => {
    seg.classList.toggle('is-done', i < stepIndex);
  });
}

function setStep(hash) {
  currentStep = hash;
  $all('.ai-screen').forEach(s => s.classList.remove('is-active'));
  const target = document.querySelector(`.ai-screen[data-step="${hash}"]`);
  if (target) {
    target.classList.add('is-active');
    const titleEl = target.querySelector('.ai-h1, .ai-h2');
    if (titleEl) {
      titleEl.setAttribute('tabindex', '-1');
      setTimeout(() => titleEl.focus(), 50);
    }
  }
  // Update progress
  const stepMap = {
    '#/start': 0,
    '#/capture': 1,
    '#/confirm': 2,
    '#/analyzing': 3,
    '#/result': 4,
    '#/treatments': 5,
    '#/generating': 6,
    '#/final': 7
  };
  updateProgress(stepMap[hash] || 0);
  // Update step title
  const stepTitles = {
    '#/start': 'Start',
    '#/capture': 'Capture',
    '#/confirm': 'Confirm',
    '#/analyzing': 'Analyzing',
    '#/result': 'Result',
    '#/treatments': 'Treatments',
    '#/generating': 'Generating',
    '#/final': 'Final'
  };
  $('#step-title').textContent = stepTitles[hash] || 'AI Analysis';
  window.location.hash = hash;
}

function showUpgradeMessage() {
  $('#ai-flow-wrap').style.display = 'none';
  $('#ai-upgrade').style.display = 'block';
}

function init() {
  const url = new URL(window.location.href);
  const url = new URL(window.location.href);
  const demo = url.searchParams.get("demo");
  const DEMO_MODE = true;\n  let hasDemo = true;
  
  if (hasDemo) {
    $('#demo-ribbon').classList.add('is-visible');
  }
  
  // Set up navigation
  $('#back-btn').addEventListener('click', () => {
    const steps = ['#/start', '#/capture', '#/confirm', '#/analyzing', '#/result', '#/treatments', '#/generating', '#/final'];
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      setStep(steps[idx - 1]);
    } else {
      history.back();
    }
  });
  
  // Start screen
  $('#start-face').addEventListener('click', () => setStep('#/capture'));
  $('#start-body').addEventListener('click', () => {
    alert('Body analysis coming soon');
  });
  $('#ask-us').addEventListener('click', () => {
    if (window.LemonBooking && typeof window.LemonBooking.open === 'function') {
      window.LemonBooking.open();
    } else {
      window.location.href = 'contact.html';
    }
  });
  
  // Capture screen
  $('#btn-camera').addEventListener('click', () => {
    $('#camera-input').click();
  });
  $('#btn-gallery').addEventListener('click', () => {
    $('#gallery-input').click();
  });
  
  $('#camera-input').addEventListener('change', handlePhotoSelect);
  $('#gallery-input').addEventListener('change', handlePhotoSelect);
  
  // Confirm screen
  $('#btn-change').addEventListener('click', () => setStep('#/capture'));
  $('#btn-continue').addEventListener('click', () => {
    setStep('#/analyzing');
    startAnalyzing();
  });
  
  // Treatments
  $all('.ai-treat-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx);
      const isSelected = card.classList.contains('is-selected');
      if (isSelected) {
        card.classList.remove('is-selected');
        treatments.delete(idx);
      } else {
        card.classList.add('is-selected');
        treatments.add(idx);
      }
      $('#treat-counter').textContent = `${treatments.size} of 4 treatments selected`;
    });
  });
  $('#btn-simulate').addEventListener('click', () => {
    setStep('#/generating');
    startGenerating();
  });
  
  // Final
  $('#btn-book').addEventListener('click', () => {
    if (window.LemonBooking && typeof window.LemonBooking.open === 'function') {
      window.LemonBooking.open();
    } else {
      window.location.href = 'contact.html';
    }
  });
  $('#btn-try').addEventListener('click', () => setStep('#/treatments'));
  
  // Bottom sheet
  $('#btn-send-code').addEventListener('click', () => {
    const name = $('#name-input').value.trim();
    const phone = $('#phone-input').value.trim();
    if (name && phone) {
      $('#sheet-step1').style.display = 'none';
      $('#sheet-step2').style.display = 'block';
      startOtpTimer();
    } else {
      alert('Please enter your name and mobile number');
    }
  });
  $('#btn-verify').addEventListener('click', () => {
    $('#verification-sheet').classList.remove('is-open');
    populateResult();
    setStep('#/result');
  });
  $('#change-number').addEventListener('click', () => {
    $('#sheet-step2').style.display = 'none';
    $('#sheet-step1').style.display = 'block';
    stopOtpTimer();
  });
  $('#resend-code').addEventListener('click', () => {
    if (otpSeconds <= 0) {
      startOtpTimer();
    }
  });
  
  // Handle hash
  const initialHash = window.location.hash || '#/start';
  setStep(initialHash);
  window.addEventListener('hashchange', () => {
    setStep(window.location.hash || '#/start');
  });
}

function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    selectedPhotoDataUrl = ev.target.result;
    selectedPhoto = file;
    // Resize if needed
    resizeImage(selectedPhotoDataUrl, 1280, 1280, (resized) => {
      selectedPhotoDataUrl = resized;
      $('#confirm-photo').src = resized;
      setStep('#/confirm');
    });
  };
  reader.readAsDataURL(file);
}

function resizeImage(dataUrl, maxW, maxH, cb) {
  const img = new Image();
  img.onload = () => {
    let w = img.width;
    let h = img.height;
    if (w <= maxW && h <= maxH) {
      cb(dataUrl);
      return;
    }
    const ratio = Math.min(maxW / w, maxH / h);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    cb(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.src = dataUrl;
}

function startAnalyzing() {
  const items = $all('.ai-list-item');
  let idx = 0;
  function next() {
    if (idx < items.length) {
      items[idx].classList.add('is-done');
      idx++;
      setTimeout(next, 400);
    } else {
      // Show verification sheet
      setTimeout(() => {
        $('#verification-sheet').classList.add('is-open');
        $('#sheet-step1').style.display = 'block';
        $('#sheet-step2').style.display = 'none';
        $('#name-input').value = '';
        $('#phone-input').value = '';
        otpSeconds = 60;
      }, 300);
    }
  }
  next();
}

function startOtpTimer() {
  stopOtpTimer();
  $('#resend-code').disabled = true;
  $('#resend-text').textContent = `Resend in ${otpSeconds} seconds`;
  otpTimer = setInterval(() => {
    otpSeconds--;
    $('#resend-text').textContent = `Resend in ${otpSeconds} seconds`;
    if (otpSeconds <= 0) {
      stopOtpTimer();
      $('#resend-text').textContent = 'Resend code';
      $('#resend-code').disabled = false;
    }
  }, 1000);
}

function stopOtpTimer() {
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
}

function populateResult() {
  const data = DEMO_VALUES;
  $('#score-num').textContent = data.score + '/100';
  $('#score-label').textContent = data.label;
  $('#apparent-age').textContent = 'Apparent age ' + data.apparentAge;
  $('#summary-text').textContent = data.summary;
  
  // Bars
  const bars = [
    { el: '#bar-sym', val: data.subscores.symmetry },
    { el: '#bar-eyes', val: data.subscores.eyes },
    { el: '#bar-nose', val: data.subscores.nose },
    { el: '#bar-lips', val: data.subscores.lips },
    { el: '#bar-jaw', val: data.subscores.jaw }
  ];
  bars.forEach(b => {
    $(b.el).style.width = b.val + '%';
    $(b.el).parentElement.previousElementSibling.querySelector('.ai-bar-val').textContent = b.val + '%';
  });
}

function startGenerating() {
  let pct = 9;
  const bar = $('#gen-bar');
  const text = $('#gen-text');
  function update() {
    bar.style.width = pct + '%';
    text.textContent = `Analyzing faces... ${pct}%`;
    pct += 8 + Math.floor(Math.random() * 6);
    if (pct > 100) pct = 100;
    if (pct < 100) {
      setTimeout(update, 400);
    } else {
      setTimeout(() => {
        // Setup final
        $('#ba-before').src = DEMO_VALUES.beforeImage;
        $('#ba-after').src = DEMO_VALUES.afterImage;
        setupBeforeAfter();
        setStep('#/final');
      }, 600);
    }
  }
  update();
}

function setupBeforeAfter() {
  const wrap = $('#ba-wrap');
  if (!wrap) return;
  let isDown = false;
  function setPos(x) {
    const rect = wrap.getBoundingClientRect();
    let pct = ((x - rect.left) / rect.width) * 100;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    wrap.style.setProperty('--pos', pct + '%');
    $('#ba-before').style.width = pct + '%';
    $('#ba-handle').style.left = pct + '%';
  }
  wrap.addEventListener('pointerdown', (e) => {
    isDown = true;
    wrap.setPointerCapture(e.pointerId);
    setPos(e.clientX);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    setPos(e.clientX);
  });
  wrap.addEventListener('pointerup', (e) => {
    isDown = false;
    try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
  });
  wrap.addEventListener('pointercancel', (e) => {
    isDown = false;
    try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
  });
  wrap.addEventListener('click', (e) => {
    setPos(e.clientX);
  });
}

document.addEventListener('DOMContentLoaded', init);








\n// ensure face/body click routing\nif (document.getElementById('face-start')) {\n  const el = document.getElementById('face-start');\n  el.addEventListener('click', function(e){ e.preventDefault(); window.location.hash = '#/capture'; });\n  el.addEventListener('touchend', function(e){ e.preventDefault(); window.location.hash = '#/capture'; });\n}\nif (document.getElementById('body-start')) {\n  const el = document.getElementById('body-start');\n  el.addEventListener('click', function(e){ e.preventDefault(); window.location.hash = '#/body/upload'; });\n  el.addEventListener('touchend', function(e){ e.preventDefault(); window.location.hash = '#/body/upload'; });\n}\n
if (document.getElementById('face-start')) {
  const el = document.getElementById('face-start');
  el.addEventListener('click', function(e){ e.preventDefault(); window.location.hash = '#/face/upload'; });
  el.addEventListener('touchend', function(e){ e.preventDefault(); window.location.hash = '#/face/upload'; });
  el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); window.location.hash = '#/face/upload'; } });
}
if (document.getElementById('body-start')) {
  const el = document.getElementById('body-start');
  el.addEventListener('click', function(e){ e.preventDefault(); window.location.hash = '#/body/upload'; });
  el.addEventListener('touchend', function(e){ e.preventDefault(); window.location.hash = '#/body/upload'; });
  el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); window.location.hash = '#/body/upload'; } });
}
document.addEventListener('click', function(e){
  const a = e.target.closest('#ask-start');
  if(a){ e.preventDefault(); window.location.hash='#/ask'; }
});
document.addEventListener('click', function(e){
  const a = e.target.closest('#ask-us');
  if(a){ e.preventDefault(); window.location.hash='#/ask'; }
});
if (document.getElementById('chat-send')) {
  const send = () => {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    const box = document.getElementById('chat-box');
    const b = document.createElement('div');
    b.textContent = msg;
    b.style.alignSelf='flex-end';
    b.style.background='#2a2622';
    b.style.color='#fff';
    b.style.padding='8px 12px';
    b.style.borderRadius='12px';
    b.style.maxWidth='70%';
    box.appendChild(b);
    input.value='';
    setTimeout(async () => {
      try {
        const res = await window.AI_API.askQuestion(msg);
        const rb = document.createElement('div');
        rb.textContent = res.answer;
        rb.style.alignSelf='flex-start';
        rb.style.background='#fbf9f5';
        rb.style.border='1px solid rgba(42,38,34,0.08)';
        rb.style.padding='8px 12px';
        rb.style.borderRadius='12px';
        rb.style.maxWidth='70%';
        box.appendChild(rb);
        box.scrollTop = box.scrollHeight;
      } catch(e) {}
    }, 400);
  };
  document.getElementById('chat-send').addEventListener('click', send);
  document.getElementById('chat-input').addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); send(); } });
}
document.addEventListener('DOMContentLoaded', function(){
  const faceFile = document.getElementById('face-file');
  const faceTake = document.getElementById('face-take');
  const faceCont = document.getElementById('face-continue');
  if(faceFile){
    faceFile.addEventListener('change', function(e){
      const f = e.target.files[0];
      if(!f) return;
      APP.state.photo = f;
      const r = new FileReader();
      r.onload = function(ev){
        APP.state.photoDataUrl = ev.target.result;
        const img = document.getElementById('face-preview');
        if(img){ img.src=ev.target.result; img.style.display='block'; }
        if(faceCont) faceCont.disabled=false;
      };
      r.readAsDataURL(f);
    });
  }
  if(faceTake){
    faceTake.addEventListener('click', function(){ alert('Camera not available in this demo'); });
  }
  if(faceCont){
    faceCont.addEventListener('click', function(){
      window.location.hash='#/face/areas';
    });
  }
  const chipsDiv = document.getElementById('area-chips');
  if(chipsDiv && !chipsDiv.dataset.init){
    chipsDiv.dataset.init='1';
    ['Lips','Cheeks','Under-eye','Jawline','Chin','Nose','Forehead'].forEach(a=>{
      const b=document.createElement('button');
      b.textContent=a;
      b.style.margin='4px';
      b.style.padding='6px 10px';
      b.style.borderRadius='999px';
      b.style.border='1px solid rgba(42,38,34,0.3)';
      b.style.background='#fbf9f5';
      b.addEventListener('click', function(){
        if(APP.state.areas.includes(a)) APP.state.areas=APP.state.areas.filter(x=>x!==a);
        else APP.state.areas.push(a);
        b.style.background=APP.state.areas.includes(a)?'#2a2622':'#fbf9f5';
        b.style.color=APP.state.areas.includes(a)?'#fff':'#000';
      });
      chipsDiv.appendChild(b);
    });
  }
  const areasCont = document.getElementById('areas-continue');
  if(areasCont){
    areasCont.addEventListener('click', function(){
      const i = document.getElementById('intensity');
      if(i) APP.state.intensity = ['Natural','Balanced','Noticeable'][parseInt(i.value)];
      window.location.hash='#/face/processing';
      setTimeout(function(){
        document.getElementById('result-img').src = APP.state.photoDataUrl || '/images/ai/ba-before-900.webp';
        window.location.hash='#/face/result';
      }, 1200);
    });
  }
  const bodyFile = document.getElementById('body-file');
  const bodyUp = document.getElementById('body-up-continue');
  if(bodyFile){
    bodyFile.addEventListener('change', function(){
      if(bodyUp) bodyUp.disabled=false;
    });
  }
  if(bodyUp){
    bodyUp.addEventListener('click', function(){
      window.location.hash='#/body/goal';
    });
  }
  const goalCont = document.getElementById('goal-continue');
  if(goalCont){
    goalCont.addEventListener('click', function(){
      const g = document.getElementById('goal');
      if(g) APP.state.goal=parseInt(g.value);
      window.location.hash='#/body/processing';
      setTimeout(function(){
        document.getElementById('body-result-img').src = '/images/ai/ba-before-900.webp';
        window.location.hash='#/body/result';
      }, 1000);
    });
  }
});
