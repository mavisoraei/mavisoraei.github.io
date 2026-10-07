/* ==========================================================================
   ARCH INTRO â€” layered arch-curtain reveal + domed sheet  (v2.2.6)
   ==========================================================================
   Paired with /assets/css/arch-intro.css. Loaded on /index.html only, after
   /vendor/lenis.min.js and /app.js, with `defer`.

   Builds and owns four things:

     LAYER 0  #arch-intro-photo   the clinic photo, position:fixed, z-index:-2.
                                 MOUNTED FOR THE WHOLE SESSION. It is the base
                                 layer the curtain's arch hole reveals, and it is
                                 never removed or re-created mid-page â€” that is
                                 what makes "zoom into the image" land on
                                 something instead of on a blank layer.
     LAYER 1  #arch-intro-overlay the curtain: frame.svg and nothing else. No CSS
                                 background anywhere, so the darkness is the
                                 SVG's own matte rather than a flat block over
                                 the photograph.
     LAYER 2  #arch-intro-ui      the brand title + sub, above the arch ceiling.

     PHASE 2  .arch-hero          the existing wrapper around .lm-hero, driven
                                 by scroll. Nothing inside it is touched.

   PHASE 1 timeline (all on the curtain except the title and navbar):
       0ms        curtain + photo mounted, page scroll locked
       0-1300ms   STEP 1  curtain rises from the bottom as a small semi-oval
       950-1700ms STEP 3  title + sub fade in above the arch ceiling
       1500-3100ms STEP 4  curtain zooms dramatically into the photograph until
                          the matte is entirely off-screen
       3100ms     STEP 5  navbar drops in, immediately after the zoom
       4120ms     phase 1 closes: curtain removed, mesh crossfaded back in,
                   title faded, phase 2 armed

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

  /* PHASE 1. These MUST match the CSS durations of the same name in
     arch-intro.css (arch-stage-rise, arch-mask-zoom, arch-title-in). */
  var RISE_MS = 1300;           /* curtain enters from the bottom          */
  var TITLE_AT = 800;            /* title starts fading in                  */
  var TITLE_MS = 700;            /* title fade duration                     */
  var ZOOM_DELAY = 1500;        /* dramatic zoom starts                    */
  var ZOOM_MS = 1600;           /* dramatic zoom duration                  */
  var NAV_MS = 850;             /* navbar drop duration (matches the CSS)  */
  var FINISH_MS = ZOOM_DELAY + ZOOM_MS + NAV_MS + 170;

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
  var LOCK_CLASS = 'arch-locked';
  var RISEN_CLASS = 'arch-risen';
  var FRAME_SVG = '/assets/frame.svg';
  var INTRO_IMAGE = '/assets/Luxe.webp';
  var IMAGE_W = 1881;            /* true VP8X header dimensions; the layer  */
  var IMAGE_H = 836;             /* crops this, but do not lie              */

  /* Every class this file can leave on <body>. One list, so teardown cannot
     miss one â€” a stale `arch-locked` would freeze the page and a stale
     `arch-mesh-in`/`arch-hero-up` would fight the next run. */
  var BODY_CLASSES = [
    ROOT_CLASS, LOCK_CLASS, RISEN_CLASS, SHEET_LAG_CLASS,
    'arch-intro-done', 'arch-nav-in', 'arch-scrolling',
    'arch-title-in', 'arch-mesh-in', 'arch-hero-up', 'arch-window'
  ];

  var doc = document;
  var body = doc.body;

  if (!body) return;

  /* ------------------------------------------------------------------ refs */

  var photo = null;              /* #arch-intro-photo      (layer 0)        */
  var photoImg = null;
  var overlay = null;            /* #arch-intro-overlay    (layer 1)        */
  var frameEl = null;            /* the .arch-intro-frame that zooms        */
  var ui = null;                 /* #arch-intro-ui         (layer 2)        */
  var archHero = null;           /* .arch-hero             (phase 2)        */
var sheetBg = null;            /* .sheet__bg â€” carries the border-radius  */
  var pSmooth = 0;               /* SHEET_LERP's smoothed rise progress      */
  var lagOn = false;             /* is SHEET_LAG_CLASS currently on?        */
  var lenis = null;
  var rafId = 0;
  var timers = [];
  var cleanups = [];
  var idleId = 0;

  /* 'boot'   phase 1 is running and scroll is ignored entirely, so a restored
             scroll position cannot start the hero rising behind the curtain
     'scroll' phase 2: the hero rise is driven by scroll
     The old code had a third 'done' phase because the curtain used to survive
     into the scroll step. It no longer does â€” the curtain is fully off-screen
     by the time phase 1 closes and is removed then, so two phases is all there
     is. */
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

  /* --------------------------------------------------------------- teardown */

  /* Removes every trace of the effect: all three layers, every body class, the
     three scroll-driven custom properties, the rAF loop, the timers, the
     listeners and Lenis. Safe to call more than once, and safe to call
     mid-intro â€” which is the case that matters, because toggling during the
     zoom is exactly when leaked listeners would be hardest to notice. */
  function teardown() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (idleId) { clearTimeout(idleId); idleId = 0; }

    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];

    cleanups.forEach(function (off) { off(); });
    cleanups = [];

    if (lenis) {
      try { lenis.destroy(); } catch (e) { /* signature differs across majors */ }
      lenis = null;
    }

/* Reset the scroll-driven custom properties so the hero is identical to its
         pre-effect state. All of them must go, or a stale scale/offset survives.
         They live on <body> because the mesh clip reads them too; leaving any of
         them set would keep a stale arch window over the wash.

v2.2.3: `--p` joins that list. It is not an arch value and nothing else
         reads it, but it is published from the same loop and this teardown kills
         that loop (see `cancelAnimationFrame` above) - so leaving it behind would
         freeze the hero copy at whatever opacity and translate the reader had
         scrolled to, permanently, with no way to recover short of a reload.

         v2.2.4: `--dome-k` joins it for the same reason, and its case is stronger
         - see the note on its removal below. */
      if (archHero) {
        body.style.removeProperty('--arch-offset');
        body.style.removeProperty('--arch-scale');
        body.style.removeProperty('--p');
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

    /* All three layers were created by this file, so all three are removed by
       name. No wrapper is left stranded around the real page content. */
    dropNode(ui);
    dropNode(overlay);
    dropNode(photo);

    ui = null;
    overlay = null;
    frameEl = null;
    photo = null;
    photoImg = null;
    archHero = null;
    sheetBg = null;
    pSmooth = 0;
    lagOn = false;
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

  /* --------------------------------------------------------- 1. build layers */

function buildLayers() {
    /* ---- LAYER 0: THE FIXED CLINIC PHOTO -------------------------------
       Deliberately NOT a child of the curtain. It is the base layer for the
       whole session: the curtain's arch hole reveals it during phase 1, and it
       is still mounted (behind the mesh, at z-index -2) once the hero has taken
       over as the page's backdrop. */
    photo = doc.createElement('div');
    photo.id = 'arch-intro-photo';
    photo.setAttribute('aria-hidden', 'true');

    photoImg = doc.createElement('img');
    photoImg.src = INTRO_IMAGE;
    photoImg.alt = '';
    photoImg.width = IMAGE_W;
    photoImg.height = IMAGE_H;
    /* eager + high priority: this image IS the first paint of the page. Without
       `fetchpriority="high"` it queues behind the hero poster and the arch
       opens onto an empty layer â€” the one failure that makes the intro look
       broken rather than merely slow. */
    photoImg.loading = 'eager';
    photoImg.decoding = 'async';
    try { photoImg.setAttribute('fetchpriority', 'high'); } catch (e) { /* older UA */ }

    /* If the photo is missing, the arch opens onto nothing at all. Skip the
       intro instead of showing an empty hole for the whole splash. */
    own(photoImg, 'error', function () { finishIntro(true); });

    photo.appendChild(photoImg);
    body.insertBefore(photo, body.firstChild);

    /* ---- LAYER 1: the arch curtain --------------------------------------
       frame.svg only. No background colour is set on this element or on the
       frame, so the darkness is the SVG's own matte and the photograph is
       never covered by a flat block. */
    overlay = doc.createElement('div');
    overlay.id = 'arch-intro-overlay';
    /* Purely decorative: the real <header> and <main> are already in the
       accessibility tree. It holds no focusable descendants. */
    overlay.setAttribute('aria-hidden', 'true');

    var stage = doc.createElement('div');
    stage.className = 'arch-intro-stage';

    frameEl = doc.createElement('div');
    frameEl.className = 'arch-intro-frame';
    frameEl.style.backgroundImage = 'url("' + FRAME_SVG + '")';

    stage.appendChild(frameEl);
    overlay.appendChild(stage);
    body.insertBefore(overlay, body.firstChild);

    /* ---- LAYER 2: the brand title, above the arch ceiling ---------------- */
    ui = doc.createElement('div');
    ui.id = 'arch-intro-ui';
    ui.setAttribute('aria-hidden', 'true');

    var sub = doc.createElement('p');
    sub.className = 'arch-brand-sub';
    sub.textContent = 'West Tehran';

    var title = doc.createElement('p');
    title.className = 'arch-brand-title';
    title.textContent = 'Lemon Aesthetic Clinic';

    ui.appendChild(sub);
    ui.appendChild(title);
    body.insertBefore(ui, body.firstChild);

    return frameEl;
  }

  /* --------------------------------------------------------- 2. phase 1 run */

  function lockScroll() {
    /* Two layers, because each covers a hole in the other:
       - `lenis.stop()` stops Lenis driving window.scrollTo;
       - `overflow:hidden` on <html> stops *native* scrolling (keyboard,
         scrollbar drag, find-in-page) and hides the scrollbar so there is no
         reflow jump. Neither alone is sufficient. */
    body.classList.add(LOCK_CLASS);
    if (lenis && typeof lenis.stop === 'function') lenis.stop();
  }

  function releaseScroll() {
    body.classList.remove(LOCK_CLASS);
    if (lenis && typeof lenis.start === 'function') lenis.start();
  }

  /* Close phase 1 and hand over to phase 2.
     `immediate` means the intro was abandoned (a missing asset), so nothing is
     animated: the curtain is dropped, the mesh comes straight back and the
     title is dismissed. */
  function finishIntro(immediate) {
    if (!introRunning) return;
    introRunning = false;

    body.classList.add('arch-intro-done');
    releaseScroll();

    /* The curtain's matte is entirely off-screen by now, so it has nothing left
       to contribute. Removing it HERE â€” rather than holding it until scroll
       progress 1 â€” is what keeps phase 2 to a single moving part (the hero) and
       leaves no full-screen wrapper stranded over the page. */
    dropNode(overlay);
    overlay = null;
    frameEl = null;

    /* Hand the backdrop over: fade the site's real mesh back in as the page's
       own background, cut the photograph down to the arch silhouette, and
       dismiss the title layer, which sits above the hero and would otherwise
       float over the hero's own content.

       The order matters only in that all three land in the same frame. Nothing
       animates here, so the photograph is visible in its new clipped position on
       the very first frame after the curtain goes â€” no flash of the full-bleed
       image outside the arch, and no jump, because the photo node is the same
       node in the same fixed box it was during phase 1. Only its z-order and its
       clip changed, and both of those were already invisible behind an opaque
       curtain. */
    body.classList.add('arch-mesh-in');
    body.classList.add('arch-window');
    body.classList.add('arch-hero-up');

    phase = 'scroll';

    if (immediate) return;

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
    /* Set before anything that can settle it, so the image-error path inside
       buildLayers() finds `introRunning` already true. */
    introRunning = true;

    var zoomTarget = buildLayers();

    lockScroll();

    /* STEP 3 â€” the title fades in above the arch ceiling while the curtain is
       still settling. Timed, not event-driven, so it lands at the same beat
       whatever the tab is doing. */
    later(function () {
      if (!introRunning) return;
      body.classList.add('arch-title-in');
    }, TITLE_AT);

    /* STEP 5 â€” the navbar drops in immediately after the zoom has finished. */
    later(function () {
      if (!introRunning) return;
      body.classList.add('arch-nav-in');
    }, ZOOM_DELAY + ZOOM_MS);

    /* The authoritative close. */
    later(function () { finishIntro(false); }, FINISH_MS);

    /* Safety net only. `arch-mask-zoom` really is the zoom, so its end is a
       genuine "the curtain is open" signal â€” but it is floored at FINISH_MS so
       it can never cut the navbar's drop short. If the animation never fires
       (a skipped animation, a backgrounded tab) the FINISH_MS timer above
       still closes the phase on its own. */
    if (zoomTarget) {
      own(zoomTarget, 'animationend', function (e) {
        if (e.target !== zoomTarget || e.animationName !== 'arch-mask-zoom') return;
        if (immediateGuardPassed()) finishIntro(false);
      });
    }
  }

  /* Floors the animation-driven close so it can never run before the timeline
     says it should. */
  function immediateGuardPassed() {
    return elapsed() >= FINISH_MS - 40;
  }

  var startedAt = 0;
  function elapsed() {
    return (window.performance && performance.now ? performance.now() : Date.now()) - startedAt;
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

    var apply = function (rawScroll) {
      if (!archHero) return;

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
         below alongside `--p`. Nothing writes or reads `--arch-open` any more. */
      body.style.setProperty('--arch-offset', (m - eased).toFixed(2) + 'px');
      body.style.setProperty('--arch-scale', (SCALE_FROM + (1 - SCALE_FROM) * sc).toFixed(4));

      /* v2.2.4 â€” `--p`, the hero copy's scroll fade, published from THIS function
         rather than from a second scroll listener. The one-scroll-read-per-frame
         rule stated above is the reason: a separate `scroll` handler would be a
         second read of the same value on the same frame, and the two would be
         free to disagree by a frame at exactly the moment that matters â€” while
         the dome is sweeping over the copy.

         It is deliberately NOT the rise progress `t`. That saturates at 1 once the
         hero has finished rising, i.e. at 62% of a viewport height â€” well before
         the sheet's domed top edge (which sits directly below this 100svh hero)
         has travelled up to meet the copy. Using it here would have the hero copy
         fully faded with a third of the hero still on screen, which is the "text
         vanishes too early" failure the brief explicitly rules out.

         So `--p` is measured over a FULL viewport height: it reaches 1 exactly as
         the sheet's dome arrives at the top of the viewport, which is the moment
         the copy stops being visible anyway. Past that it clamps, so it cannot
         overshoot into negative opacity or a runaway translate.

         `window.innerHeight` rather than the hero's own `offsetHeight`, because
         measuring the element would mean a layout read every frame. The cost is
         that on a phone, where the stacked hero can exceed 100svh, `--p` reaches 1
         slightly before the dome arrives and the copy is a little more faded by
         the time it is covered â€” the safe direction to be wrong in. */
      var heroSpan = vh;
      var p = Math.min(Math.max(scroll, 0) / heroSpan, 1);
      body.style.setProperty('--p', p.toFixed(4));

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
      body.style.setProperty('--dome-k', domeK.toFixed(4));

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
      if (wantLag) body.style.setProperty('--sheet-lag', lag.toFixed(1) + 'px');
      else body.style.removeProperty('--sheet-lag');
      if (wantLag !== lagOn) {
        lagOn = wantLag;
        body.classList.toggle(SHEET_LAG_CLASS, wantLag);
      }

      archHero.classList.toggle(RISEN_CLASS, t >= 0.999);
      body.classList.toggle('arch-scrolling', scroll > 4);

      /* Any real scroll intent means the reader is driving, so drop the
         auto-complete safety net. */
      if (t > 0.02 && idleId) { clearTimeout(idleId); idleId = 0; }
    };

    apply(window.scrollY || 0);

    own(window, 'resize', function () { apply(window.scrollY || 0); }, { passive: true });

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
    startedAt = window.performance && performance.now ? performance.now() : Date.now();

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
       the correct at-rest offset and the curtain never reveals a settled hero
       for a frame. */
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
    var tick = function (now) {
      rafId = requestAnimationFrame(tick);
      if (lenis) lenis.raf(now);
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