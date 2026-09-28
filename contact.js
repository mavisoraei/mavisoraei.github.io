/*! contact.js */
(function () {
  'use strict';

  const f = '989004709161';

  function s(e) {
    if (!e) return e;
    return e.replace(/[۰-۹]/g, t => String(t.charCodeAt(0) - 1776))
            .replace(/[٠-٩]/g, t => String(t.charCodeAt(0) - 1632));
  }

  function i() {
    const e = document.getElementById('booking');
    if (!e || e.dataset.bound) return;
    e.dataset.bound = '1';
    const t = e.elements.namedItem('phone');
    if (t) {
      t.addEventListener('input', () => {
        const o = s(t.value);
        if (o !== t.value) t.value = o;
      });
    }
    e.addEventListener('submit', o => {
      o.preventDefault();
      const company = e.elements.namedItem('company');
      if (company && company.value) return;
      const n = e.elements.namedItem('phone');
      if (n) n.value = s(n.value);
      if (n && (!n.value || !n.checkValidity())) { n.focus(); return; }
      const m = e.elements.namedItem('name') ? e.elements.namedItem('name').value : '-' || '-';
      const l = e.elements.namedItem('service') ? e.elements.namedItem('service').value : '-';
      const p = e.elements.namedItem('note') ? e.elements.namedItem('note').value : '-' || '-';
      const v = `New Booking Inquiry:
Name: ${m}
Phone: ${n ? n.value : ''}
Service: ${l}
Note: ${p}`;
      const d = `https://wa.me/${f}?text=${encodeURIComponent(v)}`;
      const a = e.querySelector('button[type="submit"]');
      if (a) { a.disabled = true; a.textContent = '...'; }
      if (!window.open(d, '_blank')) {
        window.location.href = d;
        return;
      }
      const u = document.getElementById('booking-done');
      const c = e.parentElement ? e.parentElement.querySelector('.ct-hint') : null;
      if (u) { e.hidden = true; if (c) c.hidden = true; u.hidden = false; }
    });
  }

  function r() {
    const e = document.getElementById('ct-ai-cta');
    if (!e || e.dataset.bound) return;
    e.dataset.bound = '1';
    e.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('lemon:open-consult'));
    });
  }

  function initContact() {
    i();
    r();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact, { once: true });
  } else {
    initContact();
  }
  document.addEventListener('astro:page-load', initContact);
})();
