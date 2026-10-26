'use strict';

/* The in-page probe. This function is serialised with Function#toString and
   evaluated inside the page through Runtime.evaluate, so it must be completely
   self-contained: no imports, no references to module scope, no closures.

   Every check returns plain JSON-serialisable data. Lists are already ranked and
   capped (overflow 10, tap 20, type 20, one entry per image / string / sticky
   layer) so a result can travel back over CDP without special handling. */

function probe(config) {
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var doc = document;
  var docEl = doc.documentElement;
  var body = doc.body;

  var styleCache = new WeakMap();
  function cs(el) {
    var cached = styleCache.get(el);
    if (!cached) {
      cached = window.getComputedStyle(el);
      styleCache.set(el, cached);
    }
    return cached;
  }
  function round(n) {
    return Math.round(n * 10) / 10;
  }
  function text(el, max) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, max || 90);
  }
  function directText(el) {
    var out = '';
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3) out += ' ' + node.nodeValue;
    }
    return out.replace(/\s+/g, ' ').trim();
  }
  function escapeIdent(value) {
    return (window.CSS && window.CSS.escape)
      ? window.CSS.escape(value)
      : String(value).replace(/[^\w-]/g, '\\$&');
  }
  function uniqueId(el) {
    if (!el || !el.id) return '';
    try {
      return doc.querySelectorAll('#' + escapeIdent(el.id)).length === 1 ? '#' + escapeIdent(el.id) : '';
    } catch (err) {
      return '';
    }
  }
  function simpleSelector(el) {
    var id = uniqueId(el);
    if (id) return id;
    var piece = el.tagName.toLowerCase();
    var className = typeof el.className === 'string' ? el.className : '';
    var classes = className.trim().split(/\s+/).filter(Boolean).filter(function (name) {
      return !/^(is-|has-|js-|w-|swiper-|lenis)/.test(name);
    });
    // Longest names are usually the meaningful component class; utility
    // classes are short. Two is enough to disambiguate most nodes.
    classes.sort(function (a, b) { return b.length - a.length; });
    classes = classes.slice(0, 2);
    if (classes.length) piece += '.' + classes.map(escapeIdent).join('.');
    return piece;
  }
  function isUniqueSelector(selector) {
    try {
      return doc.querySelectorAll(selector).length === 1;
    } catch (err) {
      return false;
    }
  }
  // Compact, stable selector: the element itself, then ancestors only until it
  // resolves uniquely. nth-of-type is a last resort, not the default.
  function selectorFor(el) {
    var direct = uniqueId(el);
    if (direct) return direct;
    var parts = [simpleSelector(el)];
    var selector = parts[0];
    if (!isUniqueSelector(selector)) {
      var cur = el.parentElement;
      var depth = 0;
      while (cur && cur !== docEl && depth < 3) {
        parts.unshift(simpleSelector(cur));
        selector = parts.join(' > ');
        if (isUniqueSelector(selector)) break;
        cur = cur.parentElement;
        depth++;
      }
    }
    if (!isUniqueSelector(selector) && el.parentElement) {
      var sameTag = [];
      for (var i = 0; i < el.parentElement.children.length; i++) {
        if (el.parentElement.children[i].tagName === el.tagName) sameTag.push(el.parentElement.children[i]);
      }
      if (sameTag.length > 1) selector += ':nth-of-type(' + (sameTag.indexOf(el) + 1) + ')';
    }
    return selector;
  }
  function styleVisible(el, computed) {
    var s = computed || cs(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    if (el.closest('[hidden]')) return false;
    return true;
  }
  function box(el) {
    return el.getBoundingClientRect();
  }
  // Elements parked completely outside the viewport (closed drawers, mega
  // panels, off-canvas menus) are not layout offenders; they are intentional.
  function parkedOffCanvas(rect) {
    if (rect.width <= 0) return false;
    return rect.left >= vw - 1 || rect.right <= 1;
  }
  function intersectsViewportX(el) {
    var r = box(el);
    return r.right > 0 && r.left < vw;
  }
  var SCROLLER_CLASS = /(carousel|marquee|slider|scroller|swiper|ticker|scroll-snap|hscroll|h-scroll|scroll-row|scroll-strip|drag-row|drag-scroll|rail)/i;

  // Returns the nearest ancestor that is a deliberate horizontal scroller.
  // Anything inside one is exempt from "sticks out of the viewport" checks,
  // because that is the scroller's job.
  function intentionalScroller(el, computedFor) {
    var node = el.parentElement;
    var hops = 0;
    while (node && node !== docEl && node !== body && hops < 16) {
      var s = computedFor ? computedFor(node) : cs(node);
      var ox = s.overflowX;
      if (ox === 'auto' || ox === 'scroll') return node;
      var className = typeof node.className === 'string' ? node.className : '';
      if (SCROLLER_CLASS.test(className) && (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll')) return node;
      node = node.parentElement;
      hops++;
    }
    return null;
  }

  // Nearest non-body ancestor that locally clips the overflow. The global
  // `body { overflow-x: clip }` band-aid is deliberately ignored: if the body
  // is the only thing hiding an offender, it is still a real layout finding.
  function clippingAncestor(el, rect) {
    var node = el.parentElement;
    var hops = 0;
    while (node && node !== body && node !== docEl && hops < 12) {
      var s = cs(node);
      if (s.overflowX === 'hidden' || s.overflowX === 'clip') {
        var ar = node.getBoundingClientRect();
        if (rect.right > ar.right + 1 || rect.left < ar.left - 1) return node;
      }
      node = node.parentElement;
      hops++;
    }
    return null;
  }

  var all = body ? Array.prototype.slice.call(body.querySelectorAll('*')) : [];
  function styleFor(node) { return cs(node); }

  var result = {
    meta: {
      requestedWidth: config.width,
      innerWidth: vw,
      innerHeight: vh,
      visualWidth: window.visualViewport ? round(window.visualViewport.width) : null,
      dpr: window.devicePixelRatio,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      docScrollWidth: docEl.scrollWidth,
      docClientWidth: docEl.clientWidth,
      bodyScrollWidth: body ? body.scrollWidth : null,
      bodyOverflowX: body ? cs(body).overflowX : null,
      htmlOverflowX: cs(docEl).overflowX,
      scrollHeight: Math.max(docEl.scrollHeight, body ? body.scrollHeight : 0),
      h1Count: 0,
      h1: null
    },
    overflow: [],
    tap: [],
    tapInlineCount: 0,
    tapNonInlineTotal: 0,
    type: [],
    typeTotal: 0,
    layers: [],
    images: [],
    strings: [],
    viewport: null
  };

  /* ---------------------------------------------------------------- overflow
     Every visible element whose right edge (or left edge) leaves the viewport
     after intentional horizontal scrollers are excluded. Ranked by how far it
     sticks out, then by width. Capped at 10. */
  for (var oi = 0; oi < all.length; oi++) {
    var el = all[oi];
    if (!el.isConnected) continue;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'META' || tag === 'TEMPLATE' || tag === 'BR' || tag === 'NOSCRIPT') continue;
    var s = styleFor(el);
    if (!styleVisible(el, s)) continue;
    var r = box(el);
    if (r.width < 1 || r.height < 1) continue;
    if (parkedOffCanvas(r)) continue;
    if (intentionalScroller(el)) continue;
    var overRight = r.right - vw;
    var overLeft = -r.left;
    if (overRight <= 1 && overLeft <= 1) continue;
    var clipper = clippingAncestor(el, r);
    result.overflow.push({
      selector: selectorFor(el),
      tag: tag.toLowerCase(),
      width: round(r.width),
      right: round(r.right),
      left: round(r.left),
      over: round(Math.max(overRight, overLeft)),
      side: overRight > 1 && overLeft > 1 ? 'both' : (overRight > 1 ? 'right' : 'left'),
      fixed: s.position === 'fixed',
      clipped: Boolean(clipper),
      clippedBy: clipper ? selectorFor(clipper) : '',
      text: text(el, 70)
    });
  }
  // Unclipped offenders first (they are the ones that can create scroll),
  // locally clipped ones after, then by how far they stick out.
  result.overflow.sort(function (a, b) {
    if (a.clipped !== b.clipped) return a.clipped ? 1 : -1;
    return (b.over - a.over) || (b.width - a.width);
  });
  // Keep a longer tail internally so the report can show the real top 10 after
  // ranking, without the cap hiding unclipped items.
  result.overflow = result.overflow.slice(0, 10);

  /* -------------------------------------------------------------- tap targets
     links / buttons / inputs / selects / summaries under 44x44 CSS px.
     Inline links inside running text are measured but ranked last and counted
     separately, because the 44px rule has a documented inline-text exception. */
  var tapSelector = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], label[for]';
  var tapNodes = body ? body.querySelectorAll(tapSelector) : [];
  for (var ti = 0; ti < tapNodes.length; ti++) {
    var control = tapNodes[ti];
    if (control.disabled) continue;
    if (control.closest('[aria-hidden="true"]')) continue;
    var ts = styleFor(control);
    if (!styleVisible(control, ts)) continue;
    if (ts.pointerEvents === 'none') continue;
    if (!intersectsViewportX(control)) continue;
    var tr = box(control);
    if (tr.width < 1 || tr.height < 1) continue;
    var minSide = Math.min(tr.width, tr.height);
    if (minSide >= 43.5) continue;
    // Screen-reader-only helpers are 1x1 by design and are not tap targets.
    if (tr.width <= 2 || tr.height <= 2) continue;
    var controlClass = typeof control.className === 'string' ? control.className : '';
    if (/(visually-hidden|sr-only|screen-reader|a11y-hidden)/i.test(controlClass)) continue;

    var inlineText = false;
    if (control.tagName === 'A' && ts.display === 'inline') {
      var parentTag = control.parentElement ? control.parentElement.tagName : '';
      inlineText = /^(P|LI|H1|H2|H3|H4|H5|H6|SPAN|TD|TH|DD|DT|BLOCKQUOTE|FIGCAPTION|DIV|EM|STRONG|SMALL|B|I)$/.test(parentTag) && text(control, 40).length > 0;
    }
    if (inlineText) result.tapInlineCount++;
    else result.tapNonInlineTotal++;
    result.tap.push({
      selector: selectorFor(control),
      tag: control.tagName.toLowerCase(),
      width: round(tr.width),
      height: round(tr.height),
      area: Math.round(tr.width * tr.height),
      inline: inlineText,
      fixed: ts.position === 'fixed',
      label: (control.getAttribute('aria-label') || control.getAttribute('title') || text(control, 50) || control.getAttribute('name') || '').trim()
    });
  }
  result.tap.sort(function (a, b) {
    if (a.inline !== b.inline) return a.inline ? 1 : -1;
    return (a.area - b.area) || (a.height - b.height);
  });
  result.tap = result.tap.slice(0, 20);

  /* ------------------------------------------------------------- small type
     Body copy only: paragraphs, list items, table cells, captions, quotes and
     lead/copy blocks with their own text. Navigation, footer, breadcrumbs,
     uppercase labels/eyebrows and UI chips are excluded so the list points at
     reading text rather than chrome. */
  var typeSelector = 'p, li, td, th, dd, dt, figcaption, blockquote, .lead, [class*="body-copy"], [class*="copy"]';
  var typeNodes = body ? body.querySelectorAll(typeSelector) : [];
  var seenType = Object.create(null);
  for (var yi = 0; yi < typeNodes.length; yi++) {
    var copy = typeNodes[yi];
    if (copy.closest('header, footer, nav, .lm-header, .site-footer, [role="navigation"], [aria-hidden="true"]')) continue;
    if (copy.closest('[class*="eyebrow"], [class*="breadcrumb"], [class*="crumb"], [class*="badge"], [class*="chip"], [class*="pill"], [class*="meta"], [class*="label"]')) continue;
    var ownText = directText(copy);
    if (ownText.length < 12) continue;
    var ccs = styleFor(copy);
    if (!styleVisible(copy, ccs)) continue;
    if (ccs.textTransform === 'uppercase') continue;
    if (!intersectsViewportX(copy)) continue;
    var fontSize = parseFloat(ccs.fontSize);
    if (!(fontSize > 0) || fontSize >= 13.6) continue;
    var key = selectorFor(copy);
    if (seenType[key]) continue;
    seenType[key] = true;
    result.typeTotal++;
    result.type.push({
      selector: key,
      tag: copy.tagName.toLowerCase(),
      size: round(fontSize),
      lineHeight: ccs.lineHeight,
      text: ownText.slice(0, 90)
    });
  }
  result.type.sort(function (a, b) { return (a.size - b.size) || (b.text.length - a.text.length); });
  result.type = result.type.slice(0, 20);

  /* ------------------------------------------------- fixed / sticky layers
     Anything pinned to the viewport and taller than 25% of the viewport height.
     Closed drawers are parked off canvas and already skipped. */
  var seenLayer = Object.create(null);
  for (var li = 0; li < all.length; li++) {
    var layer = all[li];
    var ls = styleFor(layer);
    if (ls.position !== 'fixed' && ls.position !== 'sticky') continue;
    if (!styleVisible(layer, ls)) continue;
    var lr = box(layer);
    if (lr.height < 1 || lr.width < 1) continue;
    if (parkedOffCanvas(lr)) continue;
    var coverage = lr.height / vh;
    if (coverage <= 0.25) continue;
    var layerKey = selectorFor(layer);
    if (seenLayer[layerKey]) continue;
    seenLayer[layerKey] = true;
    result.layers.push({
      selector: layerKey,
      tag: layer.tagName.toLowerCase(),
      position: ls.position,
      height: round(lr.height),
      viewportHeight: vh,
      coverage: Math.round(coverage * 1000) / 10,
      top: round(lr.top),
      zIndex: ls.zIndex
    });
  }
  result.layers.sort(function (a, b) { return b.coverage - a.coverage; });

  /* ------------------------------------------------------------------ images
     Wider than their container's content box, and/or missing width/height
     attributes. Broken (0 natural width) images are also recorded. */
  var imgs = body ? body.querySelectorAll('img') : [];
  var seenImg = Object.create(null);
  for (var ii = 0; ii < imgs.length; ii++) {
    var img = imgs[ii];
    var is = styleFor(img);
    if (is.display === 'none' || is.visibility === 'hidden') continue;
    if (img.closest('[hidden]')) continue;
    var ir = box(img);
    var host = img.parentElement;
    var innerWidthPx = 0;
    var hostDepth = 0;
    while (host && hostDepth < 4) {
      var hs = styleFor(host);
      var candidateWidth = host.clientWidth
        - (parseFloat(hs.paddingLeft) || 0)
        - (parseFloat(hs.paddingRight) || 0);
      if (candidateWidth > 0) {
        innerWidthPx = candidateWidth;
        break;
      }
      host = host.parentElement;
      hostDepth++;
    }
    var wider = innerWidthPx > 0 && ir.width > innerWidthPx + 2;
    var missingAttrs = !img.hasAttribute('width') || !img.hasAttribute('height');
    var broken = img.complete && img.naturalWidth === 0;
    if (!wider && !missingAttrs && !broken) continue;
    var imgKey = selectorFor(img);
    if (seenImg[imgKey]) continue;
    seenImg[imgKey] = true;
    result.images.push({
      selector: imgKey,
      src: (img.currentSrc || img.getAttribute('src') || '').split('/').pop().slice(0, 80),
      width: round(ir.width),
      height: round(ir.height),
      containerWidth: round(innerWidthPx),
      wider: wider,
      missingAttrs: missingAttrs,
      broken: broken
    });
  }

  /* ----------------------------------------------------------- long strings
     Unbreakable tokens (URLs, hashes, long identifiers) whose element actually
     overflows, plus tables that are wider than their container. Elements inside
     a deliberate scroller are reported with contained: true instead of being
     dropped: a scrolling wrapper is a mitigation, not a fix for 900px tables. */
  var stringSelector = 'p, li, td, th, dd, dt, a, span, div, h1, h2, h3, h4, h5, code, pre, figcaption, table, .price, [class*="url"]';
  var stringNodes = body ? body.querySelectorAll(stringSelector) : [];
  var seenString = Object.create(null);
  for (var si = 0; si < stringNodes.length; si++) {
    var node = stringNodes[si];
    var ss = styleFor(node);
    if (!styleVisible(node, ss)) continue;
    if (ss.display === 'inline' || ss.display === 'contents') continue;
    if (node.tagName === 'TABLE') {
      var parentWidth = node.parentElement ? node.parentElement.clientWidth : 0;
      var tableWide = node.scrollWidth > node.clientWidth + 2 || (parentWidth > 0 && node.getBoundingClientRect().width > parentWidth + 2);
      if (!tableWide) continue;
      var tKey = selectorFor(node);
      if (seenString[tKey]) continue;
      seenString[tKey] = true;
      var wrapper = intentionalScroller(node);
      result.strings.push({
        selector: tKey,
        tag: 'table',
        kind: 'table',
        token: (node.querySelector('th, caption') ? text(node.querySelector('th, caption'), 60) : text(node, 60)),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        containerWidth: round(parentWidth),
        contained: Boolean(wrapper),
        container: wrapper ? selectorFor(wrapper) : ''
      });
      continue;
    }
    if (node.scrollWidth <= node.clientWidth + 2) continue;
    var own = directText(node);
    if (own.length < 8) continue;
    var tokens = own.match(/\S{22,}/g) || [];
    var hasNoSpaceBlob = tokens.length === 0 && !/\s/.test(own) && own.length > 24;
    if (!tokens.length && !hasNoSpaceBlob) continue;
    var wrapper2 = intentionalScroller(node);
    var sKey = selectorFor(node);
    if (seenString[sKey]) continue;
    seenString[sKey] = true;
    result.strings.push({
      selector: sKey,
      tag: node.tagName.toLowerCase(),
      kind: 'string',
      token: (tokens[0] || own).slice(0, 90),
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
      containerWidth: round(node.clientWidth),
      contained: Boolean(wrapper2),
      container: wrapper2 ? selectorFor(wrapper2) : ''
    });
  }

  /* ------------------------------------------------------------ viewport meta */
  var meta = doc.querySelector('meta[name="viewport" i]');
  var content = meta ? (meta.getAttribute('content') || '') : '';
  var problems = [];
  if (!meta || !content.trim()) {
    problems.push('missing');
  } else {
    var norm = content.replace(/\s+/g, '').toLowerCase();
    if (!/width=device-width/.test(norm)) problems.push('no width=device-width');
    var maxScale = norm.match(/maximum-scale=([0-9.]+)/);
    if (maxScale) problems.push('maximum-scale=' + maxScale[1]);
    if (/user-scalable=no|user-scalable=0/.test(norm)) problems.push('user-scalable=no');
    if (/user-scalable=yes/.test(norm)) problems.push('user-scalable=yes');
  }
  result.viewport = {
    content: content || null,
    problems: problems
  };

  /* --------------------------------------------------------------- headings */
  var h1s = doc.querySelectorAll('h1');
  result.meta.h1Count = h1s.length;
  for (var hi = 0; hi < h1s.length; hi++) {
    var h1 = h1s[hi];
    if (!styleVisible(h1)) continue;
    var h1sStyle = cs(h1);
    result.meta.h1 = {
      selector: selectorFor(h1),
      size: round(parseFloat(h1sStyle.fontSize)),
      lineHeight: h1sStyle.lineHeight,
      family: h1sStyle.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
      text: text(h1, 90)
    };
    break;
  }

  return result;
}

module.exports = { probe };
