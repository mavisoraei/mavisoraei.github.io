/*! gallery.js */
(function () {
  'use strict';

  function S() {
    const o = document.getElementById('nb-gallery');
    if (!o || o.dataset.bound) return;
    o.dataset.bound = '1';
    const m = Array.from(o.querySelectorAll('.nb-card'));
    const chips = Array.from(o.querySelectorAll('.nb-chip[data-filter]'));
    const docOptions = Array.from(o.querySelectorAll('[data-doc-option]'));
    const avatarSources = docOptions.length ? docOptions : Array.from(o.querySelectorAll('.nb-chip[data-filter^="doc:"]'));
    const allFilters = chips.concat(docOptions);
    const docSelect = o.querySelector('[data-nb-doc-select]');
    const docTrigger = docSelect ? docSelect.querySelector('.nb-doc-trigger') : null;
    const docLabel = docSelect ? docSelect.querySelector('.nb-doc-trigger__label') : null;
    const docAvatar = docSelect ? docSelect.querySelector('[data-doc-avatar]') : null;
    const docPopover = docSelect ? docSelect.querySelector('.nb-doc-popover') : null;
    const countEl = o.querySelector('[data-nb-count]');
    const countLabel = o.querySelector('[data-nb-count-label]');
    const clearBtn = o.querySelector('.nb-clear');
    const allAvatarHtml = docAvatar ? docAvatar.innerHTML : '';
    const k = (e, t) => (t === 'all' ? true : t.startsWith('g:') ? e.dataset.g === t.slice(2) : t.startsWith('doc:') ? e.dataset.doc === t.slice(4) : true);

    const updateCount = () => {
      const n = m.filter(card => !card.classList.contains('is-hidden')).length;
      if (countEl) countEl.textContent = String(n);
      if (countLabel) countLabel.textContent = n === 1 ? 'case' : 'cases';
    };

    const setTrigger = filter => {
      if (!docLabel || !docAvatar) return;
      const option = filter.startsWith('doc:') ? docOptions.find(r => r.dataset.filter === filter) : null;
      if (!option) {
        docLabel.textContent = 'All doctors';
        delete docAvatar.dataset.initials;
        docAvatar.innerHTML = allAvatarHtml;
        return;
      }
      docLabel.textContent = option.dataset.label || option.textContent.trim();
      docAvatar.innerHTML = '';
      const avatar = option.querySelector('.nb-avatar');
      if (!avatar) return;
      docAvatar.dataset.initials = avatar.dataset.initials || '';
      const img = avatar.querySelector('img');
      if (img) {
        const clone = img.cloneNode(true);
        clone.addEventListener('error', () => clone.remove());
        docAvatar.appendChild(clone);
        if (clone.complete && clone.naturalWidth === 0) clone.remove();
      }
    };

    const centreChip = filter => {
      const chip = chips.find(r => r.dataset.filter === filter);
      const scroller = chip ? chip.closest('.nb-chip-scroll') : null;
      if (!chip || !scroller) return;
      if (filter === 'all') {
        scroller.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      const chipRect = chip.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const target = scroller.scrollLeft + chipRect.left - scrollerRect.left - (scroller.clientWidth - chipRect.width) / 2;
      scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    };

    const u = (e, t) => {
      const b = allFilters.some(r => r.dataset.filter === e) ? e : 'all';
      chips.forEach(r => r.setAttribute('aria-pressed', r.dataset.filter === b ? 'true' : 'false'));
      docOptions.forEach(r => r.setAttribute('aria-selected', r.dataset.filter === b ? 'true' : 'false'));
      m.forEach(r => r.classList.toggle('is-hidden', !k(r, b)));
      setTrigger(b);
      updateCount();
      centreChip(b);
      if (clearBtn) clearBtn.hidden = b === 'all';
      if (t) {
        history.replaceState(null, '', b === 'all' ? location.pathname : '#' + b.replace(':', '='));
      }
    };

    const focusOption = index => {
      if (!docOptions.length) return;
      const i = (index + docOptions.length) % docOptions.length;
      docOptions[i].focus();
    };

    const openDoc = () => {
      if (!docPopover || !docTrigger) return;
      docPopover.hidden = false;
      docPopover.classList.remove('is-up');
      const triggerRect = docTrigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      if (spaceBelow < docPopover.offsetHeight + 12 && spaceAbove > spaceBelow) {
        docPopover.classList.add('is-up');
      }
      docTrigger.setAttribute('aria-expanded', 'true');
      if (docOptions.length) {
        const selected = docOptions.find(r => r.getAttribute('aria-selected') === 'true');
        (selected || docOptions[0]).focus();
      }
    };

    const closeDoc = returnFocus => {
      if (!docPopover || !docTrigger) return;
      docPopover.hidden = true;
      docTrigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) docTrigger.focus();
    };

    if (docTrigger) {
      docTrigger.addEventListener('click', () => {
        if (docPopover.hidden) openDoc();
        else closeDoc(true);
      });
      docTrigger.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (docPopover.hidden) openDoc();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDoc(true);
        }
      });
    }

    docOptions.forEach((option, index) => {
      option.addEventListener('click', () => {
        u(option.dataset.filter, true);
        closeDoc(true);
      });
      option.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusOption(index + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusOption(index - 1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          focusOption(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          focusOption(docOptions.length - 1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDoc(true);
        } else if (e.key === 'Tab') {
          closeDoc(false);
        }
      });
    });

    chips.forEach(e => e.addEventListener('click', () => u(e.dataset.filter, true)));

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        u('all', true);
        closeDoc(false);
      });
    }

    if (docSelect) {
      document.addEventListener('pointerdown', e => {
        if (!docSelect.contains(e.target)) closeDoc(false);
      });
      docSelect.addEventListener('focusout', e => {
        if (!docSelect.contains(e.relatedTarget)) closeDoc(false);
      });
    }
    const y = () => {
      const t = decodeURIComponent(location.hash.replace(/^#/, '')).match(/^(doc|g)=(.+)$/);
      return t ? t[1] + ':' + t[2] : null;
    };
    const p = y();
    u(p || 'all', false);
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
    const ini = {};
    avatarSources.forEach(r => {
      const k = r.dataset.filter || '';
      if (!k.startsWith('doc:')) return;
      const im = r.querySelector('img');
      if (im) av[k.slice(4)] = im.src;
      const avatar = r.querySelector('.nb-avatar');
      if (avatar) ini[k.slice(4)] = avatar.dataset.initials || '';
    });
    docOptions.forEach(option => {
      const im = option.querySelector('.nb-avatar img');
      if (!im) return;
      const hide = () => im.remove();
      im.addEventListener('error', hide);
      if (im.complete && im.naturalWidth === 0) hide();
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
        const initials = ini[card.dataset.doc] || '';
        if (src || initials) {
          const wrap = document.createElement('span');
          wrap.className = 'nb-avatar nb-ava';
          wrap.dataset.initials = initials;
          wrap.setAttribute('aria-hidden', 'true');
          if (src) {
            const im = document.createElement('img');
            im.src = src;
            im.alt = '';
            im.loading = 'lazy';
            im.decoding = 'async';
            im.addEventListener('error', function () { im.remove(); });
            wrap.appendChild(im);
            if (im.complete && im.naturalWidth === 0) im.remove();
          }
          row.insertBefore(wrap, old);
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
