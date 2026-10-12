/* booking.js — K1: "Book a consultation" modal with a small availability
   calendar. API: window.LemonBooking = { open(opts), mount(el, opts) }.
   Loaded on index.html (dialog) and contact.html (inline mount). */
(function () {
  'use strict';

  /* Fill endpoint when the backend exists */
  const BOOKING = {
    endpoint: '',
    timezone: 'Asia/Tehran',
    openWeekdays: [6, 0, 1, 2, 3, 4],
    opensAt: '10:00',
    closesAt: '19:00',
    slotMinutes: 30,
    horizonDays: 30,
    minLeadHours: 3,
    availabilityUrl: '/data/availability.json'
  };

  const SERVICES = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'fillers', label: 'Fillers' },
    { value: 'botox', label: 'Botox' },
    { value: 'laser', label: 'Laser Hair Removal' },
    { value: 'facial', label: 'Facial' },
    { value: 'rejuvenation', label: 'Rejuvenation' }
  ];

  const WEEKDAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const WEEKDAYS_SHORT = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SUCCESS_IMG = 'https://lemonclinic.org/images/persona/joy.webp';

  const pad = function (n) { return String(n).padStart(2, '0'); };
  const toMin = function (t) { const p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
  const fmtHM = function (m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };

  const el = function (tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* -- Tehran-time helpers (never the visitor's zone) -- */
  const tehranNow = function () {
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: BOOKING.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).forEach(function (p) {
      if (p.type !== 'literal') parts[p.type] = p.value;
    });
    return { date: parts.year + '-' + parts.month + '-' + parts.day, mins: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10) };
  };

  const parseDate = function (ds) { const p = ds.split('-'); return new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10))); };
  const addDays = function (ds, n) {
    const d = parseDate(ds);
    d.setUTCDate(d.getUTCDate() + n);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  };
  const wdayOf = function (ds) { return parseDate(ds).getUTCDay(); };   // 0=Sun .. 6=Sat
  const firstWday = function (y, m) { return (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 1) % 7; }; // Sat=0
  const daysInMonth = function (y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const fmtLong = function (ds) {
    return new Intl.DateTimeFormat('en-US', { timeZone: BOOKING.timezone, weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(ds));
  };

  /* -- availability data -- */
  let blockedDates = null;
  let blockedSlots = null;

  const loadAvailability = function (onReady) {
    fetch(BOOKING.availabilityUrl, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(function (j) {
      blockedDates = new Set(Array.isArray(j.blockedDates) ? j.blockedDates : []);
      blockedSlots = {};
      const slots = j.blockedSlots || {};
      Object.keys(slots).forEach(function (d) {
        blockedSlots[d] = new Set(Array.isArray(slots[d]) ? slots[d] : []);
      });
    }).catch(function () {
      /* fetch failed: all working-hour slots are free */
      blockedDates = new Set();
      blockedSlots = {};
    }).then(function () { if (onReady) onReady(); });
  };

  const isOpenDay = function (ds) { return BOOKING.openWeekdays.indexOf(wdayOf(ds)) !== -1; };
  const isSlotAvail = function (now, ds, t) {
    if (!isOpenDay(ds)) return false;
    if (blockedDates && blockedDates.has(ds)) return false;
    if (blockedSlots && blockedSlots[ds] && blockedSlots[ds].has(t)) return false;
    if (ds === now.date && t < now.mins + BOOKING.minLeadHours * 60) return false;
    return true;
  };
  const slotStarts = function () {
    const out = [];
    let m = toMin(BOOKING.opensAt);
    const end = toMin(BOOKING.closesAt);
    while (m < end) { out.push(fmtHM(m)); m += BOOKING.slotMinutes; }
    return out;
  };

  /* -- shared field factory -- */
  const ICONS = {
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
  };

  const buildForm = function () {
    const form = el('form', 'bk-form');
    form.setAttribute('novalidate', '');
    form.setAttribute('autocomplete', 'on');
    const state = { name: '', phone: '', service: 'consultation', date: null, time: null, notes: '' };
    const uid = 'bk-' + Math.random().toString(36).slice(2, 8);

    const field = function (tag, attrs, cls) {
      const fe = el(tag, cls);
      Object.keys(attrs).forEach(function (k) { fe.setAttribute(k, attrs[k]); });
      return fe;
    };

    /* name + phone row */
    const row = el('div', 'bk-row');
    const nameF = el('label', 'bk-field');
    nameF.appendChild(el('span', 'bk-label', 'Full name'));
    const nameIn = field('input', { type: 'text', id: uid + '-name', name: 'name', autocomplete: 'name', placeholder: 'Your name' }, 'bk-input');
    nameIn.addEventListener('input', function () { state.name = nameIn.value; refresh(); });
    nameF.appendChild(nameIn);
    const nameMsg = el('p', 'bk-fmsg');
    nameMsg.setAttribute('aria-live', 'polite');
    nameF.appendChild(nameMsg);

    const phoneF = el('label', 'bk-field');
    phoneF.appendChild(el('span', 'bk-label', 'Mobile number'));
    const phoneIn = field('input', { type: 'tel', id: uid + '-phone', name: 'phone', inputmode: 'tel', dir: 'ltr', autocomplete: 'tel', placeholder: '0912xxxxxxx' }, 'bk-input');
    phoneIn.addEventListener('input', function () { state.phone = phoneIn.value; refresh(); });
    phoneF.appendChild(phoneIn);
    const phoneMsg = el('p', 'bk-fmsg');
    phoneMsg.setAttribute('aria-live', 'polite');
    phoneF.appendChild(phoneMsg);
    row.appendChild(nameF);
    row.appendChild(phoneF);
    form.appendChild(row);

    /* service select */
    const svcF = el('label', 'bk-field');
    svcF.appendChild(el('span', 'bk-label', 'Service'));
    const svcWrap = el('span', 'bk-select-wrap');
    const svcIn = field('select', { id: uid + '-service', name: 'service' }, 'bk-input bk-select');
    SERVICES.forEach(function (s) {
      const o = el('option', '', s.label);
      o.setAttribute('value', s.value);
      if (s.value === 'consultation') o.setAttribute('selected', '');
      svcIn.appendChild(o);
    });
    svcIn.addEventListener('change', function () { state.service = svcIn.value; refresh(); });
    svcWrap.appendChild(svcIn);
    svcWrap.appendChild(el('span', 'bk-select-arrow', ICONS.chev));
    svcF.appendChild(svcWrap);
    form.appendChild(svcF);

    /* calendar */
    const cal = el('div', 'bk-cal');
    const calHead = el('div', 'bk-cal-head');
    const prev = el('button', 'bk-cal-nav');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous month');
    prev.innerHTML = ICONS.prev;
    const calTitle = el('div', 'bk-cal-title');
    const next = el('button', 'bk-cal-nav');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next month');
    next.innerHTML = ICONS.next;
    calHead.appendChild(prev);
    calHead.appendChild(calTitle);
    calHead.appendChild(next);
    cal.appendChild(calHead);

    const week = el('div', 'bk-cal-week');
    WEEKDAYS_SHORT.forEach(function (w) {
      const ws = el('span', 'bk-wd', w);
      ws.setAttribute('aria-hidden', 'true');
      week.appendChild(ws);
    });
    cal.appendChild(week);

    const daysGrid = el('div', 'bk-cal-days');
    cal.appendChild(daysGrid);

    const timesWrap = el('div', 'bk-times-wrap');
    const timesH = el('p', 'bk-times-h', 'Available times - Tehran time');
    timesH.setAttribute('aria-hidden', 'true');
    const timesGroup = el('div', 'bk-times');
    timesGroup.setAttribute('role', 'radiogroup');
    timesGroup.setAttribute('aria-label', 'Available times');
    const noTimes = el('p', 'bk-notimes');
    timesWrap.appendChild(timesH);
    timesWrap.appendChild(timesGroup);
    timesWrap.appendChild(noTimes);
    cal.appendChild(timesWrap);
    form.appendChild(cal);

    /* summary */
    const summary = el('p', 'bk-summary');
    summary.setAttribute('aria-live', 'polite');
    form.appendChild(summary);

    /* notes + submit */
    const notesF = el('label', 'bk-field');
    notesF.appendChild(el('span', 'bk-label', 'Notes (optional)'));
    const notesIn = field('textarea', { id: uid + '-notes', name: 'notes', rows: '2', placeholder: 'e.g. preferred time' }, 'bk-input bk-textarea');
    notesIn.addEventListener('input', function () { state.notes = notesIn.value; });
    notesF.appendChild(notesIn);
    form.appendChild(notesF);

    const submit = el('button', 'bk-submit', 'Book appointment');
    submit.type = 'button';
    submit.setAttribute('aria-disabled', 'true');
    form.appendChild(submit);

    form.appendChild(el('p', 'bk-form-msg')).setAttribute('aria-live', 'polite');

    /* success state */
    const success = el('div', 'bk-success');
    success.setAttribute('hidden', '');
    const sucImg = el('img', 'bk-suc-img');
    sucImg.src = SUCCESS_IMG;
    sucImg.alt = '';
    sucImg.width = 421;
    sucImg.height = 760;
    sucImg.loading = 'lazy';
    sucImg.decoding = 'async';
    const sucH = el('h3', 'bk-suc-title', 'Request received');
    const sucText = el('p', 'bk-suc-text');
    const done = el('button', 'bk-suc-done btn-pill', 'Done');
    done.type = 'button';
    success.appendChild(sucImg);
    success.appendChild(sucH);
    success.appendChild(sucText);
    success.appendChild(done);

    form.appendChild(success);

    /* -- helpers -- */
    const refresh = function () {
      const complete = state.name.trim() !== '' && phoneDigits() >= 10 && state.date && state.time;
      submit.classList.toggle('is-disabled', !complete);
      if (complete) submit.removeAttribute('aria-disabled');
      else submit.setAttribute('aria-disabled', 'true');
      renderSummary();
      clearMsgs();
    };
    const phoneDigits = function () { return (state.phone.replace(/[^0-9]/g, '') || '').length; };
    const clearMsgs = function () {
      nameMsg.textContent = '';
      phoneMsg.textContent = '';
      form.querySelector('.bk-form-msg').textContent = '';
    };
    const failField = function (inp, msg, m) {
      clearMsgs();
      m.textContent = msg;
      inp.focus();
    };
    const renderSummary = function () {
      if (state.date && state.time) {
        summary.textContent = fmtLong(state.date) + ' - ' + state.time + ' (Tehran time)';
      } else {
        summary.textContent = '';
      }
    };

    /* -- calendar -- */
    const view = { y: 0, m: 0, currYm: 0, lastYm: 0 };
    const setView = function (y, m) {
      const now = tehranNow();
      view.y = y;
      view.m = m;
      view.currYm = parseInt(now.date.slice(0, 4), 10) * 100 + parseInt(now.date.slice(5, 7), 10);
      const h = addDays(now.date, BOOKING.horizonDays);
      view.lastYm = parseInt(h.slice(0, 4), 10) * 100 + parseInt(h.slice(5, 7), 10);
      renderCal();
    };

    const renderCal = function () {
      const now = tehranNow();
      calTitle.textContent = MONTHS[view.m - 1] + ' ' + view.y;
      prev.disabled = view.y * 100 + view.m <= view.currYm;
      next.disabled = view.y * 100 + view.m >= view.lastYm;
      daysGrid.textContent = '';
      const lead = firstWday(view.y, view.m);
      const dim = daysInMonth(view.y, view.m);
      for (let i = 0; i < lead; i++) daysGrid.appendChild(el('span', 'bk-cal-void'));
      for (let d = 1; d <= dim; d++) {
        const ds = view.y + '-' + pad(view.m) + '-' + pad(d);
        const open = isOpenDay(ds);
        const avail = open && slotStarts().some(function (t) { return isSlotAvail(now, ds, t); });
        const day = el('button', 'bk-day' + (avail ? ' bk-day--open' : '') + (ds === now.date ? ' bk-day--today' : ''));
        day.type = 'button';
        day.setAttribute('data-date', ds);
        day.textContent = String(d);
        day.setAttribute('aria-label', WEEKDAYS[wdayOf(ds)] + ' ' + d + ' ' + MONTHS[view.m - 1] + (avail ? ', available' : ', not available'));
        if (!avail) {
          day.setAttribute('aria-disabled', 'true');
          day.setAttribute('tabindex', '-1');
        } else {
          day.addEventListener('click', function () {
            selectDay(ds);
          });
        }
        if (state.date === ds) {
          day.classList.add('bk-day--selected');
          day.setAttribute('aria-current', 'date');
        }
        daysGrid.appendChild(day);
      }
    };

    const selectDay = function (ds) {
      state.date = ds;
      const now = tehranNow();
      if (state.time && !isSlotAvail(now, ds, state.time)) state.time = null;
      renderCal();
      renderTimes();
    };

    const renderTimes = function () {
      const now = tehranNow();
      timesGroup.textContent = '';
      noTimes.textContent = '';
      if (!state.date) return;
      const daysSlots = slotStarts().filter(function (t) { return isSlotAvail(now, state.date, t); });
      if (daysSlots.length === 0) {
        noTimes.textContent = 'No free times on this day. Please choose another day.';
        return;
      }
      daysSlots.forEach(function (t) {
        const chip = el('button', 'bk-chip');
        chip.type = 'button';
        chip.setAttribute('role', 'radio');
        chip.setAttribute('name', uid + '-time');
        chip.setAttribute('aria-label', t);
        chip.textContent = t;
        if (state.time === t) {
          chip.classList.add('bk-chip--on');
          chip.setAttribute('aria-checked', 'true');
        }
        chip.addEventListener('click', function () {
          state.time = t;
          renderTimes();
          refresh();
        });
        timesGroup.appendChild(chip);
      });
    };

    const setService = function (v) {
      if (v && SERVICES.some(function (s) { return s.value === v; })) {
        svcIn.value = v;
        state.service = v;
      }
    };

    const reset = function () {
      state.name = ''; state.phone = ''; state.time = null; state.notes = '';
      nameIn.value = ''; phoneIn.value = ''; notesIn.value = '';
      clearMsgs();
      success.setAttribute('hidden', '');
      form.hidden = false;
      refresh();
    };

    const validate = function () {
      clearMsgs();
      if (state.name.trim() === '') { nameMsg.textContent = 'Please enter your name.'; nameIn.focus(); return false; }
      if (phoneDigits() < 10) { phoneMsg.textContent = 'Please enter a mobile number with at least 10 digits.'; phoneIn.focus(); return false; }
      if (!state.date) { form.querySelector('.bk-cal').scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
      if (!state.time) { noTimes.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
      return true;
    };

    const showFormMsg = function (txt, withTel) {
      const m = form.querySelector('.bk-form-msg');
      m.textContent = '';
      m.appendChild(document.createTextNode(txt));
      if (withTel) {
        const a = el('a', 'bk-form-tel', '021 4700 9161');
        a.href = 'tel:+982147009161';
        m.appendChild(a);
      }
    };

    const showSuccess = function () {
      const now = tehranNow();
      sucText.textContent = fmtLong(state.date) + ' at ' + state.time + ' (Tehran time). We will confirm by phone shortly.';
      form.hidden = true;
      success.removeAttribute('hidden');
    };

    const submitFlow = function () {
      if (!validate()) return;
      const data = {
        name: state.name.trim(),
        phone: state.phone.trim(),
        service: SERVICES.filter(function (s) { return s.value === state.service; })[0].label,
        date: state.date,
        time: state.time,
        notes: state.notes.trim(),
        timezone: BOOKING.timezone,
        page: location.pathname
      };
      if (BOOKING.endpoint) {
        fetch(BOOKING.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (r.ok) showSuccess();
          else showFormMsg('We could not send your request. Please call ', true);
        }).catch(function () {
          showFormMsg('We could not send your request. Please call ', true);
        });
      } else {
        fallback(data);
      }
    };

    const fallback = function (data) {
      const c = (window.LEMON_CONTACT && typeof window.LEMON_CONTACT === 'object') ? window.LEMON_CONTACT : {};
      const lines = [
        'New booking request:',
        'Name: ' + data.name,
        'Phone: ' + data.phone,
        'Service: ' + data.service,
        'Date: ' + data.date,
        'Time: ' + data.time,
        data.notes ? 'Notes: ' + data.notes : '',
        'Time zone: ' + data.timezone
      ];
      const text = lines.filter(function (l) { return l; }).join('\n');
      if (c.whatsapp) {
        const sep = c.whatsapp.indexOf('?') === -1 ? '?' : '&';
        window.open(c.whatsapp + sep + 'text=' + encodeURIComponent(text), '_blank');
        showSuccess();
        return;
      }
      if (c.email) {
        location.href = 'mailto:' + c.email + '?subject=' + encodeURIComponent('Consultation booking request') + '&body=' + encodeURIComponent(text);
        showSuccess();
        return;
      }
      showFormMsg('Booking is not connected yet. Please call us on ', true);
    };

    submit.addEventListener('click', submitFlow);
    form.addEventListener('submit', function (e) { e.preventDefault(); submitFlow(); });
    prev.addEventListener('click', function () { setView(view.y, view.m - 1); });
    next.addEventListener('click', function () { setView(view.y, view.m + 1); });
    done.addEventListener('click', function () {
      reset();
      var dlg = form.closest('dialog');
      if (dlg && dlg.open) closeDialog(dlg);
    });

    /* initial view = current Tehran month */
    const now = tehranNow().date;
    const cy = parseInt(now.slice(0, 4), 10);
    const cm = parseInt(now.slice(5, 7), 10);
    setView(cy, cm);
    refresh();

    return { form: form, setService: setService, reset: reset, refresh: refresh };
  };

  /* -- dialog mode -- */
  let dialog = null;
  let lastFocus = null;

  const lock = function (on) {
    document.documentElement.classList.toggle('cm-open', on);
    const lenis = (window.__lenis || window.lenis || window.lenisInstance);
    if (lenis && typeof lenis.stop === 'function') {
      try { if (on) lenis.stop(); else lenis.start(); } catch (e) { /* unknown shape */ }
    }
  };

  const closeDialog = function (dlg) {
    if (dlg) { lock(false); dlg.close(); }
  };

  const buildDialog = function () {
    dialog = el('dialog', 'contact-modal booking-dialog');
    dialog.setAttribute('aria-labelledby', 'bk-title');
    dialog.setAttribute('data-booking-dialog', '');

    const close = el('button', 'cm-close', ICONS.close);
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    dialog.appendChild(close);

    dialog.appendChild(el('p', 'cm-eyebrow', 'BOOKING'));

    const h2 = el('h2', 'cm-title', 'Book a consultation');
    h2.id = 'bk-title';
    dialog.appendChild(h2);

    dialog.appendChild(el('p', 'cm-desc', 'Pick a day and time that suits you.'));

    const ctrl = buildForm();
    dialog._bk = ctrl;
    dialog.appendChild(ctrl.form);

    close.addEventListener('click', function () { closeDialog(dialog); });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener('close', function () {
      lock(false);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    });
    document.body.appendChild(dialog);
  };

  const open = function (opts) {
    opts = opts || {};
    if (!document.body) return;
    if (!('HTMLDialogElement' in window)) {
      const href = document.querySelector('[data-book-open]');
      if (href && href.href) location.href = href.href;
      return;
    }
    if (!dialog) buildDialog();
    lastFocus = document.activeElement;
    lock(true);
    if (!dialog.open) dialog.showModal();
    const ctrl = dialog._bk;
    if (opts.service && ctrl) ctrl.setService(opts.service);
    const first = dialog.querySelector('.bk-input, .bk-select');
    if (first && typeof first.focus === 'function') first.focus();
  };

  /* -- inline mount mode -- */
  const mount = function (target, opts) {
    opts = opts || {};
    if (!target) return;
    const root = el('div', 'bk-inline-box');
    root.appendChild(el('p', 'cm-eyebrow', 'BOOKING'));
    const h2 = el('h2', 'cm-title', 'Book an appointment');
    h2.id = 'bk-inline-title';
    root.appendChild(h2);
    root.appendChild(el('p', 'cm-desc', 'Pick a day and time that suits you.'));
    const ctrl = buildForm();
    if (opts.service) ctrl.setService(opts.service);
    root.appendChild(ctrl.form);
    target.appendChild(root);
  };

  /* hero button + any [data-book-open] */
  document.addEventListener('click', function (e) {
    const a = e.target && e.target.closest ? e.target.closest('[data-book-open]') : null;
    if (!a) return;
    e.preventDefault();
    open({ service: a.getAttribute('data-book-open') || undefined });
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#lemon-booking-inline').forEach(function (m) {
      if (!m.dataset.mounted) { m.dataset.mounted = '1'; mount(m, {}); }
    });
  });
  if (document.readyState !== 'loading') {
    document.querySelectorAll('#lemon-booking-inline').forEach(function (m) {
      if (!m.dataset.mounted) { m.dataset.mounted = '1'; mount(m, {}); }
    });
  }

  loadAvailability();

  window.LemonBooking = { open: open, mount: mount };
})();