/* ==========================================================================
   HOME SECTIONS (T4) — behaviours for the home page.
   Loaded on /index.html only, after app.js (which owns the old marquee and
   its hover reveal). This file replaces that component:
   - the before/after sliders answer CLICK / DRAG only (no hover),
   - the "All Lemon Services" section is moved to sit right AFTER
     "Clinic access and location".
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCaseSliders() {
    var cards = document.querySelectorAll('.case-card');
    cards.forEach(function (card) {
      if (card.dataset.caseSlider) return;
      card.dataset.caseSlider = '1';

      var media = card.querySelector('.case-media');
      var range = card.querySelector('.case-range');
      if (!media || !range) return;

      var paint = function (v) {
        if (v < 0) v = 0;
        else if (v > 100) v = 100;
        media.style.setProperty('--pos', v + '%');
      };
      var fromX = function (clientX) {
        var r = media.getBoundingClientRect();
        if (!r.width) return;
        var p = (clientX - r.left) / r.width * 100;
        paint(p);
        if (!reduce) range.value = Math.round(p);
      };

      var dragging = false;
      var down = function (e) {
        dragging = true;
        try { range.setPointerCapture(e.pointerId); } catch (err) {}
        fromX(e.clientX);
      };
      var move = function (e) {
        if (dragging) fromX(e.clientX);
      };
      var up = function (e) {
        dragging = false;
        try { range.releasePointerCapture(e.pointerId); } catch (err) {}
      };

      range.addEventListener('pointerdown', down);
      range.addEventListener('pointermove', move);
      range.addEventListener('pointerup', up);
      range.addEventListener('pointercancel', up);
      range.addEventListener('input', function () { paint(Number(range.value)); });

      /* Keyboard hand-off: keep the handle in sync with `--pos`. */
      var io = new ResizeObserver(function () {
        var current = parseFloat(media.style.getPropertyValue('--pos')) || 50;
        if (!isNaN(current)) range.value = Math.round(current);
      });
      io.observe(media);
    });
  }

  function moveServicesAfterLocation() {
    if (document.body.dataset.homeSectionMove) return;
    document.body.dataset.homeSectionMove = '1';

    var services = document.querySelector('.home-services');
    var location = document.querySelector('.home-local');
    if (services && location && location.nextSibling !== services &&
        location.parentNode) {
      location.parentNode.insertBefore(services, location.nextSibling);
    }
  }

  function boot() {
    initCaseSliders();
    moveServicesAfterLocation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();