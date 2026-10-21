/* nav-extras.js — Services menu extras (shared by the 13 pages that carry the
   header). Two jobs, both additive and both no-ops without their markup:

   1. Mobile accordion. Under 768px each service category title in the drawer
      (and in the panel, if it is ever shown that small) gets its own toggle
      button. The category <a> is left exactly as it was — the button is a
      sibling, so every link, href and label survives. Above 767px the lists
      are shown again and the buttons hidden.

   2. Nothing else. Escape and outside-click close are already in app.js. */

(function () {
  var MQ = window.matchMedia('(max-width: 767px)');
  var groups = document.querySelectorAll('.m-service-group, .mega-group');
  if (!groups.length) return;

  var CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function label(el) {
    var t = el.querySelector('.m-group-title, .mega-group-title');
    return (t ? t.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function enhance(group) {
    if (group.dataset.navAcc) return;
    var list = group.querySelector('ul');
    var title = group.querySelector('.m-group-title, .mega-group-title');
    if (!list || !title) return;

    if (!list.id) list.id = 'nav-svc-' + Math.random().toString(36).slice(2, 8);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-acc';
    btn.setAttribute('aria-controls', list.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Show ' + label(group));
    btn.innerHTML = CHEVRON;

    btn.addEventListener('click', function () {
      var open = group.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', (open ? 'Hide ' : 'Show ') + label(group));
    });

    group.appendChild(btn);
    group.dataset.navAcc = '1';
  }

  function sync() {
    var on = MQ.matches;
    groups.forEach(function (g) {
      if (!g.dataset.navAcc) return;
      g.classList.toggle('has-acc', on);
      if (!on) {
        g.classList.remove('is-open');
        var btn = g.querySelector('.nav-acc');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('aria-label', 'Show ' + label(g));
        }
      }
    });
  }

  groups.forEach(enhance);
  sync();

  if (MQ.addEventListener) MQ.addEventListener('change', sync);
  else if (MQ.addListener) MQ.addListener(sync);
})();
