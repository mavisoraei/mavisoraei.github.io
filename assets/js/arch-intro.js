/* ==========================================================================
   ARCH INTRO â€” page-load intro + domed sheet rise  (v3.0.0)
   ==========================================================================
   Paired with /assets/css/arch-intro.css. Loaded on /index.html only, after
   /vendor/lenis.min.js and /app.js, with `defer`.

   The SVG curtain (frame.svg), the .arch-intro-frame "rounded frame", the
   brand-title layer and the mesh crossfade they needed are GONE. Two things
   remain, and only the first one is the intro:

     PHASE 1  THE PAGE-LOAD INTRO. Its markup, its critical CSS and its
              play/skip decision are inline in index.html, because the dark
              screen has to be painted on the FIRST frame â€” before any
              stylesheet or deferred script has run. The arch is a plain
              `clip-path: inset(... round ...)` keyframe on `.intro__photo`
              (see index.html), not a shape in a file. This file only
              orchestrates: it locks the scroll, waits for that CSS timeline
              to end, then lifts `#intro` out of the DOM and reports done.

              `.intro__photo` is a pixel twin of `#arch-intro-photo` (same
              file, same box, same object-fit/object-position, same global
              `img` filter), so removing `#intro` cannot move a single pixel.

     LAYER 0  #arch-intro-photo   the real hero photo. position:fixed, inset:0,
                                 z-index:0, MOUNTED FOR THE WHOLE SESSION and
                                 never removed. It is what the intro hands off
                                 to, and it is what the page shows behind the
                                 hero for as long as the arch layout is on.

     PHASE 2  .arch-hero          the existing wrapper around .lm-hero, driven
                                 by scroll. Nothing inside it is touched.

   PHASE 1 timeline (owned by the keyframes in index.html; this file only
   reacts to it, plus click/keypress to skip):
       0ms       #intro already painted, scroll locked, Lenis stopped
       0-1200ms  the arch rises out of the bottom of the screen
       1200-1450ms  hold
       1450-2550ms  the arch opens to full screen while #intro fades out
       2550ms    #intro removed, `arch-intro-done` lands, navbar + hero fade
                 in over 400ms
       5000ms    hard fail-safe (inline in index.html): #intro is dropped even
                 if this file never ran

   PHASE 2 timeline is continuous scroll, driven from a single rAF loop.

   --------------------------------------------------------------------------
   THE ONE INVARIANT
   --------------------------------------------------------------------------
   If the effect is not active â€” no JS, classic layout, reduced motion, short
   viewport, missing Lenis, missing hero â€” this file must leave the DOM *exact-
   ly* as it found it apart from removing nodes it created itself. `teardown()`
   makes that true and is wired to `.classic-layout` appearing at runtime, so a
   single class on <body> restores the standard layout instantly, with no
   reload. Every layer this file creates is a direct child of <body> and is
   removed by name, so nothing is left behind and no wrapper is stranded.

   This file never edits style.css and never writes an inline style that
   survives teardown.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- consts */

  /* Play the page-load intro on EVERY load, not once per session. Flip to
     `true` to bring back the old once-per-session behaviour. */
  const INTRO_ONCE_PER_SESSION = false;

  /* PHASE 1. MUST match the `intro-arch` / `intro-dim` durations declared in
     index.html's critical block: 2.55s, built from the 47.06% / 56.86% /
     87.06% stops that are the rise / hold / open beats. */
  var INTRO_MS = 2550;           /* when the CSS timeline says "open"         */
  var INTRO_DONE = 'arch-intro-done';
  var INTRO_ACTIVE = 'intro-active';

  /* PHASE 2. The hero travels 62% of the viewport height so the transition
     completes inside one natural gesture on every screen. */
var RISE_FRACTION = 0.62;
var SCALE_FROM = 0.94;         /* literal widening: .94 -> full-bleed    */

/* v2.2.6 â€” the dome is gated on the MEASURED position of the apex, not on
   `--p`. See the `--dome-k` publish in apply() for the whole argument; the short
   version is that deriving the flatten window from `--p` assumed the apex sits at
   exactly `100svh - scrollY`, and when that assumption is off by even a little the
   crown has already finished flattening while it is still a third of the way down
   the screen.

   `DOME_HOLD_VH` is the one number: while the measured apex is at or below this
   fraction of the viewport height the crown stays fully round (`k = 1`), and the
   smoothstep from 1 to 0 runs over the band between there and `apex y = 0`.
   Must be > 0; the verification script asserts 0 < DOME_HOLD_VH < 1. */
var DOME_HOLD_VH = 0.30;

/* v2.2.6 â€” the slower rise. `SHEET_LERP` is the per-frame fraction by which the
   SMOOTHED rise progress chases the real one. Below 1 the smoothed value lags, and
   the sheet's rendered position is offset by exactly that lag, so the sheet
   arrives late and settles rather than tracking the scrollbar 1:1.

   0.06 is the value the brief named, and it is also roughly a 37% stretch of the
   reveal: the lag closes to 1/e of its opening size in 1/0.06 â‰ˆ 17 frames (~280ms
   at 60fps) and is within 5% by 50 frames (~830ms), which is a visible settle
   without ever feeling like the page is ignoring the scroll wheel.

   The lag is applied as a `translate3d` on `#sheet` and ONLY while it is non-zero
   (see SHEET_LAG_CLASS), because `transform` on the sheet promotes an element as
   tall as the whole page to its own compositing layer. Dropping the class the
   moment the reveal is over releases that layer instead of holding it for the
   rest of the session. */
var SHEET_LERP = 0.06;
var SHEET_LAG_CLASS = 'arch-rise-lag';

var IDLE_COMPLETE_MS = 2600;   /* never leave a reader stuck below the fold */
  var MIN_VIEWPORT_H = 520;      /* below this, skip the intro                */
  var ROOT_CLASS = 'arch-intro';
  var RISEN_CLASS = 'arch-risen';
  var INTRO_IMAGE = '/assets/Luxe.webp';
  var IMAGE_W = 1881;            /* true VP8X header dimensions; the layer  */
  var IMAGE_H = 836;             /* crops this, but do not lie              */

  /* Every class this file can leave on <body>. One list, so teardown cannot
     miss one — a stale `intro-active` would leave the navbar and hero hidden
     and a stale `arch-rise-lag` would hold a page-height compositing layer.

     v3.0.0: the curtain/title/mesh/nav classes went with the layers they
     belonged to. `arch-intro-done` and `intro-active` are the two the
     page-load intro reports through. */
  var BODY_CLASSES = [
    ROOT_CLASS, RISEN_CLASS, SHEET_LAG_CLASS, INTRO_ACTIVE, INTRO_DONE
  ];

  var doc = document;
  var body = doc.body;

  if (!body) return;

  /* ------------------------------------------------------------------ refs */

  var photo = null;              /* #arch-intro-photo — the real hero photo  */
  var photoImg = null;
  var intro = null;              /* #intro — the page-load intro, if playing */
  var introPhoto = null;         /* .intro__photo inside it                  */
  var archHero = null;           /* .arch-hero             (phase 2)        */
var sheetBg = null;            /* .sheet__bg â€” carries the border-radius  */
  var pSmooth = 0;               /* SHEET_LERP's smoothed rise progress      */
  var lagOn = false;             /* is SHEET_LAG_CLASS currently on?        */

  /* The last string actually written for each scroll-driven property. A frame
     that derives the same numbers writes nothing at all: setProperty is a
     style invalidation even when the value is identical, so comparing first is
     what turns a static frame into a no-op. `null` means "nothing on <body>
     right now", which is the state teardown restores. */
  var lastOffset = null;
  var lastScale = null;
  var lastDomeK = null;
  var lastLag = null;
  var risenOn = false;           /* is RISEN_CLASS on the hero right now?     */
  var lastScroll = null;         /* scrollY the last frame that did work      */
  var lastPhase = null;          /* phase   the last frame that did work      */
  var lastDocH = null;           /* document height the last frame that worked */

  var lenis = null;
  var rafId = 0;
  var timers = [];
  var cleanups = [];
  var introOffs = [];            /* listeners that only live while #intro does */
  var idleId = 0;

/* 'boot'   phase 1 — the page-load intro owns the screen and scroll is
             ignored entirely, so a restored position cannot start the hero
             rising behind it. Only reachable while #intro is playing.
     'scroll' phase 2: the hero rise is driven by scroll. */
  var phase = 'boot';

  /* Two distinct states, deliberately NOT one flag:
       - clearing a single `running` when phase 1 ended reported `false` for a
         page that was still fully arch (classes on <body>, Lenis alive, hero
         rise tracking scroll);
       - the re-entry guard then slipped, leaking a second Lenis, a second rAF
         loop and a duplicate layer stack.
     `booted` is the ownership flag; `introRunning` only guards phase 1. */
  var booted = false;
  var introRunning = false;

  /* --------------------------------------------------------------- helpers */

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Register a listener AND its inverse, so teardown can undo it. */
  function own(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    var off = function () { target.removeEventListener(type, fn, opts); };
    cleanups.push(off);
    return off;
  }

  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function isActive() {
    if (!body) return false;
    if (body.classList.contains('classic-layout')) return false;
    if (body.classList.contains('classic-mode')) return false;
    if (doc.documentElement.classList.contains('classic-layout')) return false;
    if (doc.documentElement.classList.contains('classic-mode')) return false;
    if (prefersReducedMotion()) return false;
    if (window.innerHeight < MIN_VIEWPORT_H) return false;
    if (typeof window.Lenis !== 'function') return false;
    if (!doc.querySelector('.arch-hero')) return false;
    return true;
  }

  function dropNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  /* True when Lenis has no scroll animation in flight, i.e. it will not move
     the page on the next frame. The public shape of that state differs across
     Lenis majors, so the three known ones are probed in order; an unrecognised
     build falls through to `true`, which is safe because the caller also
     requires an unchanged scrollY and a settled sheet lag before it skips. */
  function lenisIdle() {
    if (!lenis) return true;
    try {
      var probe = lenis.isScrolling;
      if (typeof probe === 'function') return !probe.call(lenis);
      if (typeof probe === 'boolean') return !probe;
      probe = lenis.isRunning;
      if (typeof probe === 'function') return !probe.call(lenis);
      if (typeof probe === 'boolean') return !probe;
      var inner = lenis.animated || lenis._animated;
      if (inner && typeof inner.isRunning === 'boolean') return !inner.isRunning;
    } catch (e) { /* unknown shape: fall back to the scrollY test */ }
    return true;
  }

  /* --------------------------------------------------------------- teardown */

/* Removes every trace of the effect: the photo, the intro node if it is still
     up, every body class, the three scroll-driven custom properties, the rAF
     loop, the timers, the listeners and Lenis. Safe to call more than once, and
     safe to call mid-intro — which is the case that matters, because toggling
     mid-animation is exactly when leaked listeners would be hardest to notice. */
  function teardown() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (idleId) { clearTimeout(idleId); idleId = 0; }

    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];

    cleanups.forEach(function (off) { off(); });
    cleanups = [];
    introOffs = [];

    if (lenis) {
      try { lenis.destroy(); } catch (e) { /* signature differs across majors */ }
      lenis = null;
    }

/* Reset the scroll-driven custom properties so the hero is identical to its
         pre-effect state. All of them must go, or a stale scale/offset survives.
         They live on <body> because the mesh clip reads them too; leaving any of
         them set would keep a stale arch window over the wash.

         `--p` is deliberately absent: nothing ever read it, so this file no
         longer publishes it and has nothing to clean up.

         v2.2.4: `--dome-k` joins the list for the same reason, and its case is stronger
         - see the note on its removal below. */
      if (archHero) {
        body.style.removeProperty('--arch-offset');
        body.style.removeProperty('--arch-scale');
        /* v2.2.4: `--dome-k` joins the list, and its removal matters MORE than the
           others. It is not an arch value and nothing else reads it, but it
           multiplies the sheet dome's radii, so leaving it behind would pin the
           crown at whatever depth the reader last scrolled to â€” a permanently
           squared-off sheet that no reload-free code path could recover, since the
           loop that would fix it is exactly what this teardown stops.

           `--arch-open` is removed too, even though v2.2.4 retired it. It is
           genuinely dead now, and CSS no longer reads it; keeping the removal is
           defensive only, so that a partially-cached stylesheet from v2.2.3 cannot
           find a live `--arch-open` and animate the sheet against the dome. */
        body.style.removeProperty('--dome-k');
        body.style.removeProperty('--arch-open');
        /* v2.2.6: `--sheet-lag` joins the list. It holds `#sheet` below its true
           scroll position, so leaving it behind after this loop stops would pin
           the whole sheet at an offset that nothing would ever correct. */
        body.style.removeProperty('--sheet-lag');
        archHero.classList.remove(RISEN_CLASS);
      }

    /* All effect state lives on <body>, so it all goes in one call. */
    body.classList.remove.apply(body.classList, BODY_CLASSES);

    /* The photo is the effect's backdrop; `#intro` belongs to the page-load
       intro and is only still here if it was mid-play when this ran. Removing
       the node also stops its animation, so there is no residue to clean up. */
    dropNode(photo);
    dropNode(intro);

    /* Releases the intro's scroll lock, which the gate in index.html put on
       <html> before this file ever ran. */
    doc.documentElement.classList.remove('intro-play');

    photo = null;
    photoImg = null;
    intro = null;
    introPhoto = null;
    archHero = null;
    sheetBg = null;
    pSmooth = 0;
    lagOn = false;
    lastOffset = lastScale = lastDomeK = lastLag = null;
    risenOn = false;
    lastScroll = null;
    lastPhase = null;
    lastDocH = null;
    booted = false;
    introRunning = false;
    phase = 'boot';
  }

  /* Live toggle for QA: ARCH.classic() / ARCH.on()
     `isRunning()` means "the effect currently owns this page", which stays true
     after phase 1 closes. It is NOT "the intro is still playing". */
  window.ARCH = {
    classic: teardown,
    on: function () { boot(true); },
    isRunning: function () { return booted; }
  };

  /* ------------------------------------------------------- 1. mount the photo */

  /* LAYER 0 — the real hero photo. Fixed, viewport-sized, MOUNTED FOR THE WHOLE
     SESSION and never removed or re-created. It is the backdrop the page shows
     wherever the hero and the sheet are not, and it is what `#intro` hands the
     screen over to: `.intro__photo` in index.html is a pixel twin of this node,
     so removing `#intro` reveals nothing that was not already there.

     It is deliberately created here rather than in the markup: it is arch-mode
     state, and teardown has to be able to take it away again. */
  function mountPhoto() {
    photo = doc.createElement('div');
    photo.id = 'arch-intro-photo';
    photo.setAttribute('aria-hidden', 'true');

    photoImg = doc.createElement('img');
    photoImg.src = INTRO_IMAGE;
    photoImg.alt = '';
    photoImg.width = IMAGE_W;
    photoImg.height = IMAGE_H;
    /* eager + high priority: this image IS the first paint of the page. Without
       `fetchpriority="high"` it queues behind the hero poster and the arch opens
       onto an empty layer — the one failure that makes the intro look broken
       rather than merely slow. */
    photoImg.loading = 'eager';
    photoImg.decoding = 'async';
    try { photoImg.setAttribute('fetchpriority', 'high'); } catch (e) { /* older UA */ }

    /* If the file is missing there is no backdrop at all, and `.intro__photo`
       is loading the same file — so do not leave the intro playing over an
       empty screen. `finishIntro` is idempotent, so a skip visit is safe. */
    own(photoImg, 'error', function () { finishIntro(); });

    photo.appendChild(photoImg);
    body.insertBefore(photo, body.firstChild);
  }

  /* --------------------------------------------------------- 2. phase 1 run */

  function lockScroll() {
    /* There is nothing to add here: the overflow lock is `html.intro-play`,
       which the gate in index.html set before this file ran, and it is what
       reserves the scrollbar gutter too. Lenis is the part CSS cannot do — it
       drives `window.scrollTo` itself, so `overflow: hidden` alone would not
       stop it moving the page. */
    if (lenis && typeof lenis.stop === 'function') lenis.stop();
  }

  function releaseScroll() {
    /* Takes the lock off <html> and hands the wheel back. Both happen in the
       same frame as removing `#intro`, so the scrollbar the gutter reserved
       reappears over the page the intro was already showing. */
    doc.documentElement.classList.remove('intro-play');
    if (lenis && typeof lenis.start === 'function') lenis.start();
  }

  /* Close the page-load intro and hand the screen to the photo already mounted
     behind it. Idempotent, because four things can reach it: the CSS animation
     ending, the deadline timer below, a click or keypress to skip, and — if
     this file races — the fail-safe in index.html. */
  function finishIntro() {
    if (!introRunning) return;
    introRunning = false;

    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];

    introOffs.forEach(function (off) { off(); });
    introOffs = [];

    /* The node goes first: removing it cancels the animation, so there is no
       half-faded residue left over the page. Everything it was showing is
       already underneath it, pixel for pixel. */
    dropNode(intro);
    intro = null;
    introPhoto = null;

    releaseScroll();

    /* The intro always ends at the top of the page, so make that true even if
       something scrolled underneath it. `scroll-behavior` is forced to `auto`
       while Lenis is alive, so this is an instant jump, not a smooth one. */
    try { window.scrollTo(0, 0); } catch (e) {}

    body.classList.remove(INTRO_ACTIVE);
    body.classList.add(INTRO_DONE);

    phase = 'scroll';

    /* A reader who never scrolls would be left looking at a hero that is still
       one viewport-height below the fold, so after a short grace period the rise
       is played out for them. Any real scroll cancels it. */
    idleId = later(function () { idleId = 0; idleComplete(); }, IDLE_COMPLETE_MS);
  }

  function idleComplete() {
    if (phase !== 'scroll') return;
    var m = riseDistance();
    if (m <= 0) return;
    if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(m, { duration: 1.2 });
    else window.scrollTo(0, window.scrollY + m);
  }

  function runIntro() {
    intro = doc.getElementById('intro');
    introPhoto = intro ? intro.querySelector('.intro__photo') : null;

    /* The gate in index.html adds `intro-play` to <html> only when it decided
       to play. */
    var playing = !!(intro && doc.documentElement.classList.contains('intro-play'));

    /* The photo is mounted either way: it is the page's backdrop for the whole
       session and the intro's hand-off target. */
    if (!playing) {
      /* A repeat visit, reduced motion, a short viewport, or a page with no
         #intro. There is nothing to play, so report done at once and throw the
         unused node away. */
      dropNode(intro);
      intro = null;
      mountPhoto();
      body.classList.add(INTRO_DONE);
      phase = 'scroll';
      idleId = later(function () { idleId = 0; idleComplete(); }, IDLE_COMPLETE_MS);
      return;
    }

    /* Set before mountPhoto() so its image-error handler finds the intro ours
       and can close it. */
    introRunning = true;

    mountPhoto();
    if (!introRunning) return; /* the photo failed and already closed it */

    /* Held back from the first frame the intro is ours. The critical CSS in
       index.html covers them while #intro is opaque; this is what carries them
       back, over the 400ms declared in arch-intro.css. */
    body.classList.add(INTRO_ACTIVE);

    lockScroll();

    /* A restored scroll position must not be revealed when the intro lifts. The
       gate already asked the browser not to restore one; this is the guarantee. */
    try { window.scrollTo(0, 0); } catch (e) {}

    /* Any interaction skips straight to the end state. */
    var skip = function () { finishIntro(); };
    introOffs.push(own(doc, 'click', skip, true));
    introOffs.push(own(doc, 'keydown', skip, true));

    /* The CSS animation is the authority. `window.__lmIntroAt` is when the gate
       added `intro-play`, i.e. when the animation actually started, so this
       deadline is measured from first paint and not from this deferred script.
       It exists for the case `animationend` never arrives — a backgrounded tab,
       a cancelled animation — and fires a beat after the animation would. */
    var started = (typeof window.__lmIntroAt === 'number') ? window.__lmIntroAt : now();
    later(function () { finishIntro(); }, Math.max(0, started + INTRO_MS - now()) + 120);

    if (introPhoto) {
      own(introPhoto, 'animationend', function (e) {
        if (e.animationName === 'intro-arch') finishIntro();
      });
    }
  }

  /* ------------------------------------------------ 3. phase 2 + lenis */

  function initLenis() {
    /* Lenis drives `window.scrollTo` natively, so app.js's scroll listeners
       (header `.scrolled`, the scroll-progress bar, drawer auto-close) keep
       reading a real `scrollY` and need no changes. */
    lenis = new window.Lenis({
      duration: 1.15,
      /* ease-out exponential: quick to respond, long settle, matched to the arch
         curve so the page does not change character after the intro. */
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      /* Native touch: Lenis' touch inertia fights the browser's own on iOS. */
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      /* The default is already false, but this file *depends* on owning the only
         rAF loop (see tick()). Stated explicitly so the invariant is visible. */
      autoRaf: false
    });

    /* While Lenis is live the page must not smooth-scroll twice (style.css sets
       `html:has(body.arch-intro) { scroll-behavior: auto }`; this inline rule is
       the same guarantee without needing `:has` support). Reverted on teardown. */
    doc.documentElement.style.scrollBehavior = 'auto';
    cleanups.push(function () { doc.documentElement.style.scrollBehavior = ''; });

    /* Hash links keep scrolling smoothly through Lenis now that native CSS
       smoothing is off: same landing (target flush with the viewport top, no
       offset) as a native anchor jump, and the URL hash is still updated. */
    own(doc, 'click', function (e) {
      if (!lenis || typeof lenis.scrollTo !== 'function') return;
      var node = e.target;
      while (node && node.nodeType !== 1) node = node.parentNode;
      if (!node || !node.closest) return;
      var a = node.closest('a[href^="#"]');
      if (!a) return;
      var id;
      try { id = decodeURIComponent(a.hash.slice(1)); } catch (err) { return; }
      if (!id) return;
      var target = doc.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.2 });
      if (window.history && window.history.pushState) window.history.pushState(null, '', a.hash);
    });
  }

  /* Travel distance scales with the viewport so short and tall screens finish
     the transition over the same gesture. */
  function riseDistance() {
    return window.innerHeight * RISE_FRACTION;
  }

  function initArchRise() {
    if (!archHero) return null;

    /* v2.2.6 â€” the element that actually carries the `border-radius`, resolved ONCE.
       Reading it per frame would mean a querySelector inside the hot loop; more
       importantly this is the element whose `getBoundingClientRect().top` the dome
       gate below is defined against, so it must be the same node every frame. */
    sheetBg = doc.querySelector('.sheet__bg');

    var apply = function (rawScroll, force) {
      if (!archHero) return;

      /* IDLE FRAME â€” one early return buys the whole frame.

         `lastScroll`/`lastPhase` remember what the last frame that did work saw.
         When neither has moved, Lenis has no animation in flight and the sheet's
         lag has already settled (`lagOn` false means no write can come out of
         this function any more), there is nothing left to publish: the rect read
         below, the easing maths and every style write are all skipped together.

         `lagOn` is the third condition rather than an optimisation: the lag is a
         smoothed chase, so it keeps closing for ~50 frames after the scroll
         position itself has stopped. Skipping while it is still open would freeze
         `#sheet` mid-settle with the compositing layer held, so those frames are
         real work and are not skipped.

         `force` is the resize path, which must re-measure even when the scroll
         position has not moved, because the rise distance and the dome band are
         both expressed in viewport height.

         Document height is the fourth condition, and it is what keeps the skip
         visually identical to running: `--dome-k` is read off a rect, so a late
         image or a font swap that moves the sheet has to re-publish it even
         though nobody scrolled. `scrollHeight` sees all of those (they all grow
         or shrink the document), it never moves from this file's own output
         (every property here is a transform), and when nothing wrote styles
         last frame it costs no forced reflow at all. */
      var seen = rawScroll || 0;
      var docH = doc.documentElement.scrollHeight;
      if (!force && seen === lastScroll && phase === lastPhase &&
          docH === lastDocH && lenisIdle() && !lagOn) return;
      lastScroll = seen;
      lastPhase = phase;
      lastDocH = docH;

      /* PHASE 1 IGNORES SCROLL. If the browser restored a scroll position, or
         the user hit a hash link, the hero would otherwise begin its rise while
         the curtain is still opaque â€” the two phases would visibly fight.
         Forcing 0 here makes phase 2 start from a clean handoff the moment
         finishIntro() flips the phase. */
      var scroll = phase === 'boot' ? 0 : (rawScroll || 0);

      /* v2.2.6 â€” READ FIRST, WRITE AFTER. Everything this function publishes is a
         custom property on <body>, and every one of those writes invalidates
         layout. Reading `getBoundingClientRect()` after any of them would force a
         synchronous reflow on every frame, which is the classic read/write
         thrash. One read of one rect, hoisted to the top of the frame, is not. */
      var vh = window.innerHeight || 1;
      var apexY = null;
      if (sheetBg) apexY = sheetBg.getBoundingClientRect().top;

      var m = riseDistance() || 1;
      var lift = Math.min(Math.max(scroll, 0), m);
      var t = lift / m;

      /* Ease-out that actually REACHES m. The original formula
         `lift - lift*lift/(2*m)` peaks at m/2, so the hero stopped half way and
         never actually rose into place. */
      var eased = m * (1 - (1 - t) * (1 - t));

      /* The scale uses a CUBIC ease-out while the offset uses a quadratic one,
         so the hero widens to full-bleed slightly ahead of completing its
         travel. It therefore reads as the arch expanding while it is still
         rising rather than as one locked-up move. */
      var sc = 1 - Math.pow(1 - t, 3);

      /* `--arch-offset` is the NET translate: it starts at +m (the hero sits one
         viewport-height below the fold) and decays to 0, at which point the hero
         is exactly where it sits with no effect applied. `--arch-scale` is the
         literal widening.

         Both are published on <body>, NOT on the hero. The hero reads them by
         inheritance, but the mesh layers are siblings of the hero rather than
         descendants, and section 4's clip-path rebuilds the hero's silhouette out
         of these same numbers so the wash window tracks the hero exactly. One
         source, written once per frame, cannot drift.

         `--arch-open` used to be published here too and is not any more. It was
         the clip-path dome's widening term; v2.2.4 replaced that dome with a
         `border-radius` on `.sheet__bg` driven by `--dome-k`, which is written
         below. Nothing writes or reads `--arch-open` any more.

         Both writes are guarded: a static frame derives the identical string and
         performs no style invalidation at all. */
      var offsetStr = (m - eased).toFixed(2) + 'px';
      if (offsetStr !== lastOffset) {
        lastOffset = offsetStr;
        body.style.setProperty('--arch-offset', offsetStr);
      }
      var scaleStr = (SCALE_FROM + (1 - SCALE_FROM) * sc).toFixed(4);
      if (scaleStr !== lastScale) {
        lastScale = scaleStr;
        body.style.setProperty('--arch-scale', scaleStr);
      }

      /* `p` is deliberately NOT the rise progress `t`. `t` saturates at 1 once
         the hero has finished rising, i.e. at 62% of a viewport height â€” well
         before the sheet's domed top edge (which sits directly below this
         100svh hero) has travelled up to meet the copy â€” so anything smoothed
         on `t` settles while a third of the hero is still on screen, which is
         the "text vanishes too early" failure the brief explicitly rules out.

         So `p` is measured over a FULL viewport height: it reaches 1 exactly as
         the sheet's dome arrives at the top of the viewport, which is the moment
         the copy stops being visible anyway. Past that it clamps, so it cannot
         overshoot into negative opacity or a runaway translate.

         `window.innerHeight` rather than the hero's own `offsetHeight`, because
         measuring the element would mean a layout read every frame.

         v2.2.4 published this as `--p` for the hero copy's scroll fade. Nothing
         reads that custom property (the stylesheets only ever mention it in
         comments), so the per-frame write is dropped and `p` is kept as the pure
         local it always was: the sheet lag below is `p - pSmooth`. */
      var heroSpan = vh;
      var p = Math.min(Math.max(scroll, 0) / heroSpan, 1);

      /* v2.2.6 â€” `--dome-k` NOW READS THE APEX'S REAL POSITION.

         v2.2.4 derived the flatten window from `--p`, which is only equivalent to
         the apex's screen position if the apex really does sit at exactly
         `100svh - scrollY`. That assumption is load-bearing and it is wrong in at
         least two ordinary cases:

           - the apex is `.sheet__bg`'s top, and `.sheet` is a NORMAL FLOW box, so
             the apex starts at `.arch-hero`'s height (`min-height: 100svh`). On a
             mobile browser `100svh` is the SMALL viewport height, so the apex
             begins below the fold rather than at it and `--p` runs ahead of the
             real position;
           - anything that changes the sheet's document offset changes it again.

         Either way the error is silent, and the symptom is exactly the one the
         brief reports: with START 0.12 and END 0.72 the crown is ~99.8% flat by the
         time the apex is still a third of the way down the screen, so the sheet's
         top edge reads as a straight line while it is nowhere near the top of the
         page.

         `getBoundingClientRect().top` on the element that owns the radius is the
         position that actually matters to the reader â€” it is what "how far down the
         screen is the curve right now" means, and it is immune to all of the above
         because it is the layout, not a formula about it.

         The shape of the curve, measured back up from the apex:

           apexY >= DOME_HOLD_VH * vh   ->  k = 1, fully round, no flattening at all
           apexY <= 0                   ->  k = 0, square corners at the top edge
           in between                   ->  smoothstep

         `u` is the apex's progress from the top of the screen, normalised so that 1
         is exactly the hold line, which is why `u > 1` clamps to a fully round
         dome instead of extrapolating. `smoothstep` (`u*u*(3-2u)`) is used rather
         than the old cubic ease because it is the only one of the four with zero
         SLOPE at both ends: the crown starts to relax with no visible velocity and
         arrives flat with no visible stop. The old `easeOutCubic` had a non-zero
         derivative at both ends, which is why the flatten read as a snap.

         The fallback is not a guess dressed up as one: `100svh - scroll` is the
         apex position whenever `.arch-hero` really is one viewport tall and
         nothing offsets the sheet, so it reproduces the measured value to within
         the same assumption the old code made outright. It exists only for the
         case where `.sheet__bg` cannot be found at all. */
      var apex = apexY;
      if (apex === null) apex = heroSpan - scroll;
      var u = Math.min(Math.max(apex / (heroSpan * DOME_HOLD_VH), 0), 1);
      var domeK = u * u * (3 - 2 * u);
      var domeStr = domeK.toFixed(4);
      if (domeStr !== lastDomeK) {
        lastDomeK = domeStr;
        body.style.setProperty('--dome-k', domeStr);
      }

      /* v2.2.6 â€” THE SLOWER RISE. `pSmooth` chases `p` at SHEET_LERP per frame and
         always trails it, so `lag` is never negative: the sheet is only ever held
         DOWN from its true scroll position, never pushed past it. It resolves to 0
         whenever scrolling stops, because then `p` stops moving and the smoothed
         value walks into it.

         This is a `transform` and not a change to the rise distance, and that
         choice is the whole point. `RISE_FRACTION` only drives `--arch-offset`,
         which moves `.arch-hero` â€” an EMPTY box (the hero copy moved into the sheet
         in v2.2.5) â€” so lengthening it buys nothing visible at all. The cream sheet
         is a normal flow element: it rises at exactly the scroll rate, and the only
         way to make it travel more slowly without adding page height is to offset
         where it is drawn. Nothing here touches layout, so the page height, every
         section's position, the sticky rules inside the sheet and the footer are all
         bit-identical to before.

         0.5px is the release threshold rather than 0: below it the transform is
         sub-pixel and invisible, and taking the class off at that point is what
         stops a page-height compositing layer from being held for the rest of the
         session. */
      pSmooth += (p - pSmooth) * SHEET_LERP;
      var lag = (p - pSmooth) * heroSpan;
      var wantLag = lag > 0.5;
      if (wantLag) {
        var lagStr = lag.toFixed(1) + 'px';
        if (lagStr !== lastLag) {
          lastLag = lagStr;
          body.style.setProperty('--sheet-lag', lagStr);
        }
      } else if (lastLag !== null) {
        /* On the transition only. Removing a property that is not there is
           still a style write, and it used to run on every settled frame. */
        lastLag = null;
        body.style.removeProperty('--sheet-lag');
      }
      if (wantLag !== lagOn) {
        lagOn = wantLag;
        body.classList.toggle(SHEET_LAG_CLASS, wantLag);
      }

      /* State change only: the class is either on or off, so a forced toggle
         every frame is pure invalidation of a class list that did not move. */
      var risen = t >= 0.999;
      if (risen !== risenOn) {
        risenOn = risen;
        archHero.classList.toggle(RISEN_CLASS, risen);
      }

      /* Any real scroll intent means the reader is driving, so drop the
         auto-complete safety net. */
      if (t > 0.02 && idleId) { clearTimeout(idleId); idleId = 0; }
    };

    apply(window.scrollY || 0, true);

    own(window, 'resize', function () { apply(window.scrollY || 0, true); }, { passive: true });

    return apply;
  }

  /* ------------------------------------------------------------------ boot */

  function boot(force) {
    if (booted) return;
    if (!force && !isActive()) { teardown(); return; }

    archHero = doc.querySelector('.arch-hero');
    if (!archHero) { teardown(); return; }

    booted = true;
    body.classList.add(ROOT_CLASS);

    /* Watch for `classic-layout` appearing on <body> after load so the switch is
       instant and needs no reload. */
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (body.classList.contains('classic-layout') || body.classList.contains('classic-mode')) teardown();
      });
      mo.observe(body, { attributes: true, attributeFilter: ['class'] });
      cleanups.push(function () { mo.disconnect(); });
    }

    /* The hero is positioned BEFORE Lenis exists, so the first paint already has
       the correct at-rest offset and `#intro` never hands over to a hero that
       still has to settle. */
    var apply = initArchRise();
    initLenis();

    /* One rAF loop drives Lenis and the hero rise, so this file performs exactly
       one scroll read per frame instead of two competing listeners. That single
       read is what keeps phase 2 locked to scroll with no lag: the hero offset,
       its scale and the radius flatten all derive from the same `t` in the same
       frame, so no layer can be a frame behind another.

       `raf` below matters: Lenis' implementation is
       `raf(e){ let t = e - (this.time || e); this.time = e; animate.advance(t * .001) }`
       â€” it reads its argument as a *timestamp in milliseconds*. Feeding it
       `window.scrollY` (the obvious-looking mistake) makes the "delta" a pixel
       count: non-zero while the page moves, exactly 0 on any idle frame, so the
       animation clock stalls when the user is not scrolling and smooth scroll
       feels like it randomly drops. The rAF timestamp is literally what Lenis
       passes to itself in autoRaf mode. */
    var tick = function (ts) {
      rafId = requestAnimationFrame(tick);
      if (lenis) lenis.raf(ts);
      if (apply) apply(window.scrollY || 0);
    };
    rafId = requestAnimationFrame(tick);

    runIntro();
  }

  /* `defer` guarantees DOMContentLoaded has fired, but this is written to be
     correct if the file is ever loaded without it. */
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () { boot(false); }, { once: true });
  } else {
    boot(false);
  }
})();