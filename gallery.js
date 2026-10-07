/*! gallery.js */
(function () {
  'use strict';

  function S() {
    const o = document.getElementById('nb-gallery');
    if (!o || o.dataset.bound) return;
    o.dataset.bound = '1';
    const m = Array.from(o.querySelectorAll('.nb-card'));
    const c = Array.from(o.querySelectorAll('.nb-chip'));
    const k = (e, t) => (t === 'all' ? true : t.startsWith('g:') ? e.dataset.g === t.slice(2) : t.startsWith('doc:') ? e.dataset.doc === t.slice(4) : true);
    const u = (e, t) => {
      const h = c.find(r => r.dataset.filter === e) || c.find(r => r.dataset.filter === 'all');
      if (!h) return;
      const b = h.dataset.filter;
      c.forEach(r => r.setAttribute('aria-pressed', r === h ? 'true' : 'false'));
      m.forEach(r => r.classList.toggle('is-hidden', !k(r, b)));
      if (t) {
        history.replaceState(null, '', b === 'all' ? location.pathname : '#' + b.replace(':', '='));
      }
    };
    c.forEach(e => e.addEventListener('click', () => u(e.dataset.filter, true)));
    const y = () => {
      const t = decodeURIComponent(location.hash.replace(/^#/, '')).match(/^(doc|g)=(.+)$/);
      return t ? t[1] + ':' + t[2] : null;
    };
    const p = y();
    if (p) u(p, false);
    window.addEventListener('hashchange', () => {
      u(y() || 'all', false);
      const el = document.getElementById('nb-gallery');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    let g = [];
    try {
      const nd = document.getElementById('nb-data');
      if (nd) g = JSON.parse(nd.textContent);
    } catch (err) {}
    const av = {};
    c.forEach(r => {
      const k = r.dataset.filter || '';
      if (k.startsWith('doc:')) {
        const im = r.querySelector('img');
        if (im) av[k.slice(4)] = im.src;
      }
    });
    m.forEach((card, idx) => {
      const t = g[idx];
      if (!t) return;
      const tr = card.querySelector('.nb-treat');
      if (tr && t.t) tr.textContent = t.t;
      const row = card.querySelector('.nb-doc-info');
      const old = card.querySelector('.nb-doc-name');
      if (row && old) {
        const src = av[card.dataset.doc];
        if (src) {
          const im = document.createElement('img');
          im.className = 'nb-ava';
          im.src = src;
          im.width = 24;
          im.height = 24;
          im.alt = '';
          im.loading = 'lazy';
          im.decoding = 'async';
          row.insertBefore(im, old);
        }
        if (t.dn) {
          const a = document.createElement('a');
          a.className = 'nb-doc-name';
          a.textContent = t.dn;
          if (t.dh) a.href = t.dh;
          old.replaceWith(a);
        }
      }
      const view = card.querySelector('.nb-view');
      if (view && t.url) view.href = t.url;
    });
    const n = document.getElementById('nb-lightbox');
    if (!n) return;
    const E = n.querySelector('.nb-lb-img');
    const v = n.querySelector('.nb-lb-t');
    const a = n.querySelector('.nb-lb-doc');
    let l = [];
    let s = 0;
    let d = null;
    const q = () => m.map((e, t) => ({ c: e, i: t })).filter(e => !e.c.classList.contains('is-hidden')).map(e => e.i);
    const L = e => {
      const t = g[e];
      if (!t) return;
      if (E) {
        E.src = '/images/gallery/' + t.id + '-1280.webp';
        E.alt = (t.t || '') + ', before and after at Lemon Clinic' + (t.dn ? ', ' + t.dn : '');
      }
      if (v) { v.textContent = t.t || ''; if (t.url) v.href = t.url; }
      if (a) {
        if (t.dn) { a.textContent = t.dn; if (t.dh) a.href = t.dh; a.hidden = false; }
        else { a.hidden = true; }
      }
    };
    const w = e => {
      l = q();
      s = l.indexOf(e);
      if (s < 0) s = 0;
      d = document.activeElement;
      L(e);
      n.hidden = false;
      n.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      const close = n.querySelector('.nb-lb-close');
      if (close && close.focus) close.focus();
    };
    const f = () => {
      n.classList.remove('is-open');
      n.hidden = true;
      document.body.style.overflow = '';
      if (d && d.focus) d.focus();
    };
    const iDir = e => {
      if (!l.length) return;
      s = (s + e + l.length) % l.length;
      L(l[s]);
    };
    o.querySelectorAll('.nb-media').forEach(e => e.addEventListener('click', () => {
      const idx = m.indexOf(e.closest('.nb-card'));
      if (idx > -1) w(idx);
    }));
    n.addEventListener('click', e => { if (e.target === n) f(); });
    n.querySelectorAll('.nb-lb-prev').forEach(x => x.addEventListener('click', () => iDir(-1)));
    n.querySelectorAll('.nb-lb-next').forEach(x => x.addEventListener('click', () => iDir(1)));
    n.querySelectorAll('.nb-lb-close').forEach(x => x.addEventListener('click', f));
    document.addEventListener('keydown', e => {
      if (n.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); f(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); iDir(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); iDir(1); }
    });
  }

  function initGallery() {
    S();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery, { once: true });
  } else {
    initGallery();
  }
  document.addEventListener('astro:page-load', initGallery);
})();
