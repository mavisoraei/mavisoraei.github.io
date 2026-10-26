# Responsive audit harness

Zero-dependency headless-Chrome audit for the local Lemon mirror. It measures
every built page at 360 / 390 / 768 / 1024 / 1440 px, writes a Markdown report
and full-page screenshots. **It never writes outside this folder and never
touches site files.**

## One command

```bash
node _tools/responsive-audit/audit.js
```

That is the whole thing. If nothing is listening on `http://localhost:8000`
the harness starts `node server.js` itself, audits the 13 built pages, then
stops the server it started. If the server is already running it is left alone.

Outputs:

| Path | Contents |
|---|---|
| `_tools/responsive-audit/report-YYYY-MM-DD.md` | Per-page / per-width tables, global top-offender selectors, methodology |
| `_tools/responsive-audit/shots/<page>-390.png` | Full-page screenshot at 390px |
| `_tools/responsive-audit/shots/<page>-1440.png` | Full-page screenshot at 1440px |
| `_tools/responsive-audit/last-run.json` | Raw measurements for every page × width |

## Options

```bash
node _tools/responsive-audit/audit.js --pages index,laser,facial
node _tools/responsive-audit/audit.js --pages index --widths 360,390,768
node _tools/responsive-audit/audit.js --pages laser --shot-widths 390
node _tools/responsive-audit/audit.js --no-server      # don't auto-start server.js
node _tools/responsive-audit/audit.js --help
```

| Flag | Default | Meaning |
|---|---|---|
| `--pages` | 13 built pages | Comma/space separated local page names (no URLs, no `.html` needed) |
| `--widths` | `360,390,768,1024,1440` | Viewport widths in px, height fixed at 900 |
| `--shot-widths` | `390,1440` | Widths that also get a PNG |
| `--out` | this folder | Report directory |
| `--shots` | `./shots` | Screenshot directory |
| `--json` | `./last-run.json` | Raw data output |
| `--no-server` | off | Fail instead of starting `server.js` |

The default page list is the 13 built pages:
`index, laser, facial, services, doctors, blog, areas, gallery, gallery_new,
prices, contact, ai-analysis, face-analysis`.

## What each page × width checks

1. **Horizontal overflow** — `documentElement.scrollWidth > innerWidth`; plus
   the top 10 elements whose right (or left) edge leaves the viewport, ranked by
   distance. Elements inside `overflow-x: auto|scroll` ancestors and carousels /
   sliders / marquees (by class) are ignored. Elements clipped by a local
   `overflow: hidden|clip` ancestor are marked `clipped` and ranked after real
   overflow. The global `body { overflow-x: clip }` band-aid is deliberately not
   treated as a local clip.
2. **Tap targets under 44×44** — links, buttons, inputs, selects, textareas,
   summaries and ARIA buttons, smallest area first, top 20. Inline links in
   running text are marked `inline` and ranked last (WCAG 2.5.8 exception).
3. **Body copy under 14px** — paragraphs, list items, table cells, captions,
   quotes and lead/copy blocks with their own text; header, footer, nav,
   breadcrumbs, uppercase eyebrows and chips are excluded; top 20.
4. **Fixed/sticky layers** covering more than 25% of the 900px viewport.
5. **Images** wider than their container's content box, missing `width`/`height`
   attributes, or broken.
6. **Long unbroken strings** (URLs, hashes) and tables that actually overflow;
   `contained` marks a scroll wrapper mitigating it.
7. **Viewport meta** — missing, `maximum-scale`, `user-scalable=no`.
8. **Computed `h1` size** and line-height at each width, to check fluid scaling.

## How it drives the browser

- Uses the installed Chrome/Edge over the DevTools Protocol via Node's built-in
  `WebSocket` (Node ≥ 22). No Puppeteer, no npm install, no `package.json`.
- Touch emulation is enabled below 1000px.
- The page-load intro is skipped with a real Escape key; scroll locks are
  cleared if the intro script failed.
- Each page is scrolled through step by step to trigger lazy images, then
  returned to the top. `prefers-reduced-motion: reduce` is emulated and
  scroll-driven reveal transforms are frozen at their end state, so layout is
  measured settled rather than mid-animation.
- Screenshots are full page, capped at 10,000px tall (`shot.clipped` in JSON
  when a page is taller).

## Requirements

- Node ≥ 22 (global `WebSocket`).
- Chrome, Edge or Chromium installed, or `CHROME_PATH` pointing at one.
- The site served at `http://localhost:8000` (`node server.js`). The audit
  refuses any other host.

## Limits

- The audit is observational: it reports, it does not fix.
- `body { overflow-x: clip }` means off-viewport elements often do not raise
  `scrollWidth`; both signals are reported so the clip cannot hide them.
- JS console errors are collected per run and shown per page, but they are not
  part of the pass/fail criteria.
