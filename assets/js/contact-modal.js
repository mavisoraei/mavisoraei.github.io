/* contact-modal.js — T2: the "Contact Us" popup for the header and the mobile
   drawer. Builds a native <dialog class="contact-modal">, opened with
   showModal() when a header/drawer link to contact.html is clicked; that link
   keeps its href as the no-JS fallback. Loaded on index.html only. */
(function () {
  'use strict';

  /* Fill the empty values: rows activate automatically */
  var CONTACT = {
    whatsapp: 'https://wa.me/989004709161',
    phone: '+982147009161',
    email: '',
    instagram: 'https://instagram.com/lemonclinic_org',
    linkedin: '',
    maps: 'https://www.google.com/maps?cid=2160021389971725298',
    neshan: 'https://neshan.org/maps/places/abaf5ff52a87d9b2dcf313e9fae7f153',
    balad: 'https://balad.ir/p/%DA%A9%D9%84%DB%8C%D9%86%DB%8C%DA%A9-%D8%B2%DB%8C%D8%A8%D8%A7%DB%8C%DB%8C-%D9%84%D9%85%D9%88%D9%86-tehran-nei-_medical-office-6kHIOEJAGfw5Ep',
    booking: '/contact.html'
  };

  window.LEMON_CONTACT = CONTACT;

  var ADDRESS = 'Tehran, Kharazi Highway, Ardestani Boulevard, Parseh Commercial Complex, 8th Floor';
  var HOURS = 'Saturday to Thursday, 10 to 19';

  if (!document.body) return;
  if (typeof document.createElement('dialog').showModal !== 'function') return;

  var ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.2-.43-4.5-1.24l-.32-.19-3 .78.8-2.92-.2-.33A8.2 8.2 0 1 1 12 20.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 10.8a14 14 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .7-.2 1z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 6 6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var ROWS = [
    { icon: 'whatsapp', label: 'WhatsApp', sub: 'Chat with us', href: CONTACT.whatsapp },
    { icon: 'phone', label: 'Phone', sub: 'Call us', href: CONTACT.phone ? 'tel:' + CONTACT.phone : '' },
    { icon: 'email', label: 'Email', sub: 'Write to us', href: CONTACT.email ? 'mailto:' + CONTACT.email : '' },
    { icon: 'instagram', label: 'Instagram', sub: 'Follow & message', href: CONTACT.instagram },
    { icon: 'linkedin', label: 'LinkedIn', sub: 'Connect', href: CONTACT.linkedin }
  ];

  function makeRow(r) {
    var pending = !r.href;
    var row = pending ? el('span', 'cm-row is-pending') : el('a', 'cm-row');
    if (pending) {
      row.setAttribute('aria-disabled', 'true');
      row.setAttribute('tabindex', '-1');
    } else {
      row.href = r.href;
      if (/^https?:/i.test(r.href)) { row.target = '_blank'; row.rel = 'noopener'; }
    }
    row.appendChild(el('span', 'cm-row-icon', ICONS[r.icon]));
    var text = el('span', 'cm-row-text');
    var label = el('span', 'cm-row-label');
    label.textContent = r.label;
    text.appendChild(label);
    var sub = el('span', 'cm-row-sub');
    sub.textContent = pending ? 'Coming soon' : r.sub;
    text.appendChild(sub);
    row.appendChild(text);
    row.appendChild(el('span', 'cm-row-arrow', ICONS.arrow));
    return row;
  }

  function makePill(label, href) {
    var a = el('a', 'btn-pill');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = label;
    return a;
  }

  function buildDialog() {
    var dialog = el('dialog', 'contact-modal');
    dialog.setAttribute('aria-labelledby', 'cm-title');
    dialog.setAttribute('aria-describedby', 'cm-desc');
    dialog.setAttribute('data-lenis-prevent', '');

    var close = el('button', 'cm-close', ICONS.close);
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    dialog.appendChild(close);

    var eyebrow = el('p', 'cm-eyebrow');
    eyebrow.textContent = 'CONTACT';
    dialog.appendChild(eyebrow);

    var title = el('h2', 'cm-title');
    title.id = 'cm-title';
    title.textContent = "Let's talk";
    dialog.appendChild(title);

    var desc = el('p', 'cm-desc');
    desc.id = 'cm-desc';
    desc.textContent = 'Choose the way that suits you. We reply within working hours.';
    dialog.appendChild(desc);

    var rows = el('div', 'cm-rows');
    ROWS.forEach(function (r) { rows.appendChild(makeRow(r)); });
    dialog.appendChild(rows);

    dialog.appendChild(el('hr', 'cm-hr'));

    var address = el('p', 'cm-address');
    address.textContent = ADDRESS;
    dialog.appendChild(address);

    var hours = el('p', 'cm-hours');
    hours.textContent = HOURS;
    dialog.appendChild(hours);

    var pills = el('div', 'cm-pills');
    pills.appendChild(makePill('Google Maps', CONTACT.maps));
    pills.appendChild(makePill('Neshan', CONTACT.neshan));
    pills.appendChild(makePill('Balad', CONTACT.balad));
    dialog.appendChild(pills);

    var book = el('a', 'cm-book btn-pill btn-pill--dark');
    book.href = CONTACT.booking;
    book.textContent = 'Book Appointment';
    book.addEventListener('click', function (e) {
      if (!window.LemonBooking || typeof window.LemonBooking.open !== 'function') return;
      e.preventDefault();
      dialog.close();
      window.LemonBooking.open({});
    });
    dialog.appendChild(book);

    return dialog;
  }

  var dialog = buildDialog();
  document.body.appendChild(dialog);

  var lastFocus = null;
  var lenis = null;

  function findLenis() {
    var cands = [window.__lenis, window.lenis, window.lenisInstance];
    for (var i = 0; i < cands.length; i++) {
      if (cands[i] && typeof cands[i].stop === 'function') return cands[i];
    }
    return null;
  }

  function lock(on) {
    document.documentElement.classList.toggle('cm-open', on);
    if (on) {
      lenis = findLenis();
      if (lenis) { try { lenis.stop(); } catch (e) { /* unknown shape */ } }
    } else if (lenis) {
      try { lenis.start(); } catch (e) { /* unknown shape */ }
      lenis = null;
    }
  }

  function open(trigger) {
    lastFocus = trigger || document.activeElement;
    lock(true);
    if (!dialog.open) dialog.showModal();
    var closeBtn = dialog.querySelector('.cm-close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) close();
  });

  dialog.querySelector('.cm-close').addEventListener('click', close);

  dialog.addEventListener('close', function () {
    lock(false);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  });

  function isTrigger(a) {
    if (!a || typeof a.getAttribute !== 'function') return false;
    var href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
    if (!/contact\.html$/i.test(href)) return false;
    return !!(a.closest('header') || a.closest('#mobile-drawer'));
  }

  document.addEventListener('click', function (e) {
    var node = e.target;
    while (node && node.nodeType !== 1) node = node.parentNode;
    if (!node || !node.closest) return;
    var a = node.closest('a');
    if (isTrigger(a)) {
      e.preventDefault();
      open(a);
    }
  });
})();
