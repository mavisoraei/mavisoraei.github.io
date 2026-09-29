# PROJECT_RULES.md — Lemon Clinic English Site

> **Read this file first at the start of any new session.** It is the single source of
> truth for project architecture, conventions and workflow. Do not re-derive context
> from scratch; do not "re-discover" the localisation work below — it is finished.

---

## 1. What this project is

A **fully static, hand-authored mirror of the `lemonclinic.org` Persian website, rebuilt in
clean English.** The original was a Webflow export that was later re-hosted on Astro
(leftover build artefacts still sit in `_astro/`).

There is **no build step, no bundler, no framework, no client-side router.** What is in the
repo is exactly what the browser gets. GitHub Pages serves the repo root as-is.

- **Workspace root:** `F:\Webflow\Lemon`
- **Local dev server:** `node server.js` → <http://localhost:8000/>
- **Content language:** English (`lang="en" dir="ltr"` on every page)

---

## 2. Architecture

### 2.1 Pages — 230 flat `.html` files at the repo root

There is no directory structure and no `index.html`-per-folder convention that matters for
routing. Every page is a sibling at the root, e.g.:

| Page | Role |
|---|---|
| `index.html` | Home / clinic landing |
| `services.html` | Full service + price list |
| `doctors.html` | Team, with medical licence numbers |
| `prices.html` | Tariff tables + FAQ |
| `contact.html` | Address, phone, WhatsApp, booking form |
| `gallery.html` | 63-case before/after gallery + lightbox |
| `blog.html` | Magazine index (~60 article teasers) |
| `areas.html` | District / Chitgar / West Tehran landing pages |
| `face-analysis.html` | AI face analysis + beauty score tool |
| `laser.html` | Candela laser hair removal landing |
| `facial.html` | Facials landing |
| `*.html` (~219 more) | Service, doctor and article landing pages |

The 11 pages above are the **"main pages"** and the ones to check after any global change.
The remaining ~219 are leaf landing pages.

> **Filename convention:** slugs are long and descriptive, mirroring the original article
> title, e.g. `what-is-morpheus-8-and-how-does-it-work-morpheus-8-is-a-skin-rejuvenat.html`.
> Do **not** rename files casually — ~4,000 internal links point at them by name.

### 2.2 `style.css` — one unified stylesheet

- Single file, **6,388 lines / ~141 KB**, linked from all 11 main pages.
- No preprocessor, no CSS framework, no per-page stylesheets.
- Classes are hand-authored and BEM-ish (`.nb-card`, `.bk-daycard`, `.nb-lb-img`, …).
- **A single user-visible string lives here**, injected via CSS `content`:
  `style.css` → `.bk-daycard[data-today] .bk-daycard-wd:after { content: " (today)"; }`
  If you touch that selector, keep the string English.

### 2.3 JavaScript — modular, one concern per file, all `defer`ed

| File | Size | Responsibility |
|---|---|---|
| `app.js` | ~18.6 KB | Shared behaviour for every page. Header scroll state, mobile drawer, bottom bar, card tilt, sun parallax, marquee drag, consult CTA, entry attribution, analytics wiring. One IIFE; every `init*()` checks for its own markup first and no-ops if absent. |
| `gallery.js` | ~4.1 KB | Gallery only: filter chips, deep-link hashes (`#doc=…`, `#g=…`), lightbox open/prev/next/close, keyboard nav. Reads the `#nb-data` JSON block. |
| `contact.js` | ~2.3 KB | Booking form only: validation + submit. Contains the phone-input digit normaliser. |
| `count.js` | ~8.9 KB | Vendored **GoatCounter** analytics. Third-party, do not edit. |
| `verify.js` | ~0.8 KB | **Stale dev helper.** It reads `lemoon.html`, which no longer exists at the root (it lives in `_archive/`). Do not rely on it; use the checks in §6. |
| `server.js` | ~4.0 KB | Local dev static server only. **Not a production backend** — do not deploy it or add secrets to it. |

**`app.js` has a non-obvious Persian exception — do not "clean" it.**
`contact.js` lines 9–10 contain the only Persian codepoints left in the entire codebase:

```js
return e.replace(/[۰-۹]/g, t => String(t.charCodeAt(0) - 1776))   // Persian  ۰-۹
        .replace(/[٠-٩]/g, t => String(t.charCodeAt(0) - 1632)); // Arabic-Ind ٠-٩
```

These are **character-class ranges that convert typed Eastern-Arabic digits to ASCII** in the
phone field. They are required code, not untranslated copy. Deleting them breaks phone input.

### 2.4 JSON-LD

Every main page carries 1–2 `<script type="application/ld+json">` blocks
(`MedicalClinic`, `WebSite`, `WebPage`, `MedicalProcedure`, `BreadcrumbList`,
`AggregateOffer`, `FAQPage`, …). All of them are now fully English. When editing them:

- Re-validate with `JSON.parse` — a malformed block silently kills the whole schema.
- Persian URL paths inside `url` / `@id` are **percent-encoded**, not translated
  (e.g. `https://lemonclinic.org/%D9%82%DB%8C%D9%85%D8%AA/`). Keep that convention: the
  URLs point at the real production site, and the rest of the page already uses
  percent-encoded Persian slugs in `canonical` / `hreflang`. Do **not** rewrite them to
  English slugs and do **not** touch the `sameAs` third-party profile URLs.

### 2.5 Gallery data contract (`gallery.html`)

`gallery.html` holds 63 `<figure class="nb-card">` elements in the body **and** a
`<script type="application/json" id="nb-data">` array used by `gallery.js`.

**Invariant:** `nb-data[i]` must correspond to the card at body index `i`
(`data-i` on the card's zoom button). Both are stored in the same non-obvious grouped
order (grouped by treatment, not alphabetical).

**Never hand-edit one side without the other.** The `nb-data` block was regenerated by
parsing the body cards, so it is guaranteed consistent — if you re-run any regeneration,
re-verify the 63/63 index alignment.

`nb-data` entry shape:

```json
{ "id": "nb-01", "t": "Lip Fillers", "url": "/lip-fillers-2.html",
  "dn": "Dr. Ghafouri", "dh": "/dr-shadi-ghafouri-dentist-founder-of-lemon-clinic.html" }
```

### 2.6 Assets

| Path | Contents |
|---|---|
| `images/` | 109 files: `services/`, `gallery/` (nb-01…nb-62), `doctors/`, `reviews/`, `ai/`, `consult/`, `filler/`, `persona/`, `logo/` (AVIF + WebP pairs) |
| `fonts/` | 2 files: `Vazirmatn-Regular.v2.woff2`, `Vazirmatn-Bold.v2.woff2` |
| `mascot/` | `full-v2/mascot.webp` |
| `_archive/` | 2 legacy Persian originals (`lemoon.html`, `lemoon_backup.html`, ~2.3 MB each). **Reference only — do not deploy, do not edit, do not link.** |
| `_astro/` | 3 orphaned Astro build artefacts. Dead weight, safe to delete. |

> **Known quirk — assets are still loaded from production.**
> Images and fonts in the markup are referenced as absolute
> `https://lemonclinic.org/images/...`, so a locally served page pulls pixels from the live
> domain. This was preserved deliberately during the English rebuild (it is what production
> does). If you want fully self-contained offline output, rewriting those to
> `/images/...` is the change — but it is a deliberate decision, not a bug fix.

### 2.7 Cache busting

All CSS/JS references carry an explicit version query string:

```html
<link rel="stylesheet" href="/style.css?v=1.0.0">
<script src="/app.js?v=1.0.0" defer>
```

Current version: **`1.0.1`** (24 references: `style.css` ×11, `app.js` ×11,
`gallery.js` ×1, `contact.js` ×1).

**Rule: whenever you change `style.css`, `app.js`, `gallery.js` or `contact.js`, bump the
version in all 24 references together** (e.g. `1.0.0` → `1.0.1`). Otherwise GitHub Pages
and browsers will keep serving the stale cached file. Fonts are already versioned by
filename (`Vazirmatn-*.v2.woff2`) and need no query string.

---

## 3. Localisation status: COMPLETE ✅

**The Persian → English refactor is finished. The project is 100% English. Do not
re-translate anything.**

What was done, for reference:

- All visible copy in the 11 main pages, plus all 219 leaf pages: English.
- All 16 JSON-LD blocks: English (`name`, `description`, `knowsAbout`, `paymentAccepted`,
  service catalog names, doctor credentials, every `FAQPage` question and answer).
- `gallery.html` `#nb-data`: English, regenerated from the body cards.
- Persian HTML comment in `contact.html`: English.
- CSS `content` string in `style.css`: `" (today)"`.
- The only remaining Persian codepoints in the repo are the **two intentional digit ranges
  in `contact.js`** documented in §2.3. That is correct — leave them.

Verification that proved it clean: 0 Persian codepoints across all 230 HTML files,
`style.css` and every root JS file; 18/18 JSON blocks parse; 4,663 local links resolve,
0 broken; all pages `lang="en" dir="ltr"`.

---

## 4. Deployment-critical: root-absolute paths

The markup contains **~4,033 root-absolute references** (`/contact.html`,
`/index.html`, `/style.css`, `/images/…`). Roughly 110 more are relative (`./contact.html`).

This means:

| Deploy target | Root-absolute `/x` resolves to | Works? |
|---|---|---|
| `https://<user>.github.io/` (user/org **site** repo, repo named `<user>.github.io`) | `https://<user>.github.io/x` | ✅ Yes |
| `https://<user>.github.io/<repo>/` (**project** repo) | `https://<user>.github.io/x` | ❌ **404 — everything breaks** |
| Custom domain at apex (e.g. `example.com/`) | `https://example.com/x` | ✅ Yes |

**Therefore: GitHub Pages must be a user/organisation site repo, or a custom domain at the
root.** If the repo is a normal project repo, the site will deploy "successfully" and render
completely unstyled and full of 404s. Verify after every first deploy.

---

## 5. Workflow

```
  1. ITERATE LOCALLY
       node server.js                # http://localhost:8000, reads files from disk, no-store
       # edit, hard-refresh (Ctrl+Shift+R) to bypass cache
       # run the checks in §6

  2. REVIEW VIA A TEMPORARY TUNNEL   (only when a second pair of eyes is needed)
       npx cloudflared tunnel --url http://localhost:8000
       # quick tunnels are ephemeral; prefer Cloudflare over localtunnel
       # (localtunnel asks for a tunnel-password interstitial and can hang)
       # kill the tunnel when done — it publishes the site to the open internet

  3. PUSH TO GITHUB PAGES WHEN READY
       # see §4 first — user/org site repo or apex domain only
       # see §7 for the push checklist
```

**Tunnels are for review only, never for production.** A quick tunnel exposes the whole
local site publicly. Stop it when the review is over.

---

## 6. Pre-flight checks (run before every commit)

There is no test suite and no linter in this project. Use these checks instead:

1. **No Persian regressions** — scan all `*.html`, `style.css` and root `*.js` for
   `[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]`. Expected result: only the two digit ranges in
   `contact.js`.
2. **JSON validity** — `JSON.parse` every `application/ld+json` and
   `application/json` block. Expected: 18 blocks, 0 errors.
3. **No broken local links** — resolve every relative `href`/`src` against the repo root,
   stripping `?query` and `#hash`. Expected: 0 missing targets.
4. **Cache-version consistency** — every `style.css` / `app.js` / `gallery.js` /
   `contact.js` reference carries the *same* `?v=` value.
5. **Gallery alignment** — `nb-data` length 63, `nb-data[i].id` matches card `i`.id for all 63.
6. **`lang`/`dir`** — every page is `lang="en" dir="ltr"`.
7. **Bump the cache version** if you touched CSS or JS (§2.7).

---

## 7. Git & GitHub Pages notes

- The workspace was **not** a git repository until it was initialised for the Pages
  deployment. Keep it that way going forward — commit after each verified change.
- **Do not commit `_archive/`** (4.6 MB of Persian originals) or `_astro/` (dead artefacts).
  Add them to `.gitignore` so they never reach the public repo.
- `server.js` is a local dev tool. It is harmless to commit, but it is not a backend and
  must not be treated as one.
- Confirm the deployment mode is correct after the first push (§4).

---

## 8. Conventions for future work

- **Do not** introduce a build step, framework, bundler or CSS preprocessor. The
  no-build, plain-DOM, one-stylesheet approach is the point.
- **Do not** inline `<style>` or `<script>` back into pages. That regression is exactly what
  `app.js` was created to undo.
- **Do not** rename files or directories without updating every inbound link.
- **Do not** add Persian copy back. If a Persian term is unavoidable (a proper noun in a
  third-party URL, the `contact.js` digit ranges), leave it and note it here.
- Every new `init*()` in `app.js` must guard on its own markup and be a no-op elsewhere.
- Keep new pages flat at the repo root, named as a long descriptive slug, with
  `lang="en" dir="ltr"`, the `?v=` cache params, and valid English JSON-LD.

---

*Last updated: Zen Linen theme with terracotta accent live on Pages, cache busting at `v1.0.1`.*

---

## 9. Theme: Zen Linen (active since `v1.0.1`)

The palette in `style.css` `:root` is **Zen Linen**. The accent is terracotta
`#F26A4B`. If you are retheming again, edit the tokens, not the call sites —
step 3 of the migration removed every old hard-coded colour.

Token groups in `:root`:

| Group | Tokens |
|---|---|
| Warm linen neutrals | `--cream` `--cream-soft` `--surface` `--line` `--ink` `--ink-soft` `--espresso` `--scrub` `--on-accent` |
| Terracotta accent | `--gold` `--gold-deep` `--gold-btn` `--gold-btn-deep` `--gold-champagne` |
| Soft clay wash | `--matcha` `--sage` `--sage-deep` `--sage-light` `--wood` |
| Status | `--danger` `--danger-deep` `--danger-soft` `--ok` `--warn` |
| Terracotta depth scale | `--clay-300` … `--clay-900` |

Notes that will save you time next time:

- **The token names are historical, not descriptive.** `--gold` is terracotta,
  `--sage`/`--matcha` are clay pinks, `--wood` is a linen tan. Do not "fix" the
  names — ~1,050 `var()` call sites in `style.css` depend on them.
- `--clay-300`…`--clay-900` exist only for the dark bands (footer, bottom bar,
  `.svc-cta`). There are no light counterparts; use the neutral group above.
- **The 219 leaf pages do not load `style.css`.** They are standalone documents
  with their own inline `<style>` containing a local `:root` with the Zen Linen
  tokens. They are byte-identical to each other. If you change the palette,
  change that block in all 219 files too, or the two halves of the site drift.
- `theme-color` on the 11 main pages is a literal `#F4EFE7`, not a `var()`.
  A `<meta>` attribute cannot resolve a custom property — update it by hand.
- Shadows and translucent overlays use `color-mix(in srgb, var(--x) N%, transparent)`
  rather than 8-digit hex. That is why there are no `#RRGGBBAA` literals left
  except pure white/black insets on dark surfaces, which are intentional.
