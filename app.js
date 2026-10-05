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

    initMegaHover();
    initHeaderScroll();
  }

  /* ------------------------------------------------------------------ *
   * mega dropdown — open on hover as well as on click
   *
   * `<details>` is click/touch only, so a pointer user has to aim at the
   * summary and wait for the panel to stay put. Hovering the summary opens
   * it, and a short grace period on leave means the pointer can cross the
   * gap into the panel without it snapping shut underneath them.
   *
   * Pointer devices only: on touch, `:hover` sticks after a tap and the
   * menu would open and never close. Keyboard and screen readers keep using
   * the native summary/details semantics untouched.
   * ------------------------------------------------------------------ */

  function initMegaHover() {
    var mega = document.querySelector('details.mega');
    if (!mega) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var CLOSE_GRACE_MS = 220;
    var timer = 0;

    var open = function () {
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
      mega.setAttribute('open', '');
    };

    var closeSoon = function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = 0;
        mega.removeAttribute('open');
      }, CLOSE_GRACE_MS);
    };

    var closeNow = function () {
      if (timer) clearTimeout(timer);
      timer = 0;
      mega.removeAttribute('open');
    };

    mega.addEventListener('mouseenter', open);
    mega.addEventListener('mouseleave', closeSoon);

    // The summary is a real control, so clicking it must still toggle. A
    // hover-opened menu would otherwise close on the very click that opened
    // it, so the click path takes over once the pointer has taken control.
    mega.addEventListener('click', function (e) {
      if (e.target.closest('summary')) closeNow();
    });

    // Focus moving out of the menu entirely should close it even though the
    // mouse may still be parked over the trigger.
    mega.addEventListener('focusout', function (e) {
      if (!mega.contains(e.relatedTarget)) closeSoon();
    });

    // A click elsewhere, or Escape, handled by the shared listeners above,
    // must also cancel the pending grace timer.
    document.addEventListener('click', function (e) {
      if (!mega.contains(e.target)) closeNow();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNow();
    });
  }

  /* ------------------------------------------------------------------ *
   * patient reviews — vertical infinite column marquee
   *
   * Vanilla adaptation of the React `testimonials-6` layout. The reviews
   * ship once in `.cnp-source`; this splits them across 3 / 2 / 1 columns,
   * clones each column so the vertical loop has no visible seam, and gives
   * every column a different duration and phase offset so they drift rather
   * than march in lockstep.
   *
   * The loop relies on one invariant: the two copies inside a track are
   * byte-identical and the gap is carried as padding-bottom on the track,
   * so `translateY(-50%)` always lands exactly on the seam.
   * ------------------------------------------------------------------ */

  var CNP_COLS = [
    { min: 1024, cols: 3, dur: 42 },
    { min: 700, cols: 2, dur: 34 },
    { min: 0, cols: 1, dur: 26 }
  ];

  function cnpColsFor(width) {
    for (var i = 0; i < CNP_COLS.length; i++) {
      if (width >= CNP_COLS[i].min) return CNP_COLS[i];
    }
    return CNP_COLS[CNP_COLS.length - 1];
  }

  function initReviewMarquee() {
    var section = document.querySelector('.cnp');
    var source = section && section.querySelector('[data-cnp-source]');
    var colsEl = section && section.querySelector('[data-cnp-cols]');
    if (!source || !colsEl) return;

    var cards = Array.prototype.slice.call(source.children);
    if (!cards.length) return;

    var built = null;

    var build = function () {
      var spec = cnpColsFor(window.innerWidth);
      if (built && built.cols === spec.cols && built.width === window.innerWidth) return;
      built = { cols: spec.cols, width: window.innerWidth };

      var n = spec.cols;
      section.style.setProperty('--cnp-cols', n);
      colsEl.textContent = '';

      // Deal the cards round-robin rather than slicing into blocks: the
      // reviews vary from 37 to 258 characters, and contiguous blocks would
      // give one column all the long ones and visibly stall it.
      var columns = [];
      for (var i = 0; i < n; i++) columns.push([]);
      for (var j = 0; j < cards.length; j++) columns[j % n].push(cards[j]);

      columns.forEach(function (set, colIndex) {
        if (!set.length) return;

        var col = document.createElement('div');
        col.className = 'cnp-col';

        var track = document.createElement('div');
        track.className = 'cnp-track';

        // Per-column speed and phase. Odd columns reverse direction in CSS,
        // so the phase offset is spread across the full cycle to keep the
        // entry points from lining up.
        var dur = spec.dur + colIndex * 7;
        var phase = -(dur / columns.length) * colIndex;
        track.style.setProperty('--cnp-dur', dur + 's');
        track.style.setProperty('--cnp-delay', phase.toFixed(2) + 's');

        // First copy: real, focusable, read by assistive tech.
        var first = document.createElement('div');
        first.className = 'cnp-set';
        set.forEach(function (card) { first.appendChild(card); });

        // Second copy: identical markup so the seam is invisible, but
        // removed from the tab order and the accessibility tree so nobody
        // meets the same review twice.
        var second = document.createElement('div');
        second.className = 'cnp-set';
        second.setAttribute('aria-hidden', 'true');
        set.forEach(function (card) {
          var clone = card.cloneNode(true);
          clone.setAttribute('tabindex', '-1');
          clone.removeAttribute('id');
          Array.prototype.forEach.call(clone.querySelectorAll('a'), function (a) {
            a.setAttribute('tabindex', '-1');
          });
          second.appendChild(clone);
        });

        track.appendChild(first);
        track.appendChild(second);
        col.appendChild(track);
        colsEl.appendChild(col);
      });

      section.classList.add('cnp-js');
    };

    build();

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = 0;
        build();
      }, 160);
    });
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
   * homepage auto image slider — seamless 20s before/after case row
   * ------------------------------------------------------------------ */

  /* Replaces the 3D coverflow. Every bit of motion here is one CSS keyframe on
   * `.ias-track` — `translate3d(0,0,0)` to `translate3d(-50%,0,0)` over
   * `--ias-dur`, `infinite`, `linear` — so this function's only real job is the
   * DOM the animation cannot set up by itself. It never writes `transform`,
   * never restarts the animation, and never measures a card.
   *
   * WHY THE CLONES EXIST: a translate of exactly -50% lands the row back on its
   * first card only if the track is exactly two identical halves long. With the
   * ten authored cards alone, -50% overshoots into empty space for half of every
   * cycle, so each card is cloned once and the clone set is appended. That is the
   * whole trick behind a seamless loop with a single CSS declaration.
   *
   * The clones are inert: `aria-hidden` keeps them out of the accessibility tree,
   * `tabindex="-1"` plus a stripped `href` keeps them out of the tab order, and
   * `pointer-events:none` keeps them off the pointer entirely. `[data-ias-clone]`
   * is also the hook the reduced-motion block in CSS uses to hide them outright
   * once the row degrades to a hand-scrolled container.
   *
   * `build()` is re-run on resize so the clone set cannot desync from the authored
   * cards — it is cheap, idempotent, and guarantees the -50% target stays exact.
   */
  function initCaseSlider() {
    document.querySelectorAll('.ias').forEach(function (root) {
      if (root.dataset.iasBound) return;
      const track = root.querySelector('.ias-track');
      if (!track) return;
      const authored = Array.prototype.slice.call(track.querySelectorAll('.ias-item:not([data-ias-clone])'));
      if (!authored.length) return;
      root.dataset.iasBound = '1';

      const build = function () {
        /* Clear the previous clone set first, or a resize compounds the row
         * instead of replacing it. */
        track.querySelectorAll('[data-ias-clone]').forEach(function (n) { n.remove(); });
        authored.forEach(function (item) {
          const clone = item.cloneNode(true);
          clone.setAttribute('data-ias-clone', '1');
          clone.setAttribute('aria-hidden', 'true');
          clone.style.pointerEvents = 'none';
          clone.querySelectorAll('a, button, [tabindex]').forEach(function (el) {
            el.setAttribute('tabindex', '-1');
            if (el.tagName === 'A') el.removeAttribute('href');
          });
          track.appendChild(clone);
        });
      };

      build();
      window.addEventListener('resize', rafThrottle(build), { passive: true });
    });
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
   * hero video modal — the play card in the homepage hero column
   * ------------------------------------------------------------------ */

  function initVideoModal() {
    const modal = document.getElementById('lm-video-modal');
    const video = modal && modal.querySelector('video');
    if (!modal || !video || modal.dataset.bound) return;
    modal.dataset.bound = '1';

    let opener = null;

    const close = function () {
      if (modal.hasAttribute('hidden')) return;
      modal.setAttribute('hidden', '');
      document.body.classList.remove('lm-modal-open');
      video.pause();
      video.removeAttribute('src');
      video.load();                    // release the decoder, not just the frame
      if (opener) opener.focus();
      opener = null;
    };

    const open = function (trigger) {
      const src = trigger.getAttribute('data-lm-video');
      if (!src || !modal.hasAttribute('hidden')) return;
      opener = trigger;
      video.setAttribute('src', src);
      modal.removeAttribute('hidden');
      document.body.classList.add('lm-modal-open');
      video.play().catch(function () { /* autoplay policy — controls still work */ });
      const closeBtn = modal.querySelector('.lm-modal-x');
      if (closeBtn) closeBtn.focus();
    };

    // delegated, so a play card added later still works
    document.addEventListener('click', function (e) {
      const target = e.target;
      if (!target || !target.closest) return;
      const trigger = target.closest('[data-lm-video]');
      if (trigger) {
        e.preventDefault();
        open(trigger);
        return;
      }
      if (!modal.hasAttribute('hidden') && target.closest('[data-lm-close]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
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
   * page mesh gradient — site-wide WebGL background wash
   * ------------------------------------------------------------------ */

  /* A soft, slowly drifting mesh gradient painted into a single
   * full-bleed canvas. It replaces the Spline model as the site's only
   * decorative layer, and it is the page's one WebGL surface, so it is
   * written defensively at every step:
   *
   *   - the canvas is created here and inserted as the first element of
   *     `<body>`, so no page has to carry the markup and every page that
   *     loads app.js gets the same background;
   *   - no WebGL, or a shader that fails to compile  -> the canvas is
   *     hidden and `body::before`'s static CSS gradient (same palette)
   *     shows through, so the page is never blank;
   *   - reduced motion                            -> exactly one frame
   *     is drawn and the loop never starts;
   *   - tab hidden                                  -> the loop is
   *     suspended rather than burning frames on an unseen canvas;
   *   - context lost by the driver                 -> prevented (so the
   *     browser can restore it) and rebuilt on `webglcontextrestored`.
   *
   * `distortion`, `swirl` and `speed` map 1:1 onto the three uniforms of
   * the same name in the fragment shader below; the palette is uploaded
   * as a `vec3[6]`. Values are the ones agreed for the Lemon theme. */

  const PAGE_MESH = {
    colors: ['#fdfbf7', '#f3eee4', '#e6ded0', '#f8f5ee', '#d4af37', '#f2ebe0'],
    /* v1.0.7: retuned from the hero-only wash (0.6 / 0.4 / 0.3) to
       0.5 / 0.3 / 0.15. Because the canvas is now fixed behind the WHOLE page
       rather than filling one viewport-height section, it is on screen for far
       longer, so a faster, more distorted, more swirled wash becomes
       noticeable and tiring. Halving the drift and easing both shape
       parameters keeps the movement perceptible but ambient. */
    distortion: 0.5,
    swirl: 0.3,
    speed: 0.15,
    /* How far the most saturated palette entry is damped relative to a fully
       neutral one, when turned into its per-blob weight in the shader. 0.78
       puts #d4af37 at 0.22 of a cream's weight: enough to warm the linen
       where its blob peaks, never enough to read as a gold panel. Measured
       against rendered frames, anything under ~0.7 let the gold peak above
       rgb(219,191,101) — visibly a gold wash rather than warm linen. */
    accentDamp: 0.78,
    /* A mesh gradient is pure low-frequency colour, so it gains nothing
       from a dense backing store and costs a lot to fill. Capping the
       long edge keeps a 4K display from shading ~8M pixels a frame; the
       browser's own bilinear upscale is indistinguishable on a wash this
       soft, and doubles as a touch of extra smoothing. */
    maxEdge: 1440
  };

  const PAGE_MESH_VERT = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  const PAGE_MESH_FRAG = [
    'precision highp float;',
    '',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform float u_distortion;',
    'uniform float u_swirl;',
    'uniform float u_speed;',
    'uniform vec3  u_colors[6];',
    'uniform float u_weight[6];',
    '',
    '#define TAU 6.28318530718',
    '',
    'float hash21(vec2 p) {',
    '  p = fract(p * vec2(123.34, 345.45));',
    '  p += dot(p, p + 34.345);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float vnoise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float amp = 0.5;',
    '  for (int i = 0; i < 4; i++) {',
    '    v += amp * vnoise(p);',
    '    p *= 2.02;',
    '    amp *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main() {',
    /* centred, aspect-corrected coordinates: +y up, so the palette is
       laid out symmetrically about the middle of the hero */
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);',
    '  float t = u_time * u_speed;',
    '',
    /* swirl: a slow rotational warp about the centre, damped with radius
       so the edges of the hero stay calm */
    '  float r = length(uv);',
    '  float ang = atan(uv.y, uv.x);',
    '  ang += u_swirl * 0.35 * sin(t * 0.12) * (0.6 - r * 0.35);',
    '  uv = vec2(cos(ang), sin(ang)) * r;',
    '',
    /* distortion: fbm domain warp. Warping the SAMPLING position rather
       than the final colour is what gives a mesh gradient its liquid look —
       the blobs are stretched and sheared instead of merely sliding. */
    '  vec2 q = vec2(fbm(uv * 1.6 + vec2(0.0, t * 0.06)),',
    '                fbm(uv * 1.6 + vec2(5.2, -t * 0.05)));',
    '  vec2 w = uv + (q - 0.5) * u_distortion * 0.9;',
    '',
    /* Six gaussian colour blobs drifting on Lissajous-ish paths, normalised
       by total weight so overlapping blobs blend additively without ever
       clipping to white — the result is always a convex combination of the
       six palette colours, which is why no region of the wash can fall
       outside the palette or go black.

       Two things are deliberate and both are about the palette being
       lopsided: five of the six colours are near-identical linen creams and
       ONE (#d4af37) has a chroma of 157/255 against their ~22. With one
       gaussian per colour and equal weights, whichever blob happens to be
       nearest owns the pixel outright, so the gold stops being a tint and
       becomes a saturated pool painted across the hero. `u_weight` — computed
       from each colour's own chroma on the JS side, not hardcoded per index —
       damps the saturated entries so they can only ever contribute warmth,
       while the creams keep full radius and form the continuous base wash.
       The drift rates are also an order of magnitude below the `u_speed`
       scalar, so the motion reads as ambient light rather than a sliding
       stain. */
    '  vec3 acc = vec3(0.0);',
    '  float wsum = 0.0;',
    '  for (int i = 0; i < 6; i++) {',
    '    float fi = float(i);',
    '    float ph = hash21(vec2(fi, 7.0)) * TAU;',
    '    vec2 c = vec2(cos(ph + t * 0.05 + fi * 1.05),',
    '                  sin(ph * 1.3 - t * 0.042 + fi * 1.05)) * vec2(0.88, 0.68);',
    '    float rad = 0.38 + 0.16 * sin(t * 0.09 + fi * 2.1);',
    '    float d = length(w - c) / rad;',
    '    float wgt = exp(-d * d) * u_weight[i];',
    '    acc += u_colors[i] * wgt;',
    '    wsum += wgt;',
    '  }',
    '  vec3 col = acc / max(wsum, 0.0001);',
    '',
    /* a little ordered dither: a wash this flat bands visibly on 8-bit
       panels, and this costs one hash */
    '  col += (hash21(gl_FragCoord.xy + fract(t) * 91.7) - 0.5) * 0.006;',
    '',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function initPageMesh() {
    /* The canvas is injected rather than authored into each page: the wash is
     * site-wide, and putting the same fixed element in ~230 hand-maintained
     * templates would be a lot of copy to keep in sync for one decoration.
     * `body::before` is a pseudo-element, so it is still the first thing
     * painted; inserting here — after it, at `z-index: -1` — is what lets the
     * canvas win over the CSS fallback it hides on success. */
    let canvas = document.getElementById('lm-bg-mesh');
    if (!canvas) {
      if (!document.body) return;
      canvas = document.createElement('canvas');
      canvas.id = 'lm-bg-mesh';
      canvas.className = 'lm-bg-mesh';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    /* Any failure from here on means "no shader" — the CSS fallback on
       `body::before` is a complete page background in its own right, so the
       safe response is always to hide the canvas and carry on. */
    const bail = function () {
      canvas.style.display = 'none';
    };

    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      }) ||
      canvas.getContext('experimental-webgl', { alpha: false, depth: false, stencil: false, antialias: false });
    if (!gl) return bail();

    /* compile + link, and return null rather than throwing so one bad
       shader cannot take the rest of app.js down with it */
    const buildProgram = function () {
      const compile = function (type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          if (window.console && console.warn) console.warn('[mesh] shader compile failed:', gl.getShaderInfoLog(sh));
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, PAGE_MESH_VERT);
      const fs = compile(gl.FRAGMENT_SHADER, PAGE_MESH_FRAG);
      if (!vs || !fs) return null;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        if (window.console && console.warn) console.warn('[mesh] link failed:', gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
      }
      return prog;
    };

    let program = null;
    let u = null;
    let aPos = -1;

    /* (Re)build every GL object and uniform location. Split out so that
       `webglcontextrestored` can call it again — after a context loss the
       old program, buffer and locations are all invalid, but the canvas,
       the config and the listeners are not. */
    const setup = function () {
      program = buildProgram();
      if (!program) return false;

      /* one oversized triangle covers the viewport with no index buffer and
         no seam down the middle, unlike two triangles sharing an edge */
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      aPos = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      u = {
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        distortion: gl.getUniformLocation(program, 'u_distortion'),
        swirl: gl.getUniformLocation(program, 'u_swirl'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        colors: gl.getUniformLocation(program, 'u_colors'),
        weight: gl.getUniformLocation(program, 'u_weight')
      };
      gl.useProgram(program);
      gl.uniform1f(u.distortion, PAGE_MESH.distortion);
      gl.uniform1f(u.swirl, PAGE_MESH.swirl);
      gl.uniform1f(u.speed, PAGE_MESH.speed);

      const palette = new Float32Array(PAGE_MESH.colors.length * 3);
      PAGE_MESH.colors.forEach(function (hex, i) {
        const n = parseInt(hex.slice(1), 16);
        palette[i * 3] = ((n >> 16) & 255) / 255;
        palette[i * 3 + 1] = ((n >> 8) & 255) / 255;
        palette[i * 3 + 2] = (n & 255) / 255;
      });
      gl.uniform3fv(u.colors, palette);

      /* Per-blob weight, derived from each colour's own chroma rather than
         hardcoded by palette index, so re-paletting the wash cannot silently
         reintroduce a saturated pool. `chroma` is max(RGB) - min(RGB) in 0..1;
         the most saturated entry in the palette drops to
         1 - ACCENT_DAMP and a fully neutral one stays at 1. */
      const chromaOf = function (i) {
        const r = palette[i * 3], g = palette[i * 3 + 1], b = palette[i * 3 + 2];
        return Math.max(r, g, b) - Math.min(r, g, b);
      };
      let peakChroma = 0;
      for (let i = 0; i < PAGE_MESH.colors.length; i++) peakChroma = Math.max(peakChroma, chromaOf(i));
      const weights = new Float32Array(PAGE_MESH.colors.length);
      for (let i = 0; i < PAGE_MESH.colors.length; i++) {
        weights[i] = 1 - PAGE_MESH.accentDamp * (peakChroma ? chromaOf(i) / peakChroma : 0);
      }
      gl.uniform1fv(u.weight, weights);
      return true;
    };

    if (!setup()) return bail();

    const resize = function () {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || !program) return;
      const scale = Math.min(window.devicePixelRatio || 1, PAGE_MESH.maxEdge / rect.width) || 1;
      const w = Math.max(1, Math.round(rect.width * scale));
      const h = Math.max(1, Math.round(rect.height * scale));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };

    let raf = 0;
    const draw = function (time) {
      if (!program) return;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /* t is in seconds since start, so the phase is identical on reload
       regardless of frame rate */
    const started = performance.now();
    const tick = function (now) {
      draw((now - started) / 1000);
      raf = requestAnimationFrame(tick);
    };

    /* A fixed, full-viewport canvas is on screen by definition, so unlike the
       hero-scoped version there is nothing for an IntersectionObserver to
       gain here — it would report intersecting on the first callback and then
       never again. Only tab visibility can suspend it. */
    let visible = true;
    const running = function () {
      return visible && !prefersReducedMotion();
    };

    const start = function () {
      if (raf || !running()) return;
      raf = requestAnimationFrame(tick);
    };
    const stop = function () {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const relayout = rafThrottle(function () {
      resize();
      /* a resize while paused still has to repaint, or the canvas is left
         showing a stretched old frame */
      if (!raf) draw((performance.now() - started) / 1000);
    });
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);

    document.addEventListener('visibilitychange', function () {
      visible = document.visibilityState === 'visible';
      if (visible) start();
      else stop();
    });

    /* A lost context invalidates the program, buffer and every uniform
       location, so restore has to rebuild them via `setup()`. `preventDefault`
       is what tells the browser we intend to come back — without it the
       context is gone for good and the CSS fallback is all that is left. */
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      stop();
      program = null;
    });
    canvas.addEventListener('webglcontextrestored', function () {
      program = null;
      if (!setup()) return bail();
      canvas.width = 0;      // force `resize` to re-apply the viewport
      resize();
      draw((performance.now() - started) / 1000);
      start();
    });

    /* Reduced motion can be toggled while the page is open. */
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = function () {
      if (running()) start();
      else {
        stop();
        draw((performance.now() - started) / 1000);
      }
    };
    if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', onMotionChange);
    else if (typeof motionQuery.addListener === 'function') motionQuery.addListener(onMotionChange);

    resize();
    /* paint immediately so there is never an unpainted frame, then either
       animate or stop on the single static frame */
    draw(0);
    start();
  }

  /* ------------------------------------------------------------------ *
   * boot
   * ------------------------------------------------------------------ */

  onReady(function () {
    initMobileDrawer();   // also drives the sticky-header state
    initBottomBar();
    initCardTilt();
    initSunParallax();
    initCaseSlider();
    initMarqueeDrag();
    initReviewMarquee();
    initConsultCta();
    initVideoModal();
    initPageMesh();
  });

  // these two need no DOM, so they start as early as possible
  initEntryAttribution();
  initAnalytics();
}());
