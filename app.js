/*!
 * app.js — shared behaviour for the Lemon Clinic static site.
 *
 * Replaces the inline `<script>` blocks that the original Astro build inlined
 * into every page's <head>. No framework, no bundler, no client-side router:
 * plain DOM, one file, loaded with a single `defer` tag.
 *
 * Every feature is defensive — it checks for its own markup first and is safe
 * to call on a page that does not use it.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * helpers
   * ------------------------------------------------------------------ */

  /** Run `fn` once the DOM is parsed. The Astro originals used the
   *  `astro:page-load` event for this; on a static site DOMContentLoaded is
   *  the correct equivalent. */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /** Coalesce repeated calls into one per animation frame. */
  function rafThrottle(fn) {
    let pending = false;
    return function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        fn();
      });
    };
  }

  const DESKTOP_BREAKPOINT = 1000;
  const DRAWER_CLOSE_MS = 380;
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ *
   * sticky header shadow — toggles `.scrolled` past 8px
   * ------------------------------------------------------------------ */

  function initHeaderScroll() {
    const update = function () {
      const header = document.getElementById('site-header');
      if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', rafThrottle(update), { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ *
   * mobile drawer + desktop mega menu
   * ------------------------------------------------------------------ */

  function initMobileDrawer() {
    const burger = document.getElementById('burger');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (!drawer || drawer.dataset.bound) return;
    drawer.dataset.bound = '1';

    const links = () => Array.prototype.slice.call(drawer.querySelectorAll('a'));

    const open = function () {
      drawer.removeAttribute('hidden');
      if (overlay) overlay.removeAttribute('hidden');
      requestAnimationFrame(function () {
        drawer.classList.add('open');
      });
      if (burger) burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const first = links()[0];
      if (first) first.focus();
    };

    const close = function () {
      if (!drawer || drawer.hasAttribute('hidden')) return;
      drawer.classList.remove('open');
      if (burger) burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        drawer.setAttribute('hidden', '');
        if (overlay) overlay.setAttribute('hidden', '');
      }, DRAWER_CLOSE_MS);
      if (burger) burger.focus();
    };

    if (burger) burger.addEventListener('click', open);
    if (overlay) overlay.addEventListener('click', close);
    links().forEach(function (a) {
      a.addEventListener('click', close);
    });

    // keep Tab inside the open drawer
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      const items = links();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // returning to desktop width must not leave the page scroll-locked
    window.addEventListener('resize', function () {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) close();
    });

    // close the mega dropdown on outside click
    document.addEventListener('click', function (e) {
      const mega = document.querySelector('details.mega');
      if (mega && mega.hasAttribute('open') && !mega.contains(e.target)) {
        mega.removeAttribute('open');
      }
    });

    // Escape closes the drawer and the mega dropdown
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      close();
      const mega = document.querySelector('details.mega');
      if (mega && mega.hasAttribute('open')) {
        mega.removeAttribute('open');
        const summary = mega.querySelector('summary');
        if (summary) summary.focus();
      }
    });

    initHeaderScroll();
  }

  /* ------------------------------------------------------------------ *
   * bottom action bar — reveals past 60% of the viewport
   * ------------------------------------------------------------------ */

  function initBottomBar() {
    const bar = document.getElementById('bottombar');
    if (!bar) return;
    const update = function () {
      const visible = window.scrollY > window.innerHeight * 0.6;
      bar.classList.toggle('show', visible);
      bar.setAttribute('aria-hidden', visible ? 'false' : 'true');
      bar.toggleAttribute('inert', !visible);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ *
   * 3D card tilt — pointer devices only, skipped for reduced motion
   * ------------------------------------------------------------------ */

  function initCardTilt() {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover || prefersReducedMotion()) return;

    document.querySelectorAll('[data-tilt]:not([data-tilt-bound])').forEach(function (card) {
      card.dataset.tiltBound = '1';
      const strength = Number(card.dataset.tilt) || 7;
      let frame = 0;

      card.addEventListener('pointerenter', function () {
        card.style.willChange = 'transform';
        card.style.transition = 'transform 0.12s ease-out';
      });

      card.addEventListener('pointermove', function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          const box = card.getBoundingClientRect();
          const rotateY = ((e.clientX - box.left) / box.width - 0.5) * 2 * strength;
          const rotateX = -((e.clientY - box.top) / box.height - 0.5) * 2 * strength;
          card.style.transform =
            'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' +
            rotateY.toFixed(2) + 'deg) scale(1.02)';
        });
      });

      card.addEventListener('pointerleave', function () {
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform =
          'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.willChange = 'auto';
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * sun parallax — drifts the decorative glow as the page scrolls
   * ------------------------------------------------------------------ */

  function initSunParallax() {
    const sun = document.querySelector('.sun-layer');
    if (!sun) return;
    const update = rafThrottle(function () {
      const scrollable = document.body.scrollHeight - window.innerHeight || 1;
      const progress = window.scrollY / scrollable;
      sun.style.setProperty('--sun-x', (22 + progress * 12) + '%');
      sun.style.setProperty('--sun-y', (18 + progress * 8) + '%');
    });
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ *
   * gallery marquee — drag / swipe with inertia
   * ------------------------------------------------------------------ */

  function initMarqueeDrag() {
    document.querySelectorAll('.ga-marquee').forEach(function (marquee) {
      if (marquee.dataset.swipeBound) return;
      const row = marquee.querySelector('.ga-row');
      const group = marquee.querySelector('.ga-group');
      if (!row || !group || prefersReducedMotion()) return;
      marquee.dataset.swipeBound = '1';

      let wrapWidth = 0;   // measured lazily on first grab
      let offset = 0;     // current translate, in px
      let anchorX = 0;    // pointer position at pointerdown
      let startOffset = 0;
      let lastX = 0;
      let lastT = 0;
      let velocity = 0;   // px per ms
      let down = false;
      let dragging = false;
      let inertiaTimer = 0;
      let releaseTimer = 0;
      let settleTimer = 0;

      const measure = function () {
        const gap = parseFloat(getComputedStyle(row).gap) || 0;
        wrapWidth = group.getBoundingClientRect().width + gap;
      };

      // keep the strip looping by folding the offset into one cycle
      const fold = function (value) {
        if (wrapWidth > 0) {
          value %= wrapWidth;
          if (value > 0) value -= wrapWidth;
        }
        return value;
      };

      const apply = function () {
        row.style.setProperty('--ga-drag', offset.toFixed(2) + 'px');
      };

      const cancelInertia = function () {
        if (!inertiaTimer) return;
        clearTimeout(inertiaTimer);
        inertiaTimer = 0;
      };

      const clearHeld = function () {
        settleTimer = 0;
        marquee.classList.remove('is-held');
      };

      const onPointerDown = function (e) {
        if (e.button != null && e.button > 0) return;
        measure();
        cancelInertia();
        if (releaseTimer) {
          clearTimeout(releaseTimer);
          releaseTimer = 0;
        }
        down = true;
        dragging = false;
        anchorX = lastX = e.clientX;
        startOffset = offset;
        lastT = e.timeStamp;
        velocity = 0;
        marquee.classList.add('is-held', 'is-grabbing');
      };

      const onPointerMove = function (e) {
        if (!down) return;
        const delta = e.clientX - anchorX;
        if (!dragging && Math.abs(delta) > 12) {
          dragging = true;
          try { marquee.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        if (!dragging) return;
        offset = fold(startOffset + delta);
        const elapsed = e.timeStamp - lastT;
        if (elapsed > 4) velocity = (e.clientX - lastX) / elapsed;
        lastX = e.clientX;
        lastT = e.timeStamp;
        apply();
        e.preventDefault();
      };

      const onPointerUp = function (e) {
        if (!down) return;
        down = false;
        marquee.classList.remove('is-grabbing');
        try { marquee.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }

        let step = velocity * 16;          // one frame of coasting
        const maxStep = 90;
        if (step > maxStep) step = maxStep;
        else if (step < -maxStep) step = -maxStep;

        let stopped = false;
        let frames = 0;

        const settle = function () {
          if (stopped) return;
          stopped = true;
          cancelInertia();
          if (releaseTimer) {
            clearTimeout(releaseTimer);
            releaseTimer = 0;
          }
          offset = fold(offset);
          apply();
          if (settleTimer) clearTimeout(settleTimer);
          settleTimer = window.setTimeout(clearHeld, 1400);
        };

        const coast = function () {
          offset = fold(offset + step);
          apply();
          step *= 0.92;                      // friction
          if (Math.abs(step) > 0.4 && ++frames < 150) {
            inertiaTimer = window.setTimeout(coast, 16);
          } else {
            settle();
          }
        };

        if (Math.abs(step) > 0.4) {
          inertiaTimer = window.setTimeout(coast, 16);
          releaseTimer = window.setTimeout(settle, 3000);   // hard stop
        } else {
          settle();
        }
      };

      marquee.addEventListener('pointerdown', onPointerDown);
      marquee.addEventListener('pointermove', onPointerMove, { passive: false });
      marquee.addEventListener('pointerup', onPointerUp);
      marquee.addEventListener('pointercancel', onPointerUp);
      marquee.addEventListener('dragstart', function (e) { e.preventDefault(); });

      // a drag must not fire the click on whatever sits under the pointer
      marquee.addEventListener('click', function (e) {
        if (!dragging) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = false;
      }, true);
    });
  }

  /* ------------------------------------------------------------------ *
   * AI consult launcher — used by the face-analysis page
   * ------------------------------------------------------------------ */

  function initConsultCta() {
    const cta = document.getElementById('ai-consult-cta');
    if (!cta || cta.dataset.bound) return;
    cta.dataset.bound = '1';
    cta.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('lemon:open-consult'));
    });
  }

  /* ------------------------------------------------------------------ *
   * entry attribution — remembers ?e= and forwards it to the consult app
   * ------------------------------------------------------------------ */

  const ENTRY_KEY = 'lemon_entry';
  const CONSULT_APP_PATHS = ['/face-analysis', '/face-analysis.html'];

  function initEntryAttribution() {
    const decode = function (value) {
      try { return decodeURIComponent(value); } catch (err) { return value; }
    };

    // only accept a short, safe, same-origin path as the referrer
    const safePath = function (value) {
      if (!value) return '';
      if (value.charAt(0) !== '/' || value.charAt(1) === '/') return '';
      if (value.length > 120) return '';
      if (/[\s"'<>\\]/.test(value)) return '';
      return value;
    };

    let entry = '';
    try {
      entry = sessionStorage.getItem(ENTRY_KEY) || '';
      if (!entry) {
        entry = safePath(decode(new URLSearchParams(location.search).get('e') || '')) ||
          decode(location.pathname);
        sessionStorage.setItem(ENTRY_KEY, entry);
      }
    } catch (err) {
      entry = '';
    }

    const beacon = function (action, formId) {
      let url = '/t?a=' + action + (formId ? '&f=' + formId : '') +
        '&p=' + encodeURIComponent(decode(location.pathname)) +
        (entry ? '&e=' + encodeURIComponent(entry) : '');
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        } else {
          fetch(url, { keepalive: true }).catch(function () {});
        }
      } catch (err) { /* analytics must never break the page */ }
    };

    document.addEventListener('click', function (e) {
      const target = e.target;
      if (target && target.closest && target.closest('a[href^="tel:"]')) beacon('tel');
    });

    document.addEventListener('submit', function (e) {
      beacon('form', (e.target && e.target.id) || 'form');
    });

    // carry the entry marker onto the consult app link
    const tagConsultLink = function (e) {
      if (!entry) return;
      const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!anchor || anchor.host !== location.host) return;
      const path = decode(anchor.pathname);
      const isConsult = CONSULT_APP_PATHS.some(function (prefix) {
        return path.indexOf(prefix) === 0;
      });
      if (!isConsult) return;
      try {
        const url = new URL(anchor.href);
        if (url.searchParams.get('e')) return;
        url.searchParams.set('e', entry);
        anchor.href = url.toString();
      } catch (err) { /* ignore */ }
    };

    document.addEventListener('click', tagConsultLink);
    document.addEventListener('auxclick', tagConsultLink);
  }

  /* ------------------------------------------------------------------ *
   * GoatCounter — pageviews plus booking-intent events
   *
   * Inert on localhost: GoatCounter ignores local requests unless
   * `allow_local` is set, so nothing leaves the machine while developing.
   * Labels below are the only user-facing strings in this file.
   * ------------------------------------------------------------------ */

  function initAnalytics() {
    window.goatcounter = window.goatcounter || { no_onload: true };

    let attempts = 0;
    (function sendPageview() {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: location.pathname + location.search });
      } else if (attempts++ < 50) {
        window.setTimeout(sendPageview, 100);   // count.js may still be loading
      }
    })();

    const INTENT_LABELS = [
      { test: function (href) { return href.indexOf('tel:') === 0; }, event: 'phone', label: 'Phone call' },
      { test: function (href) { return /wa\.me|whatsapp/.test(href); }, event: 'whatsapp', label: 'WhatsApp' },
      { test: function (href) { return /beautypay|doctorpay|snapppay/.test(href); }, event: 'installment', label: 'Installments' }
    ];

    // delegated, so it works for every booking link on the page
    document.addEventListener('click', function (e) {
      const anchor = e.target && e.target.closest && e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      for (let i = 0; i < INTENT_LABELS.length; i++) {
        const match = INTENT_LABELS[i];
        if (!match.test(href)) continue;
        if (window.goatcounter && window.goatcounter.count) {
          window.goatcounter.count({ path: match.event, title: match.label, event: true });
        }
        return;
      }
    }, true);
  }

  /* ------------------------------------------------------------------ *
   * boot
   * ------------------------------------------------------------------ */

  onReady(function () {
    initMobileDrawer();   // also drives the sticky-header state
    initBottomBar();
    initCardTilt();
    initSunParallax();
    initMarqueeDrag();
    initConsultCta();
  });

  // these two need no DOM, so they start as early as possible
  initEntryAttribution();
  initAnalytics();
}());
