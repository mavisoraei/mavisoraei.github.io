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

  /* "All Lemon Services": live search + popular chips; <details> handles expansion. */
  function initServicesDirectory() {
    var section = document.querySelector('.home-services');
    if (!section || section.dataset.svcDirectory) return;
    section.dataset.svcDirectory = '1';

    var find = section.querySelector.bind(section);
    var input = find('.lm-svc-input');
    var grid = find('.lm-svc-grid');
    var results = find('.lm-svc-results');
    var list = find('.lm-svc-results-list');
    var count = find('.lm-svc-results-count');
    var empty = find('.lm-svc-empty');
    var tpl = find('.lm-svc-row-tpl');
    if (!input || !grid || !results || !list || !count || !empty || !tpl) return;

    var index = [].map.call(section.querySelectorAll('.lm-svc-card a'), function (a) {
      return {
        a: a,
        label: a.textContent.trim(),
        hay: (a.textContent + ' ' + (a.closest('.lm-svc-card').dataset.svcCat || ''))
          .toLowerCase().replace(/[-_/]+/g, ' ')
      };
    });

    section.querySelectorAll('.lm-svc-toggle').forEach(function (btn) {
      var card = btn.closest('.lm-svc-card');
      var body = card.querySelector('.lm-svc-more-body');
      btn.onclick = function () {
        var open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open);
        body.toggleAttribute('inert', !open);
        btn.textContent = open ? 'Show less' : btn.dataset.more;
      };
    });

    function render(raw) {
      var terms = (raw || '').trim().toLowerCase()
        .replace(/[-_/]+/g, ' ').split(/\s+/).filter(Boolean);
      var active = terms.length > 0;
      var hits = active ? index.filter(function (item) {
        return terms.every(function (t) { return item.hay.indexOf(t) !== -1; });
      }) : [];

      grid.hidden = active;
      results.hidden = !active;
      list.textContent = '';
      empty.hidden = true;
      count.textContent = '';
      if (!active) return;

      hits.forEach(function (item) {
        var row = tpl.content.firstElementChild.cloneNode(true);
        var link = row.firstElementChild;
        link.href = item.a.getAttribute('href');
        link.textContent = item.label;
        list.appendChild(row);
      });

      count.textContent = hits.length
        ? hits.length + (hits.length === 1 ? ' treatment' : ' treatments')
        : '';
      empty.hidden = hits.length > 0;
      if (!hits.length) {
        empty.textContent = 'No treatments match "' + raw.trim() +
          '". Try a shorter word, or clear the search.';
      }
    }

    input.oninput = function () { render(input.value); };

    input.onkeydown = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        input.value = '';
        render('');
        input.focus();
      }
    };

    section.querySelectorAll('.lm-svc-chip').forEach(function (chip) {
      chip.onclick = function () {
        input.value = chip.dataset.svcQ || chip.textContent.trim();
        render(input.value);
      };
    });
  }

  function boot() {
    initCaseSliders();
    moveServicesAfterLocation();
    initServicesDirectory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();