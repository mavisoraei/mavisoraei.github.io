'use strict';

const path = require('path');

const CATEGORY_LABEL = {
  overflow: 'overflow',
  tap: 'tap target',
  type: 'small copy',
  layer: 'pinned layer',
  image: 'image',
  string: 'long string'
};

function pad(n) { return String(n).padStart(2, '0'); }

function dateStamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// Markdown table cell: escape pipes and flatten newlines.
function cell(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function code(value) {
  return '`' + String(value === null || value === undefined ? '' : value)
    .replace(/`/g, '\\`')
    .replace(/\|/g, '\\|') + '`';
}

function table(headers, rows) {
  const head = '| ' + headers.map(cell).join(' | ') + ' |';
  const rule = '|' + headers.map(() => '---').join('|') + '|';
  const body = rows.map((row) => '| ' + row.map(cell).join(' | ') + ' |');
  return [head, rule, ...body].join('\n');
}

function safe(value) {
  return value === null || value === undefined ? '' : String(value);
}

function shotLink(run, options, entry) {
  if (!entry.shot) return '';
  const rel = path.relative(options.outDir, entry.shot.file).replace(/\\/g, '/');
  return '[' + path.basename(entry.shot.file) + '](' + rel + ')';
}

function aggregate(runs) {
  const map = new Map();

  function get(selector) {
    let entry = map.get(selector);
    if (!entry) {
      entry = {
        selector,
        hits: 0,
        pages: new Set(),
        widths: new Set(),
        runs: new Set(),
        cats: new Map(),
        maxOverflow: 0,
        minTap: null,
        minType: null,
        maxLayer: 0,
        imageReasons: new Set(),
        stringsContained: 0,
        stringsTotal: 0,
        sample: ''
      };
      map.set(selector, entry);
    }
    return entry;
  }

  function touch(run, item) {
    const entry = get(item.selector);
    entry.hits++;
    entry.pages.add(run.page);
    entry.widths.add(run.width);
    entry.runs.add(run.page + '@' + run.width);
    if (!entry.sample && item.text) entry.sample = item.text;
  }

  for (const run of runs) {
    if (run.status !== 'ok' || !run.probe) continue;
    const p = run.probe;

    for (const item of p.overflow) {
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('overflow', (entry.cats.get('overflow') || 0) + 1);
      if (item.over > entry.maxOverflow) entry.maxOverflow = item.over;
    }

    for (const item of p.tap) {
      // Inline links inside running text are exempt from WCAG 2.5.8 and would
      // drown the shared-CSS signal; they stay in the per-page detail only.
      if (item.inline) continue;
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('tap', (entry.cats.get('tap') || 0) + 1);
      const worstSide = Math.max(item.width, item.height);
      if (entry.minTap === null || worstSide < entry.minTap) entry.minTap = worstSide;
    }

    for (const item of p.type) {
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('type', (entry.cats.get('type') || 0) + 1);
      if (entry.minType === null || item.size < entry.minType) entry.minType = item.size;
    }

    for (const item of p.layers) {
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('layer', (entry.cats.get('layer') || 0) + 1);
      if (item.coverage > entry.maxLayer) entry.maxLayer = item.coverage;
    }

    for (const item of p.images) {
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('image', (entry.cats.get('image') || 0) + 1);
      if (item.wider) entry.imageReasons.add('wider than container');
      if (item.missingAttrs) entry.imageReasons.add('no width/height');
      if (item.broken) entry.imageReasons.add('broken');
    }

    for (const item of p.strings) {
      const entry = get(item.selector);
      touch(run, item);
      entry.cats.set('string', (entry.cats.get('string') || 0) + 1);
      entry.stringsTotal++;
      if (item.contained) entry.stringsContained++;
    }
  }

  return Array.from(map.values());
}

function worstLabel(entry) {
  const parts = [];
  if (entry.cats.has('overflow')) parts.push('+' + Math.round(entry.maxOverflow) + 'px out');
  if (entry.cats.has('tap')) parts.push(Math.round(entry.minTap) + 'px side');
  if (entry.cats.has('type')) parts.push(entry.minType + 'px');
  if (entry.cats.has('layer')) parts.push(entry.maxLayer + '% of vh');
  if (entry.cats.has('image')) parts.push(Array.from(entry.imageReasons).join(', '));
  if (entry.cats.has('string')) {
    parts.push(entry.stringsContained === entry.stringsTotal && entry.stringsTotal > 0
      ? 'scrolls inside wrapper'
      : 'overflows');
  }
  return parts.join(' · ');
}

function rank(entries) {
  return entries.slice().sort((a, b) => {
    if (b.pages.size !== a.pages.size) return b.pages.size - a.pages.size;
    if (b.runs.size !== a.runs.size) return b.runs.size - a.runs.size;
    return b.hits - a.hits;
  });
}

function selectorTable(entries, limit) {
  const rows = rank(entries).slice(0, limit).map((entry, i) => [
    i + 1,
    code(entry.selector),
    entry.pages.size,
    entry.runs.size,
    Array.from(entry.widths).sort((a, b) => a - b).join(', '),
    worstLabel(entry)
  ]);
  return table(['#', 'Selector', 'Pages', 'Runs', 'Widths', 'Worst'], rows);
}

function renderReport(run, options) {
  const stamp = dateStamp(run.startedAt);
  const reportPath = path.join(options.outDir, 'report-' + stamp + '.md');
  const okRuns = run.runs.filter((r) => r.status === 'ok');
  const failed = run.runs.filter((r) => r.status !== 'ok');
  const all = aggregate(run.runs);

  const overflowEntries = all.filter((e) => e.cats.has('overflow'));
  const unclippedOverflowRuns = okRuns.filter((r) => r.probe.overflow.some((item) => !item.clipped));
  const pagesWithDocScroll = new Set(
    okRuns.filter((r) => r.probe.meta.docScrollWidth > r.probe.meta.innerWidth + 1).map((r) => r.page)
  );
  const pagesWithOffViewport = new Set(unclippedOverflowRuns.map((r) => r.page));

  const tapCount = okRuns.reduce((sum, r) => sum + r.probe.tap.filter((t) => !t.inline).length, 0);
  const inlineTapCount = okRuns.reduce((sum, r) => sum + r.probe.tapInlineCount, 0);
  const typeCount = okRuns.reduce((sum, r) => sum + r.probe.type.length, 0);
  const layerCount = okRuns.reduce((sum, r) => sum + r.probe.layers.length, 0);
  const imageCount = okRuns.reduce((sum, r) => sum + r.probe.images.length, 0);
  const stringCount = okRuns.reduce((sum, r) => sum + r.probe.strings.length, 0);

  const overall = rank(all.filter((entry) => entry.pages.size >= 1)).slice(0, 10);

  const summary = {
    okRuns: okRuns.length,
    pagesWithOverflow: pagesWithDocScroll.size,
    pagesWithOffViewport: pagesWithOffViewport.size,
    overflowElements: okRuns.reduce((sum, r) => sum + r.probe.overflow.length, 0),
    tapTargets: tapCount,
    inlineTapTargets: inlineTapCount,
    smallText: typeCount,
    layers: layerCount,
    images: imageCount,
    longStrings: stringCount,
    topOffenders: overall.map((entry) => ({
      selector: entry.selector,
      pages: entry.pages.size,
      hits: entry.hits,
      categories: Array.from(entry.cats.keys()).map((key) => CATEGORY_LABEL[key] || key)
    }))
  };

  const lines = [];
  lines.push('# Responsive audit — Lemon local mirror');
  lines.push('');
  lines.push('- **Generated:** ' + new Date(run.startedAt).toLocaleString() + '  ');
  lines.push('- **Target:** ' + run.base + ' (localhost only)  ');
  lines.push('- **Browser:** ' + run.chrome + '  ');
  lines.push('- **Pages:** ' + run.pages.length + ' · **Widths:** ' + run.widths.join(', ') + 'px · **Height:** 900px · **Touch:** widths < 1000px  ');
  lines.push('- **Runs:** ' + okRuns.length + '/' + run.runs.length + ' completed  ');
  lines.push('- **Screenshots:** `' + path.relative(path.resolve(__dirname, '..', '..'), options.shotsDir).replace(/\\/g, '/') + '/` (390px and 1440px, full page)');
  lines.push('');
  lines.push('No site files were modified. The harness lives in `_tools/responsive-audit/`; raw numbers are in `' + path.basename(options.json) + '`.');
  lines.push('');

  lines.push('## What was measured');
  lines.push('');
  lines.push('For every page at every width the audit injects a probe after the page has settled (intro skipped, lazy content scrolled through, scroll-driven reveal animations frozen at their final state, `prefers-reduced-motion: reduce` emulated so screenshots are deterministic):');
  lines.push('');
  lines.push('1. `document.documentElement.scrollWidth > innerWidth`, plus every visible element whose right (or left) edge leaves the viewport, ranked by how far it sticks out. Elements inside an `overflow-x: auto/scroll` ancestor or a carousel/slider/marquee class are ignored. Elements clipped by a **local** `overflow: hidden/clip` ancestor are kept but marked `clipped` and ranked after unclipped ones.');
  lines.push('2. Links, buttons, inputs, selects, textareas, summaries and ARIA buttons under 44×44 CSS px, smallest first. Inline links inside running text are marked `inline` and ranked last (WCAG 2.5.8 inline exception).');
  lines.push('3. Body copy under 14px computed: paragraphs, list items, table cells, captions, quotes and lead/copy blocks with their own text. Header, footer, nav, breadcrumbs, uppercase eyebrows and UI chips are excluded.');
  lines.push('4. `position: fixed` or `sticky` elements taller than 25% of the 900px viewport.');
  lines.push('5. Images wider than their container content box, missing `width`/`height` attributes, or broken.');
  lines.push('6. Long unbroken tokens (URLs, hashes) and tables whose content actually overflows; `contained` means a scroll wrapper mitigates it.');
  lines.push('7. The viewport meta tag (missing, `maximum-scale`, `user-scalable=no`).');
  lines.push('8. The computed `h1` font-size and line-height at every width.');
  lines.push('');
  lines.push('> Note on `overflow`: `body { overflow-x: clip }` hides off-viewport children from `scrollWidth` on this site. The **Doc overflow** column therefore reports real document scroll; the **Off-viewport** column reports elements that leave the viewport even when the body clip hides them.');
  lines.push('');

  lines.push('## Global summary');
  lines.push('');
  lines.push(table(['Metric', 'Result'], [
    ['Pages × widths run', okRuns.length + ' / ' + run.runs.length],
    ['Pages with document horizontal scroll', pagesWithDocScroll.size + ' / ' + run.pages.length],
    ['Pages with off-viewport elements (unclipped)', pagesWithOffViewport.size + ' / ' + run.pages.length],
    ['Off-viewport elements captured', summary.overflowElements],
    ['Tap targets under 44×44 (excluding inline text links)', tapCount],
    ['Inline text links under 44×44 (informational)', inlineTapCount],
    ['Body-copy nodes under 14px', typeCount],
    ['Fixed/sticky layers over 25% of viewport height', layerCount],
    ['Image issues (wider / no dimensions / broken)', imageCount],
    ['Long unbroken strings / wide tables', stringCount]
  ]));
  lines.push('');

  if (failed.length) {
    lines.push('### Failed runs');
    lines.push('');
    lines.push(table(['Page', 'Width', 'Error'], failed.map((r) => [r.page, r.width, r.error])));
    lines.push('');
  }

  lines.push('## Top 10 offender selectors (all built pages)');
  lines.push('');
  lines.push('Ranked by number of pages affected, then number of page×width runs, then total hits. This is the list to target for shared-CSS fixes.');
  lines.push('');
  lines.push(table(
    ['#', 'Selector', 'Pages', 'Runs', 'Hits', 'Categories', 'Worst'],
    overall.map((entry, i) => [
      i + 1,
      code(entry.selector),
      entry.pages.size,
      entry.runs.size,
      entry.hits,
      Array.from(entry.cats.keys()).map((key) => CATEGORY_LABEL[key] || key).join(', '),
      worstLabel(entry)
    ])
  ));
  lines.push('');

  lines.push('### Offenders by category');
  lines.push('');

  if (overflowEntries.length) {
    lines.push('**Horizontal overflow**');
    lines.push('');
    lines.push(selectorTable(overflowEntries, 15));
    lines.push('');
  } else {
    lines.push('**Horizontal overflow** — none. ');
    lines.push('');
  }

  const tapEntries = all.filter((e) => e.cats.has('tap'));
  if (tapEntries.length) {
    lines.push('**Tap targets under 44×44**');
    lines.push('');
    lines.push(selectorTable(tapEntries, 20));
    lines.push('');
  }

  const typeEntries = all.filter((e) => e.cats.has('type'));
  if (typeEntries.length) {
    lines.push('**Body copy under 14px**');
    lines.push('');
    lines.push(selectorTable(typeEntries, 20));
    lines.push('');
  }

  const layerEntries = all.filter((e) => e.cats.has('layer'));
  if (layerEntries.length) {
    lines.push('**Fixed/sticky layers over 25% of viewport height**');
    lines.push('');
    lines.push(selectorTable(layerEntries, 15));
    lines.push('');
  }

  const imageEntries = all.filter((e) => e.cats.has('image'));
  if (imageEntries.length) {
    lines.push('**Images**');
    lines.push('');
    lines.push(selectorTable(imageEntries, 15));
    lines.push('');
  }

  const stringEntries = all.filter((e) => e.cats.has('string'));
  if (stringEntries.length) {
    lines.push('**Long strings and wide tables**');
    lines.push('');
    lines.push(selectorTable(stringEntries, 15));
    lines.push('');
  }

  lines.push('## H1 size by width');
  lines.push('');
  lines.push('Computed `font-size` / `line-height` of the first visible `h1` on each page. A flat row means no fluid scaling.');
  lines.push('');
  const h1Rows = run.pages.map((page) => {
    const row = [page + '.html'];
    for (const width of run.widths) {
      const entry = run.runs.find((r) => r.page === page && r.width === width);
      if (!entry || entry.status !== 'ok' || !entry.probe.meta.h1) {
        row.push(entry && entry.status !== 'ok' ? 'error' : '—');
      } else {
        row.push(entry.probe.meta.h1.size + 'px / ' + safe(entry.probe.meta.h1.lineHeight));
      }
    }
    return row;
  });
  lines.push(table(['Page'].concat(run.widths.map((w) => w + 'px')), h1Rows));
  lines.push('');

  lines.push('## Per-page results');
  lines.push('');

  for (const page of run.pages) {
    const pageRuns = run.runs.filter((r) => r.page === page);
    const firstOk = pageRuns.find((r) => r.status === 'ok');
    const pageShots = pageRuns.filter((r) => r.shot);

    lines.push('### ' + page + '.html');
    lines.push('');
    if (firstOk) {
      const viewport = firstOk.probe.viewport;
      lines.push('- URL: ' + firstOk.url + '  ');
      lines.push('- Title: ' + (firstOk.title || '—') + '  ');
      lines.push('- Viewport meta: ' + (viewport.content ? code(viewport.content) : '**missing**') +
        (viewport.problems.length ? ' — **' + viewport.problems.join(', ') + '**' : ' — OK'));
      if (pageShots.length) {
        lines.push('- Screenshots: ' + pageShots.map((r) => shotLink(run, options, r)).join(' · '));
      }
      lines.push('');
    } else {
      lines.push('**No successful run for this page.**');
      lines.push('');
    }

    lines.push(table(
      ['Width', 'Doc overflow', 'Off-viewport', 'Tap <44', 'Copy <14px', 'Pinned >25%', 'Images', 'Strings', 'H1', 'JS errors'],
      pageRuns.map((entry) => {
        if (entry.status !== 'ok') return [entry.width + 'px', 'ERROR', '—', '—', '—', '—', '—', '—', '—', '—'];
        const p = entry.probe;
        const diff = p.meta.docScrollWidth - p.meta.innerWidth;
        return [
          entry.width + 'px',
          diff > 1 ? '**+' + diff + 'px**' : 'OK',
          p.overflow.length,
          p.tap.length + (p.tapInlineCount ? ' (+' + p.tapInlineCount + ' inline)' : ''),
          p.type.length,
          p.layers.length,
          p.images.length,
          p.strings.length,
          p.meta.h1 ? p.meta.h1.size + 'px' : '—',
          entry.errors.length || 0
        ];
      })
    ));
    lines.push('');

    for (const entry of pageRuns) {
      if (entry.status !== 'ok') {
        lines.push('#### ' + page + ' @ ' + entry.width + 'px — failed');
        lines.push('');
        lines.push('`' + entry.error + '`');
        lines.push('');
        continue;
      }
      const p = entry.probe;
      const hasDetails = p.overflow.length || p.tap.length || p.type.length || p.layers.length || p.images.length || p.strings.length;
      if (!hasDetails) continue;

      lines.push('#### ' + page + ' @ ' + entry.width + 'px');
      lines.push('');

      if (p.overflow.length) {
        lines.push('**Horizontal overflow** — document `scrollWidth` ' + p.meta.docScrollWidth + ' vs `innerWidth` ' + p.meta.innerWidth + '.');
        lines.push('');
        lines.push(table(
          ['#', 'Selector', 'Width', 'Right', 'Over', 'Side', 'Clipped', 'Text'],
          p.overflow.map((item, i) => [
            i + 1,
            code(item.selector),
            item.width + 'px',
            item.right + 'px',
            (item.over > 0 ? '+' : '') + item.over + 'px',
            item.side,
            item.clipped ? 'local clip' : (item.fixed ? 'fixed' : 'no'),
            item.text ? code(item.text) : ''
          ])
        ));
        lines.push('');
      }

      if (p.tap.length) {
        lines.push('**Tap targets under 44×44** (`inline` = running-text link, WCAG exception)' + (p.tapInlineCount ? ' — ' + p.tapInlineCount + ' inline links counted separately' : '') + '.');
        lines.push('');
        lines.push(table(
          ['#', 'Selector', 'Size', 'Type', 'Inline', 'Label'],
          p.tap.map((item, i) => [
            i + 1,
            code(item.selector),
            item.width + '×' + item.height + 'px',
            item.tag,
            item.inline ? 'yes' : 'no',
            item.label ? code(item.label) : ''
          ])
        ));
        lines.push('');
      }

      if (p.type.length) {
        lines.push('**Body copy under 14px**');
        lines.push('');
        lines.push(table(
          ['#', 'Selector', 'Size', 'Line-height', 'Text'],
          p.type.map((item, i) => [
            i + 1,
            code(item.selector),
            item.size + 'px',
            item.lineHeight,
            code(item.text)
          ])
        ));
        lines.push('');
      }

      if (p.layers.length) {
        lines.push('**Fixed/sticky layers over 25% of viewport height**');
        lines.push('');
        lines.push(table(
          ['Selector', 'Position', 'Height', 'Coverage', 'Top', 'z-index'],
          p.layers.map((item) => [
            code(item.selector),
            item.position,
            item.height + 'px',
            item.coverage + '%',
            item.top + 'px',
            item.zIndex
          ])
        ));
        lines.push('');
      }

      if (p.images.length) {
        lines.push('**Images**');
        lines.push('');
        lines.push(table(
          ['Selector', 'File', 'Rendered', 'Container', 'Flags'],
          p.images.map((item) => [
            code(item.selector),
            code(item.src || '—'),
            item.width + '×' + item.height + 'px',
            item.containerWidth ? item.containerWidth + 'px' : '—',
            [
              item.wider ? 'wider than container' : '',
              item.missingAttrs ? 'no width/height attrs' : '',
              item.broken ? 'broken' : ''
            ].filter(Boolean).join(', ')
          ])
        ));
        lines.push('');
      }

      if (p.strings.length) {
        lines.push('**Long unbroken strings / wide tables**');
        lines.push('');
        lines.push(table(
          ['Selector', 'Kind', 'Token or caption', 'Scroll / client', 'Contained'],
          p.strings.map((item) => [
            code(item.selector),
            item.kind,
            code(item.token),
            item.scrollWidth + ' / ' + item.clientWidth + 'px',
            item.contained ? 'inside ' + code(item.container) : 'no'
          ])
        ));
        lines.push('');
      }

      if (entry.errors.length) {
        lines.push('**Console errors**');
        lines.push('');
        entry.errors.forEach((message) => lines.push('- ' + code(message)));
        lines.push('');
      }
    }
  }

  lines.push('## Method notes and limits');
  lines.push('');
  lines.push('- Touch emulation is on below 1000px (`Emulation.setTouchEmulationEnabled`), with a device metrics override at each width and height 900.');
  lines.push('- The page-load intro is skipped with a real Escape key, exactly like a visitor; if the intro script never arrived the harness removes the scroll lock itself.');
  lines.push('- Full-page screenshots are capped at ' + 10000 + 'px tall; taller pages are marked as clipped in the raw JSON (`shot.clipped`).');
  lines.push('- `body { overflow-x: clip }` means elements can leave the viewport without raising `scrollWidth`. Both signals are reported separately, and `clipped` marks elements hidden by a local clipping ancestor.');
  lines.push('- Fixed/sticky coverage is measured at scroll position 0 against the 900px viewport.');
  lines.push('- Font sizes are computed values at the audit viewport, not authored values; fluid `clamp()`/`vw` sizing is reflected as measured.');
  lines.push('- This harness only reads the rendered page. It does not modify, build or deploy anything.');
  lines.push('');

  return { markdown: lines.join('\n'), reportPath, summary };
}

module.exports = { renderReport };
