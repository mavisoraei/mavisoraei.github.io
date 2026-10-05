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

- Single file, **8,418 lines / ~181 KB**, linked from all 11 main pages. The `v1.0.3`
  homepage block (§10) is appended after everything else, starting around line 7436.
- No preprocessor, no CSS framework, no per-page stylesheets.
- Classes are hand-authored and BEM-ish (`.nb-card`, `.bk-daycard`, `.nb-lb-img`, …).
- **A single user-visible string lives here**, injected via CSS `content`:
  `style.css` → `.bk-daycard[data-today] .bk-daycard-wd:after { content: " (today)"; }`
  If you touch that selector, keep the string English.

### 2.3 JavaScript — modular, one concern per file, all `defer`ed

| File | Size | Responsibility |
|---|---|---|
| `app.js` | ~33.1 KB | Shared behaviour for every page. Header scroll state, mobile drawer, bottom bar, card tilt, sun parallax, marquee drag, consult CTA, entry attribution, analytics wiring, **homepage video modal (`v1.0.3`)**, **homepage mesh-gradient shader (`v1.0.8`, §16)**. One IIFE; every `init*()` checks for its own markup first and no-ops if absent. |
| `gallery.js` | ~4.1 KB | Gallery only: filter chips, deep-link hashes (`#doc=…`, `#g=…`), lightbox open/prev/next/close, keyboard nav. Reads the `#nb-data` JSON block. |
| `contact.js` | ~2.3 KB | Booking form only: validation + submit. Contains the phone-input digit normaliser. |
| `count.js` | ~8.9 KB | Vendored **GoatCounter** analytics. Third-party, do not edit. |
| `verify.js` | ~0.8 KB | **Stale dev helper.** It reads `lemoon.html`, which no longer exists at the root (it lives in `_archive/`). Do not rely on it; use the checks in §6. |
| `server.js` | ~4.2 KB | Local dev static server only. **Not a production backend** — do not deploy it or add secrets to it. Its `MIME` map gained `.webm`/`.mp4` in `v1.0.3` so the hero video streams instead of downloading. |

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
| `assets/` | **Local-only, added in `v1.0.3`** (see §10). `videos/hero-model.webm` (877 KB, re-cropped to 1434×990 in `v1.0.5`) and `icons/` (`logo.svg`, `instagram.svg`, `Arrow 1.svg`, `Polygon 1.svg`). Referenced root-absolute as `/assets/…`, **not** from the production domain. Also holds `design-frame.jpg` (784 KB), which nothing references — a design reference, safe to drop before deploy. |
| `pic/` | Byte-identical staging copy of the 7 files in `assets/` (verified by hash). **Source folder, not deploy output.** Nothing references it. Gitignore it. |
| `_archive/` | 2 legacy Persian originals (`lemoon.html`, `lemoon_backup.html`, ~2.3 MB each). **Reference only — do not deploy, do not edit, do not link.** |
| `_astro/` | 3 orphaned Astro build artefacts. Dead weight, safe to delete. |

> **Known quirk — most assets are still loaded from production.**
> Images and fonts in the markup are referenced as absolute
> `https://lemonclinic.org/images/...`, so a locally served page pulls pixels from the live
> domain. This was preserved deliberately during the English rebuild (it is what production
> does). If you want fully self-contained offline output, rewriting those to
> `/images/...` is the change — but it is a deliberate decision, not a bug fix.
>
> **Exception as of `v1.0.3`:** the homepage nav icons and the clinic film come from the
> repo (`/assets/…`), not from `lemonclinic.org`. They are new files with no production
> equivalent, so there was nothing to hotlink. That makes them the only assets that must
> committed or they will 404 in production.
>
> **`v1.0.7` / `v1.0.8` note:** `videos/hero-model.webm` is no longer the hero *background* —
> it was a Spline scene in `v1.0.7` (§13, since retired) and in `v1.0.8` the hero centre was
> removed entirely in favour of a background mesh gradient (§16). The file is still required:
> `.lm-play-card`'s modal streams it from `data-lm-video`. Only its role changed, not its
> status as a must-commit asset.

### 2.7 Cache busting

All CSS/JS references carry an explicit version query string:

```html
<link rel="stylesheet" href="/style.css?v=1.0.0">
<script src="/app.js?v=1.0.0" defer>
```

Current versions: **`style.css` = `1.0.8`**, **`app.js` = `1.0.6`**, **`gallery.js` /
`contact.js` = `1.0.5`** (24 references: `style.css` ×11, `app.js` ×11, `gallery.js` ×1,
`contact.js` ×1). `app.js` last moved at `v1.0.8`, when `initHeroMesh()` was added (§16).

**Rule: whenever you change `style.css`, `app.js`, `gallery.js` or `contact.js`, bump the
version on that file's references only.** The versions no longer have to move in lockstep —
`style.css` moves on its own whenever only CSS changed. What matters is that **each individual
asset has exactly one version across the whole site, and that version is the current one**.
Never leave two different query strings in use for the *same* asset. Otherwise
GitHub Pages and browsers will keep serving the stale cached file. Fonts are already
versioned by filename (`Vazirmatn-*.v2.woff2`) and need no query string.

`assets/` is **not** covered by this scheme — the hero video is 877 KB and must not be
re-downloaded on every deploy. It is versioned by the commit instead, so a change
to the file needs a new commit (or a renamed file), not a query-string bump.

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
`style.css` and every root JS file; 16/16 JSON-LD blocks parse (plus the
`application/json` gallery data block in `gallery.html`); 4,668 local refs checked,
0 broken; all pages `lang="en" dir="ltr"`.

**One known pre-existing exception, left alone on purpose:** three
`images/hero/doctors-*.avif` entries in the `<link rel="preload">` hint on
`index.html` point at files that do not exist. They are preload hints only, so
nothing renders differently. Say the word if you want them cleaned up.

---

## 4. Deployment-critical: root-absolute paths

The markup contains **3,970 root-absolute references** (`/contact.html`, `/index.html`,
`/style.css`, `/images/…`, and since `v1.0.3` `/assets/…`). A further 688 are relative
(622 `./…` + 66 bare), and 867 point off-site. The root-absolute figure is the one that
matters — it is the majority of internal links and it is what breaks a sub-path deploy.

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
   `application/json` block. Expected: **17** blocks, 0 errors.
   (The count is 17, not 18 — earlier revisions of this file said 18. Verified identical
   before and after the `v1.0.3` refactor, so no block was ever lost.)
3. **No broken local links** — resolve every relative `href`/`src` against the repo root,
   stripping `?query` and `#hash`. Expected: ~4,600 refs, 0 missing targets.
   Mind the spaces in `Arrow 1.svg` / `Polygon 1.svg` when writing the matcher.
4. **Cache-version consistency** — every `style.css` / `app.js` / `gallery.js` /
   `contact.js` reference carries a `?v=` value, and **each individual asset has exactly one
   version across the whole site**. As of `v1.0.5` there are legitimately **two** versions
   in play (`style.css` 1.0.5, the three JS files 1.0.4) because only the CSS changed.
   The old "one distinct version across all 24" assertion is **wrong** now — do not
   "fix" a split that is per-asset.
8. **Bump the cache version of the file you changed** if you touched CSS or JS (§2.7) —
   per asset, not across all 24 references.
9. **Every locally-hosted asset is committed** — `git status` must not list `assets/`.
   A local `/assets/…` reference that exists on disk but is untracked renders fine locally
   and 404s in production. This is the one failure mode check 3 cannot catch, because it
   only proves the file exists on disk. See §7.

Plus, for any hero background change, a **mesh-gradient check** in the browser (§16): assert
`#lm-bg-mesh` still computes to `position: fixed` / `z-index: -1` /
`pointer-events: none` / `display: block`, that it is the **first element child of `<body>`**
(so it paints after `body::before`, the fallback it covers), that the console is clean (a
compile or link failure logs a `console.warn` and sets `display: none`), that
`elementFromPoint` at the centre of both hero buttons returns `A.lm-btn`, and — if you touched
the shader — that `prefers-reduced-motion: reduce` produces a **zero** summed RGB delta across
the hero background band over a couple of seconds. **The Spline check that used to live here
was deleted in `v1.0.8`**, along with `<spline-viewer>`, `#lm-blackkey`, `.lm-beam` and the hero
clip. Nothing in the hero is a blend or a chroma-key any more; the remaining hazard is the
opaque WebGL canvas painting over the copy, which §16 constraint 1 covers.

Check 1–8 have been run for `v1.0.8` and all pass. Check 9 is currently **failing** by
design — see the warning in §7.
5. **Gallery alignment** — `nb-data` length 63, 63 `<figure class="nb-card">`, 63
   `data-i` attributes running 0…62, and `nb-data[i].id` equal to the `nb-NN` in **body card
   `i`'s image filename** (`gallery/nb-NN-640.avif`). The cards have **no `id` attribute** —
   an earlier revision of this file said "matches card `i`.id", which does not exist and
   makes the check silently useless.
6. **`lang`/`dir`** — every page is `lang="en" dir="ltr"` (all 230).
7. **No inline `<style>`/`<script>`** on the 11 main pages. A `<script>` with no `src` is
   only a violation if it is *executable* — `application/ld+json` and `application/json`
   data blocks are fine and expected.
8. **Bump the cache version** if you touched CSS or JS (§2.7) — per asset.
9. **Every locally-hosted asset is committed** — `git status` must not list `assets/`.
   A local `/assets/…` reference that exists on disk but is untracked renders fine locally
   and 404s in production. This is the one failure mode check 3 cannot catch, because it
   only proves the file exists on disk. See §7.
10. **No U+FFFD, and no mojibake markers** — scan all 11 main pages for `\uFFFD`
    (`\uFFFD` is the replacement character a lossy decode leaves behind, and it is the one
    signal that is impossible to produce by accident in this project's copy) and for the
    classic double-decode sequences `Ã`, `â€`, `Â`, `Î`. Expected: **0** of each across all
    11. This is the machine-checkable half of §14: `Ã`/`â€` can be argued about, but a single
    `\uFFFD` in a shipped page is always a real regression.
    ⚠️ `PROJECT_RULES.md` is the one file where `Ã`/`â€` legitimately appear — §14 quotes them
    on purpose. A scan flagging `PROJECT_RULES.md` is working; a scan flagging any `*.html`,
    `style.css` or root `*.js` is a bug.
11. **No `git diff --check` trailing-whitespace on a line you touched** — but note the
    11 main pages are single-line files, so `git diff --check` prints the *entire* line when
    it complains. `face-analysis.html` ends in two spaces in `HEAD` and still does; that
    warning is pre-existing and not yours. Confirm with `git show HEAD:<file>` before
    "fixing" trailing whitespace you did not introduce — stripping it would rewrite a
    whole page into the diff for nothing.

---

## 7. Git & GitHub Pages notes

- The workspace was **not** a git repository until it was initialised for the Pages
  deployment. Keep it that way going forward — commit after each verified change.
- **Do not commit `_archive/`** (4.6 MB of Persian originals) or `_astro/` (dead artefacts).
  Add them to `.gitignore` so they never reach the public repo.
- **Do not commit `pic/`** — a byte-identical staging copy of `assets/`. Gitignore it.
- ⚠️ **`assets/` IS untracked and must be committed before deploying.** The `v1.0.3`
  homepage nav and hero depend on 5 files that live in the repo rather than on
  `lemonclinic.org`: `assets/icons/{logo,instagram,Arrow 1,Polygon 1}.svg` and
  `assets/videos/hero-model.webm`. Locally they all return 200 and the page looks
  correct, so nothing warns you — but a Pages deploy from git serves **404** for all five,
  which means a broken nav bar and a dead hero video in production. Fix with
  `git add assets/` (add `assets/design-frame.jpg` to `.gitignore` too, or delete it —
  784 KB that nothing references).
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
- **Prefix new component classes `.lm-`.** The `v1.0.3` homepage nav/hero/modal (§10) are
  namespaced that way precisely so they cannot leak into the other 10 main pages that share
  `style.css`. The old `.site-header` / `.hero` rules are still there and still drive those
  pages — do not "helpfully" merge the two systems.
- New CSS must use the **semantic tokens** in §9, never the legacy aliases.

---

*Last updated: `v1.0.6` — hero matte and layout pass. The face-scan overlay is **deleted**
(markup, styles, keyframes, reduced-motion rules). The black matte is now removed by an
**SVG luma chromakey** (`#lm-blackkey` in `index.html`) instead of `mix-blend-mode`, because
measured against real decoded frames `screen` leaves only a 23-luma contrast band on this
light backdrop while the chromakey keeps 156 — §10 constraint 1. Video opacity is `1`, the
blend and the stacking-context contract are both gone, and the soft bottom feather is
`mask-image: linear-gradient(to bottom, black 80%, transparent 100%)`. The figure box is
enlarged to the hero proportion `1678/944`, centred by a negative margin, bottom-anchored.
Nav and hero grid widened (`1440px` / `1420px`), "Beauty Clinic" is a two-line dark serif
wordmark, and the doctor avatars sit below their label. CSS/JS cache versions are now
`1.0.6` / `1.0.5`. Checks 1–8 pass; `assets/` still needs committing before deploy.*

---

*Updated again in `v1.0.8`: the hero clip (`v1.0.4`–`v1.0.6`), the Spline scene (`v1.0.7`)
and the scan beam are **all gone**. The hero centre is now empty and the hero background is a
WebGL mesh gradient — see §16. Cache versions are now `style.css` `1.0.8` / `app.js` `1.0.6`.*

---

## 9. Theme: Zen Linen Light (active since `v1.0.2`)

`style.css` `:root` is **Zen Linen Light**: a fully neutral, warm-grey linen ramp
with a near-black primary. It is deliberately low-chroma. If you are retheming
again, edit the tokens, not the call sites — the palette is the single source of
truth and every component already consumes it by semantic name.

**Semantic tokens (authoritative, defined first, use these in new code):**

| Token | Value | Role |
|---|---|---|
| `--background` | `#E9E4D8` | page canvas |
| `--foreground` | `#1E1E1E` | body text |
| `--card` | `#F4EFE4` | card and panel fills |
| `--card-foreground` | `#1E1E1E` | text on `--card` |
| `--primary` | `#2E2E2E` | buttons, CTA bands, emphasis text, active chips |
| `--primary-foreground` | `#E6E4D7` | text on `--primary` |
| `--secondary` | `#D8D2C4` | badges, chips, inline notes, hover fills |
| `--secondary-foreground` | `#2E2E2E` | text on `--secondary` |
| `--muted` | `#CFC8B8` | subtle fills, `code` |
| `--muted-foreground` | `#5E5A52` | secondary text, captions |
| `--border` | `#D2CBBB` | all hairlines and card borders |

Supporting groups:

| Group | Tokens |
|---|---|
| Reserved accent | `--chart-1` `#F26A4B`, `--warn` |
| Status | `--danger` `--danger-deep` `--danger-soft` `--ok` |
| Dark depth ramp | `--clay-300` … `--clay-900` |
| Legacy aliases | `--cream` `--cream-soft` `--surface` `--line` `--ink` `--ink-soft` `--espresso` `--scrub` `--on-accent` `--gold` `--gold-deep` `--gold-btn` `--gold-btn-deep` `--gold-champagne` `--matcha` `--sage` `--sage-deep` `--sage-light` `--wood` |
| Type, layout, shadow | `--font-*` `--step-*` `--wrap` `--gutter` `--radius*` `--shadow-*` `--bottombar-h` |

Notes that will save you time next time:

- **Zero `var()` call sites reference the legacy aliases.** All 585+ references
  in the body of `style.css` were rewritten to the semantic names. The alias
  block is retained only as a safety net for any hand-written or future snippet
  that still uses the old names. If you add CSS, use the semantic names.
- **`--gold` is now `--primary`, not terracotta.** The old accent is gone from
  every call site. Do not reintroduce it.
- **`#F26A4B` is quarantined in `--chart-1` and is currently unreferenced.**
  It is reserved for warning/caution tags only — never buttons, headers or CTAs.
  The only alert element on the site is `.bk-alert`, which is a *form error* and
  correctly uses `--danger`. Before wiring `--chart-1` into anything, confirm the
  element is genuinely a warning tag.
- `--clay-300`…`--clay-900` are `color-mix` results derived from `--foreground`
  and `--primary`, so the dark bands (footer, bottom bar, CTA strips) stay inside
  the palette and can never drift from it.
- **The 219 leaf pages do not load `style.css`.** They are standalone documents
  with their own inline `<style>` defining a local `:root` plus a small
  `main`/`.note`/`code` ruleset. All 219 style blocks are byte-identical
  (single MD5). If you change the palette, change that block in all 219 files
  too, or the two halves of the site drift.
- `theme-color` on the 11 main pages is a literal `#E9E4D8` matching
  `--background`, not a `var()`. A `<meta>` attribute cannot resolve a custom
  property — update it by hand.
- Shadows and translucent overlays use `color-mix(in srgb, var(--x) N%, transparent)`
  rather than 8-digit hex. That is why there are no `#RRGGBBAA` literals left
  except pure white/black insets on dark surfaces, which are intentional.

---

## 10. Homepage hero + floating nav + video modal (added in `v1.0.3`)

The homepage was rebuilt around three new pieces. **Only `index.html` changed** — the other
10 main pages still use the original `.site-header` / `.hero` markup and rules, untouched.
New CSS is appended at the end of `style.css` under one banner comment; new JS is
`initVideoModal()` in `app.js`, called from the existing IIFE.

| Piece | CSS | Markup | JS |
|---|---|---|---|
| Floating pill nav | `.lm-header`, `.lm-nav`, `.lm-brand*`, `.lm-menu`, `.lm-lang*`, `.lm-social`, `.lm-cta`, `.lm-burger` | `index.html` only | reuses the existing scroll handler — see constraint 4 |
| Hero | `.lm-hero`, `.lm-hero-giant`, `.lm-hero-grid`, `.lm-hero-copy`, `.lm-kicker`, `.lm-lead`, `.lm-buttons`, `.lm-btn*`, `.lm-hero-media`, `.lm-hero-shadow`, `.lm-beam`, `.lm-hero-doctors`, `.lm-docs-head`, `.lm-doctors-title`, `.lm-avatars`, `.lm-play-*` | `index.html` only | — |
| Video modal | `.lm-modal`, `.lm-modal-backdrop`, `.lm-modal-card`, `.lm-modal-video`, `.lm-modal-cap`, `.lm-modal-x`, `body.lm-modal-open` | `index.html` only | `initVideoModal()` |

Four constraints that are easy to break and expensive to debug:

**1. ⛔ RETIRED IN `v1.0.7` — the hero clip and its chromakey are both gone. Kept for history.**

> `v1.0.7` replaced the hero clip with a Spline 3D model (§13), and `v1.0.8` removed the
> Spline model too (§16). The whole chain described
> below — `#lm-blackkey`, `.lm-key-defs`, `filter: url(#lm-blackkey)`, `object-fit` /
> `object-position`, the `mask-image` bottom feather and the `--lm-ratio` aspect pin — was
> **deleted in one go**, which is exactly what this constraint instructed. The clip
> *file* survives because `.lm-play-card`'s modal still streams it via `data-lm-video`.
>
> **So the ⚠️ below no longer applies.** `#lm-blackkey` is supposed to be absent, not
> present; there is no matte to leak, and the chroma-key browser check described at the end
> of §6 and in §12 must **not** be run any more. Nothing here is a live hazard — it is a
> record of why the clip could not simply be blended, so the reasoning is not re-derived
> if a video ever returns to the hero.

History, because it explains the deleted code: the clip `assets/videos/hero-model.webm` is VP9
with **no alpha channel** — the black background is baked into the pixels. `v1.0.3` removed
the matte with `mix-blend-mode: screen`; `v1.0.4` dropped the blend and shipped a visible
black box; `v1.0.5` restored `screen`.

`v1.0.6` removed the blend entirely, because measurements on the decoded frames showed no
blend operator can work here. Backdrop `#E9E4D8` is luma 228, the matte is luma 0 and
occupies 64.2% of the frame, and the subject sits at luma 106–231. Simulated against those
real pixels:

| approach | matte leak | subject's on-screen contrast band |
| --- | --- | --- |
| `lighten` (`max(B,S)`) | 0% | **6 luma** — invisible |
| `screen` (`B+(1−B)S`) | 0% | **23 luma** — washed out |
| luma→alpha filter | **0%** | **156 luma** — full contrast |

`screen` maps every matte pixel to exactly the canvas but confines the whole model to the
228–255 band. That is not a tuning problem: both operators are mathematically incapable of
preserving contrast against a light backdrop. So the matte is now removed by **turning
luminance into alpha**:

- `<filter id="lm-blackkey">` is defined **once, in `index.html`**, as the first child of
  `<body>` inside `<svg class="lm-key-defs">`. The wrapper class is `.lm-key-defs` and must
  stay `position: absolute; width: 0; height: 0; overflow: hidden` — **never
  `display: none`**, which stops the filter resolving.
- The filter is `feColorMatrix` (identity RGB, alpha := `.2126R+.7152G+.0722B`) →
  `feComponentTransfer` linear (`slope=6.25 intercept=-0.625`, i.e. clear below luma 0.10,
  opaque above 0.26) → a second `feComponentTransfer` table (`0 .15 .5 .85 1`) that eases
  the edge. `color-interpolation-filters="sRGB"` is mandatory, or the luma maths shifts.
- `.lm-hero-video` applies it via `filter: url(#lm-blackkey) contrast(1.04) saturate(1.06)`.
  The grade functions run after the key, so colour never affects the matte decision.

> ⚠️ **The one thing that can still break this:** if `#lm-blackkey` is renamed, removed, or the
> `url(#…)` reference is dropped, the clip renders its matte as a black rectangle again —
> there is no blend to fall back on. Verified in Chrome over real decoded frames: 0.0000% of
> matte pixels survive as dark pixels, against a 65.6% control with the filter removed.
> **[SUPERSEDED — both halves of that sentence no longer apply: there is no filter and no
> clip in the hero.]**

Because the key is alpha-based and composites as an ordinary layer, `.lm-hero` and
`.lm-hero-media` are now **free** to gain `z-index`, `isolation`, `filter`, `transform`,
`opacity < 1`, `will-change`, `contain` or `mask` without the matte returning. Two structural
rules are kept anyway, as plain layout/robustness choices rather than blending requirements:

- **`.lm-hero-media` is a direct child of `.lm-hero`, before `.lm-hero-grid` in the DOM**, so
  the copy column paints over the model. `v1.0.7` extended this: the box is now explicitly
  `z-index: 0` so the viewer's `z-index: 2` cannot escape it and cover the headline — see §13.
- **Centring uses `margin-inline-start: calc(var(--lm-w) / -2)` from `left: 50%`, not
  `transform: translateX(-50%)`** — a transform would promote the looping full-bleed video to
  its own compositing layer and force a texture upload every frame. `[The compositing
  argument is obsolete now that the video is gone; the rule is kept because it also centres
  correctly at any width without touching layout.]`

`--lm-ratio` is now the hero proportion `1678 / 944` (~1.778), **not** the clip's own
`1434 / 990`. The old pin existed only so the (now deleted) `.lm-scan-box` percentage offsets
could not drift off her face. Size is driven by the height budget
(`--lm-w: min(94vw, calc(80svh * 1.7775), 1678px)`); `80svh` is deliberate, because the box
is bottom-anchored in a `100svh` hero and `88svh` would leave ~4px between her head and the
floating nav on a 768×600 laptop. `[All of this was deleted in v1.0.7 — the viewer has a fixed
500px height, so there is no ratio to pin and no height budget to derive width from.]`

> **If the video is ever replaced with a real alpha WebM**, delete the SVG, the `url(#…)`
> and the wrapper class in one go. `object-position`, the grade and the `mask-image` bottom
> feather are alpha-agnostic and survive either way. Note that `ffmpeg`'s `libvpx-vp9`
> encoder cannot emit alpha (`AlphaMode: ABSENT`); a transparent-capable pipeline needs
> WebP-with-alpha or a `yuva`-format intermediate.
> **[DONE in v1.0.7, in full: SVG, `url(#…)`, `.lm-key-defs`, the grade, `object-fit`,
> `object-position`, the `mask-image` feather and `--lm-ratio` are all gone.]**

**2. The pill-menu breakpoint is coupled to the shared one, at exactly `1000px`.**
`.lm-menu` (pill links) and `.lm-burger` (drawer) swap at `@media(min-width:1000px)`, which
must stay identical to the `.burger` / `.mobile-drawer` breakpoint used by the other 10
pages. Drift and you get a dead band with no navigation at all, or two competing navs.
Verified across 360/414/559/560/768/999/1000/1180/1440px: exactly one affordance at every
width, never overflowing the viewport.

**3. The video modal is delegation-based and state lives in two places.**
The trigger carries `data-lm-video="<src>"`; the modal is `#lm-video-modal`, `hidden` until
opened. `initVideoModal()` binds **delegated** listeners on `document` (not on the trigger),
so it keeps working if the play card is re-rendered, and it no-ops on the other 10 pages via
the `if (!modal || !video || modal.dataset.bound) return;` guard plus a `dataset.bound`
re-entrancy flag. Open/close must stay symmetrical: set `src` + remove `hidden` + add
`body.lm-modal-open`; and on close re-add `hidden`, remove the body class, `pause()`,
`removeAttribute('src')` and `load()` to release the decoder, and restore focus to the
opener. `body.lm-modal-open` sets `overflow: hidden` for the scroll lock, and `.lm-modal[hidden]`
must keep the dialog off-screen. There are **no inline handlers** — `onclick` appears nowhere
in `index.html`.

**4. The pill nav piggybacks on the old handler through an `id`, not a class.**
The existing scroll listener in `app.js` is unchanged and still does
`document.getElementById('site-header')` — it knows nothing about `.lm-header`. The homepage
bridges the two with `<header class="lm-header" id="site-header">`, so the listener toggles
`.scrolled` on the pill and `.lm-header.scrolled .lm-nav` takes over (pill background goes
`--card` at 70% → 90% opacity past 8px of scroll). **Drop that `id` and the rule silently
becomes dead code** — the nav still works, it just never gets its scrolled treatment, and
nothing errors. Verified live: class toggles both ways and the computed background changes.

**Verified for `v1.0.3`** (Chrome, headless, against `localhost:8000`): all 7 pre-flight
checks in §6 pass; nav computed styles resolve (`position: fixed`, `blur(18px) saturate(1.5)`,
`999px` radius, 70% fill); hero video `readyState=4` with the blend live; modal opens on
click, locks scroll, moves focus, closes on Escape *and* backdrop, clears `src` and restores
focus; no JS exceptions; `services.html` shows no `.lm-nav` and keeps its original nav and
Zen Linen background. **Not verified by machine: visual appearance** — confirm the hero
composition and pill contrast by eye before shipping.

---

## 11. Homepage hero Frame 4 refactor (`v1.0.4`) — SUPERSEDED BY §12

Six changes, all confined to `index.html` and the appended `.lm-*` block in `style.css`.
The other 10 main pages are untouched apart from the `?v=` bump.

| # | Change | Status after `v1.0.6` |
|---|---|---|
| 1 | Dropped `mix-blend-mode:screen` for a `mask-image` bottom feather | ✅ Reverted — but **not** by restoring a blend. `v1.0.6` uses the `#lm-blackkey` SVG chromakey (§10 constraint 1) and keeps the feather |
| 2 | `.lm-cta` / `.lm-social` pinned to a fixed `38px` height; language pill became a static `<span>` | ✅ Still correct; `v1.0.5` tightened centring and made `EN` a true 38×38 circle, and `v1.0.6` left both alone |
| 3 | Giant title became two stacked lines in a flex column, `aria-hidden` | ✅ Still two lines, static and left-aligned inside `.lm-hero-copy`; `v1.0.6` restyled it as a dark serif "Beauty Clinic" |
| 4 | `.lm-stack` (timeline list) → `.lm-avatars` overlapping row + `.lm-docs-head` "Seeing doctors" | ✅ Unchanged; `v1.0.6` moves the avatar row **below** the label |
| 5 | `.lm-scan` became a transparent frame with **three** `.lm-scan-box` elements | ❌ **Deleted outright in `v1.0.6`** — markup, styles, keyframes and reduced-motion rules |
| 6 | `.skip-link` visually hidden until focused | ✅ Unchanged |

Two conventions from this revision still hold:

**A. The language pill is deliberately inert.** It was a two-part `EN`/`FA` pill whose
`<a hreflang="fa-IR">` pointed at the Persian production domain — a dead end for an
English-locale visitor and the only interactive nav element that led off-domain. There
is no second localisation to switch to, so it is a `<span>` with no `href`, no `hreflang`
and no handler. Do not "restore" the anchor without building a real localised route.
It reads `EN` because that is the language actually served.

**B. `.lm-play-card` is capped at `max-width:260px` deliberately.** In a `1fr` grid column
an uncapped `3/4` card grows taller than the model column beside it and inflates the
hero's `min-height:100svh`.

**C. The overlapping avatar row relies on DOM order for stacking**, not on `z-index`;
`z-index:1` appears only on `:hover`. The `2px solid var(--background)` ring on each
`<img>` is what keeps adjacent discs legible once they overlap — do not drop it.

> The `v1.0.4` horizontal-overflow warning that used to end this section — `.reveal-r`
> pushing the page sideways below 1180px — is **closed** by `body { overflow-x: clip }` in
> `v1.0.5` (§12). `window.scrollX` after `scrollTo(200,0)` is 0 at 390px and 1024px.


## 12. Hero alignment pass (`v1.0.5`, matte superseded in `v1.0.6`)

`v1.0.4` got the hero's structure roughly right but left five measurable defects against
`Frame 4.jpg`. This pass fixed them. Still confined to `index.html` + the `.lm-*` block of
`style.css` + the hero video asset; the other 10 main pages only got the `?v=` bump.

| # | Defect found | Fix |
|---|---|---|
| 1 | **Black matte visible.** `v1.0.4` had removed `mix-blend-mode: screen`, so the VP9 clip's baked-in black rendered as a hard rectangle | `v1.0.5` restored a blend; **`v1.0.6` replaced it with the `#lm-blackkey` SVG chromakey** — see §10 constraint 1 |
| 2 | **Model not centred.** Centring relied on `transform` | `left: 50%` + `margin-inline-start: calc(var(--lm-w) / -2)`. The aspect pin was `1434 / 990` for the deleted scan boxes; `v1.0.6` sets it to the hero proportion `1678 / 944` |
| 3 | **Title full-bleed and vertically centred**, per `v1.0.3` styling | Moved *into* `.lm-hero-copy`, `position: static`, `align-items: flex-start`, dark ink, `clamp(3rem, 7.6vw, 8rem)`; the vertical-centring `translateY` is gone |
| 4 | **Three large overlapping boxes**, not "3–4 small feature boxes" | `v1.0.5`: four small boxes — `.lm-scan-eye-l`, `.lm-scan-eye-r`, `.lm-scan-nose`, `.lm-scan-mouth` — driven by a new `@keyframes lm-face-track`. **`v1.0.6` deleted the whole overlay**; this row is history only |
| 5 | **Nav controls not concentric.** `EN` measured 35×38 with a 0.98px label offset | `.lm-lang` / `.lm-social` / `.lm-cta` all `display:flex` + both-axis centring; `EN` is `38×38`, `padding:0`, `border-radius:50%` |

Also: the video was **re-cropped to 1434×990** (from 1730×1080) so the subject sits in the
upper half of the frame. `body` gained `overflow-x: clip`, which closes the long-standing
horizontal-overflow bug flagged in §11 — see the note below.

### The face track (REMOVED in `v1.0.6`) was measured, not eyeballed

> ⛔ **Historical only.** Nothing in this subsection exists any more. `v1.0.6` deleted the
> scan overlay in full — the `.lm-scan` markup in `index.html`, the `.lm-scan*` rules, the
> `lm-scan-lock` / `lm-face-track` keyframes, and the `prefers-reduced-motion` parking rule.
> That is also why `--lm-ratio` is free to be the hero proportion rather than the clip's.

`@keyframes lm-face-track` had **18 keyframes at 20-frame intervals over `10.7s linear`**,
matching the clip's 321 frames @ 30fps exactly. The track was derived by dumping all 321
frames to luma (`all.raw`) and taking the subject's horizontal centroid per frame; the face
sweeps **38.19% → 62.5%** and returns to 38.19%, so `0%` and `100%` are identical and the
loop is seamless. Vertical placement was static (`y` 1–9% top, chin ~37%, widths 23.6–31.9%)
because the subject does not move vertically.

`prefers-reduced-motion: reduce` **parked** `.lm-scan-track` at `translateX(43.75%)` — a real
face position — rather than snapping to `0%`, which would have put the boxes on an empty
shoulder. The hero clip is now left to play; only hover transforms are suppressed.

### Rules that keep this from regressing

> ⛔ **All four rules below are void as of `v1.0.7`** — they all describe the hero clip, which
> §13 replaced with a Spline model and which §16 then removed from the hero entirely. Kept as
> history; the live rules are in §16.

- Keep `#lm-blackkey` in `index.html` and the `url(#lm-blackkey)` reference in
  `.lm-hero-video`. Drop either and the matte returns as a black rectangle.
- Keep `.lm-hero-media` a direct child of `.lm-hero`, **before** `.lm-hero-grid`, so the copy
  column paints over the model.
- Keep `--lm-ratio: 1678 / 944` and the `margin-inline-start` centring. There is no
  `.lm-scan-box` left to protect, so `aspect-ratio` is now a sizing choice rather than a
  track-lock — but the negative margin avoids a per-frame composited layer on a looping video.
- If you re-crop or re-encode the video, **re-run the keytest pixel comparison** described in
  §10 constraint 1. Do not eyeball it.

### Verified for `v1.0.6` (Chrome headless via CDP, `localhost:8000`)

- **Chroma-key:** `#lm-blackkey` present with 3 filter primitives and
  `color-interpolation-filters="sRGB"`; `.lm-key-defs` measures 0×0 and is not `display:none`;
  `.lm-hero-video` computes `mix-blend-mode: normal` and
  `filter: url("#lm-blackkey") contrast(1.04) saturate(1.06)`, `opacity: 1`.
- **Matte removal, measured over real decoded frames** with that exact filter graph in the same
  browser: **0.0000%** of matte pixels survive as dark pixels (worst darkening 0 luma), versus a
  **65.63%** dark control with the filter removed. Subject renders across luma 64–226 against
  the canvas — a 162-luma band, vs 23 for `screen` and 6 for `lighten`.
- **Geometry, all eleven viewports** (1920×1080 → 360×740): media aspect delta <0.002 against
  the target, bottom gap 0, centring offset ≈0, and the media top clears the nav at every size.
- **Nav:** `.lm-nav` 1440px at 1920; `EN` 38×38 and a true circle; `.lm-cta` 38px with the
  glyph centred. **Hero grid** 1420px; avatars below the label and left-aligned with it.
- **Overflow:** `window.scrollX` after `scrollTo(200,0)` is 0 everywhere. No JS errors.
- Pre-flight checks 1–8 pass. Check 9 still fails by design (§7).

> ⚠️ **Known tooling limit, not a product bug:** this headless Chrome build does **not**
> composite the `<video>` layer into `Page.captureScreenshot` — with the video shown and with
> it `display:none` the screenshots are identical, despite `readyState=4` and advancing
> `currentTime`. So the on-page pixel probe cannot measure the matte, and the face-tracking
> assertions that were meaningful in `v1.0.5` no longer apply to anything (the overlay is
> deleted). The chromakey is instead validated by decoding frames via `drawImage` and running
> the identical SVG filter in the browser over those pixels.

> ⚠️ **Still open:** `assets/` is untracked, and `Frame 4.jpg` could not be opened during the
> v1.0.5 session, so parity is **measured against the stated spec, not diffed against the
> reference image**. The numbers above prove geometry and that the matte is gone; they do
> not prove the composition is pixel-identical to Frame 4. **Eyes on it before shipping.**

---

## 13. Hero Spline 3D model (`v1.0.7`) — **RETIRED in `v1.0.8`, superseded by §16**

> ⛔ **Everything in this section is history as of `v1.0.8`.** The Spline scene, its ground
> shadow, its scan beam, the `.lm-hero-media` box, the `<spline-viewer>` element and the
> third-party viewer `<script>` are **all gone** — see §16. The hero now has **no centre
> figure at all**; it is a background mesh gradient shader. The notes below are kept because
> the reasoning is expensive to re-derive, and because §16's `z-index` rule is the *same*
> contract in a new place. Do not reintroduce any of the values here without reading §16 first.
>
> Kept because the reasoning is expensive to re-derive and was the reason the clip could
> never simply be blended.

The hero centre figure is now a **live Spline scene**, not footage. The `<video>` element was
removed from the markup and the entire `#lm-blackkey` chroma-key apparatus was deleted with it.
`style.css` → **`1.0.7`**. Confined to `index.html` + the `.lm-*` block of `style.css`, except
the `?v=` bump, which per-asset touched all 11 main pages (§2.7). No JS changed — `app.js` stays
at `1.0.5`.

| Piece | CSS | Markup |
|---|---|---|
| Spline model | `.lm-hero-media > spline-viewer`, `@keyframes lm-spline-in` | `<spline-viewer url="…/scene.splinecode">` |
| Ground shadow | `.lm-hero-shadow` | `<span class="lm-hero-shadow" aria-hidden="true">` |
| Scan beam | `.lm-beam`, `@keyframes lm-beam-scan` | `<span class="lm-beam" aria-hidden="true">` |

Two third-party URLs were hard dependencies of the homepage for exactly one version. Both are
now removed and **neither is referenced anywhere in the repo any more**:

```
https://cdn.spline.design/@splinetool/viewer@2.0.66/build/spline-viewer.js   (was: module, in <head>)
https://prod.spline.design/6FTM7SVyvYfvBbGZ/scene.splinecode                 (was: ~909 KB)
```

The homepage now loads **zero** third-party scripts. This also means the homepage's only
remaining external requests are the `lemonclinic.org` doctor avatars (§2.6).

### Three constraints that are easy to break

**1. `.lm-hero-media` is `z-index: 0`, and that is load-bearing.**
`<spline-viewer>` is specified at `z-index: 2`. `.lm-hero` is not a stacking context, and
`.lm-hero-grid` is `z-index: 1` — so with the media box at `z-index: auto` the viewer's `2`
competes with the copy column **directly**, and the opaque WebGL canvas paints over the
"Beauty Clinic" headline and both hero buttons. Giving the media box `z-index: 0` makes it a
stacking context, which scopes the viewer's `2` inside it while keeping the whole box *below*
the grid. **Do not "tidy" this back to `auto`, and do not raise `.lm-hero-grid` above `2`.**
`.lm-beam` is `z-index: 3` for the same reason: inside that context it must outrank the viewer,
and it does *not* need `3` in any absolute sense — only "above the viewer".
> ⚠️ **Superseded.** `.lm-hero-media` is deleted. The *same* "opaque WebGL canvas paints over
> the hero copy" hazard now applies to `.lm-hero-mesh`, and §16 constraint 1 is where it is
> handled. The reasoning about stacking contexts is unchanged.

**2. The media box is `height: 520px` while the viewer is `500px`. That 20px is the shadow's.**
`.lm-hero-shadow` sits in flow after the viewer and is pulled up by `margin-top: -20px` at
`height: 30px`, so it spans 480–510px inside a 520px box. `.lm-hero` is `overflow: hidden` and
the box is bottom-anchored, so without those 20 spare px the shadow's bottom 10px is clipped by
the section. If the viewer's `height` ever changes, **the media box must be `height + 20px`.**
> ⛔ Obsolete — there is no shadow and no fixed-height child any more.

**3. `display: block` on `spline-viewer` is not cosmetic.**
The element is unknown to the parser until the viewer module registers the custom element.
Until then it computes to `display: inline`, which **collapses the specified `height: 500px`**.
The rule also has to beat the custom element's own UA/`::part` styling, hence the `>` child
combinator rather than a bare type selector.
> ⛔ Obsolete — `<spline-viewer>` no longer exists. The nearest live equivalent is
> `display: block` on `.lm-hero-mesh` (§16 constraint 2), which is required for a different
> reason: it stops the canvas baseline adding ~4px of descender gap under `height: 100%`.

### Rules that keep this from regressing

- ⛔ **All of the following describe deleted elements. They are kept as a record of what was
  verified, not as live rules.** Do not "restore" them. The live rules are in §16.
- Keep the five specified container declarations on `.lm-hero-media > spline-viewer` verbatim:
  `background: transparent; width: 100%; height: 500px; position: relative; z-index: 2;
  pointer-events: auto`. They live in `style.css`, not as a `style=""` attribute — the project
  has no inline styles on the 11 main pages (§6 check 7).
- Keep `.lm-hero-media` a **direct child of `.lm-hero`, before `.lm-hero-grid`**, and keep
  `margin-inline-start: calc(var(--lm-w) / -2)` centring (`--lm-w: min(94vw, 880px)`, and
  `min(140vw, 760px)` under 999px so the model overflows the section on phones and gets cropped
  symmetrically rather than shrinking to a thumbnail). `--lm-ratio` is **gone** — the viewer
  has a fixed height, so there is nothing left to derive an aspect ratio from.
- Keep `.lm-beam` at `pointer-events: none`. It is decorative and must never intercept a click
  meant for the model, and that is also why `elementFromPoint` at the beam's centre returns
  `spline-viewer`, not the beam — **that is correct, not a paint-order failure.**
- `prefers-reduced-motion: reduce` **parks** the beam at `top: 40%` (a real mid-face position)
  rather than snapping it to a keyframe endpoint, and drops the entrance zoom to
  `transform: none; opacity: 1`. The Spline scene's own animation is deliberately left running,
  on the same argument that used to keep the clip playing: it is third-party content the page
  renders but does not drive.
  > ⚠️ **This last bullet is now wrong and must not be copied forward.** It relied on the Spline
  > scene being *third-party* content the page does not drive. §16's mesh gradient **is** driven
  > by this page, so reduced motion suppresses it properly — the loop never starts. The old
  > "leave it running" argument does not transfer.

### The hero clip file is still needed

`assets/videos/hero-model.webm` was **not** deleted. `.lm-play-card` — the "Watch the clinic
film" card in the doctors column — still points at it with
`data-lm-video="/assets/videos/hero-model.webm"`, and `initVideoModal()` streams it on click.
Only its use as the *background figure* ended. So check 9 (§6) still matters exactly as before,
and `server.js`'s `.webm`/`.mp4` MIME entries are still required.

### Verified for `v1.0.7` (Chrome headless via CDP, `localhost:8000`)

> ⛔ Historical. Kept because the *measurement method* is what §16 reuses — see §16's
> verification notes, which correct one of the limitations noted at the bottom of this list.

- **Spline:** `customElements.get('spline-viewer')` resolves; `shadowRoot` is populated
  (12,386 chars) and contains a `<canvas>`. Computes `background: rgba(0,0,0,0)`, `width: 880px`,
  `height: 500px`, `position: relative`, `z-index: 2`, `pointer-events: auto`, `display: block`.
- **Dead code gone:** `.lm-hero-video`, `#lm-blackkey` and `.lm-key-defs` all return `false`
  from `querySelector` at every viewport. `[data-lm-video]` still `true` — the play card is intact.
- **Paint order:** at every one of seven viewports (1920×1080 → 360×740) the element at the
  centre of `.lm-btn` is `A.lm-btn` — the copy column is above the model everywhere.
- **Geometry:** media centring offset **0** at 1920/1440/1180/999; −9 to −13px at 768/414/360,
  which is exactly half the pre-existing `overflow-x: clip` document overflow (§12), not new
  drift. The shadow's bottom clears the hero's bottom at **every** viewport (`clipped: false`),
  confirming the 20px rule. `window.scrollX` after `scrollTo(400,0)` is **0** everywhere.
- **Entrance zoom:** transform sampled across the run — `scale` 0.8 → 0.8876 → 0.9491 → 0.9762
  → 0.9907 → 0.9963 → 0.999 → 1.0 over ~1.05s, opacity 0 → 1 alongside. The ease-out curve
  `cubic-bezier(.22, 1, .36, 1)` is visible in the step spacing.
- **Beam scan:** 33 distinct `top` values over 10s, ranging **453→723px = 270px of travel**,
  which is exactly 14%–66% of the 520px media box. Smooth, continuous, up **and** down.
- **Pixels:** in the 1440×900 screenshot the beam's widest row is y=762, 423px wide,
  x 499–941 — centre **x=720**, dead centre of the frame. Its edge pixel at the box boundary
  reads `#e6e2d6` against a `#f2ede1` background, i.e. feathered to nothing: the `mask-image`
  leaves no hard edge. The shadow's edge pixel reads `#e6e1d4`, likewise feathered.
- **Reduced motion:** viewer `animation-name: none`, `transform: none`, `opacity: 1`; beam
  `animation-name: none`, `top: 208px`, `opacity: 0.9` — zoom skipped, beam parked and visible.
- Pre-flight checks 1–8 pass (17 JSON blocks, 3,969 local refs with 0 missing, 63/63 gallery
  alignment, 230/230 `lang="en" dir="ltr"`, 0 inline scripts or `<style>` blocks).
  Check 9 still fails by design (§7).

> ⚠️ **Not verified by machine: the WebGL pixels themselves.** This headless Chrome runs
> `--disable-gpu`, and headless does not reliably composite the Spline canvas into
> `Page.captureScreenshot`. So the numbers above prove the element is upgraded, sized,
> centred, layered and animating, and that the beam and shadow are genuinely painted — but
> **the rendered 3D model has not been seen.** Confirm the model's framing, scale and its
> rotation against the hero copy by eye before shipping.
>
> ✅ **§16 corrects this.** A shader *this* page compiles itself DOES composite into
> `Page.captureScreenshot` under the same `--disable-gpu` flag (SwiftShader), so the wash's
> actual pixels were decoded and measured — see §16. The limitation above was specific to the
> third-party viewer, not to headless WebGL in general.

---

## 14. UTF-8 encoding incident (`v1.0.7`) — repair applied, method recorded

Before the Spline work, all **11 main pages** were found in the working tree **double-encoded**:
UTF-8 bytes that had been decoded as Latin-1 and re-encoded as UTF-8, producing visible mojibake
(`Services ▾` rendering as `Services Ã¢â€“Â¾`, `©` as `Ã‚Â©`, `—` as `Ã¢â‚¬â€`). `HEAD` was
clean, so this was introduced by an earlier uncommitted edit — most likely a PowerShell
round-trip that read and rewrote the files without an explicit encoding.

**Repair:** for each file, decode as UTF-8, re-encode the resulting string as **ISO-8859-1
(code page 28591)**, and decode those bytes as UTF-8. That inverts the double-decode exactly.
All 11 files round-tripped clean and were written back as UTF-8 **without BOM**.

Verified per file that the repaired text contains no `Ã` and no `â€` residue, and spot-checked
against `HEAD`: `services.html` post-repair is byte-identical to `HEAD` apart from the intended
`?v=` cache bumps. No markup, class, link or copy was otherwise touched.

> ⚠️ **How this recurs, and how to avoid it.** In PowerShell 5.1, `Get-Content` /
> `Out-File` / `Set-Content` without `-Encoding utf8` mangle non-ASCII, and
> `Get-Content -Raw` + `[System.IO.File]::WriteAllText` is safe **only** because the encoding
> is passed explicitly. This project's files are full of `—`, `·`, `©`, `’` and per-mille
> signs. **Prefer the editor tools over shell redirection for any file containing non-ASCII.**
> The cheapest guard is check 1 plus a scan for `Ã`/`â€`, which is now part of the pre-flight.
>
> **Note for whoever runs that scan:** this section is the *only* place in the repo where
> `Ã` and `â€` legitimately appear — they are the worked examples above, quoted on purpose.
> A scan that flags `PROJECT_RULES.md` is working. Flagging any `*.html`, `style.css` or root
> `*.js` is a real regression.

---

## 15. Open items carried forward

- **`assets/` is still untracked** (§6 check 9, §7). Both `/assets/icons/*.svg` and
  `/assets/videos/hero-model.webm` are referenced from `index.html` and will 404 in production
  until committed. Unchanged by `v1.0.7`, and now more important than ever: the hero no longer
  has a fallback image, so a production 404 on the icons degrades the nav.
- **`Frame 4.jpg` has never been opened** in any session, so hero composition has always been
  checked against the stated spec rather than diffed against the design reference.
- ~~**The hero's visual appearance is still unverified by machine**~~ — **resolved for the
  background in `v1.0.8`**: §16 decodes the shader's actual rendered pixels out of
  `Page.captureScreenshot`, so the wash is measured, not assumed. Still needs a human eye for
  *composition* (is the warm zone in the right place?), which no pixel probe can answer.
- **`_astro/`** is still 3 dead artefacts and `_archive/` is still 4.6 MB of Persian originals;
  both gitignored, neither deleted.

---

## 16. Hero background mesh gradient shader (`v1.0.8`) — supersedes §13

The Spline scene, its ground shadow and its scan beam are **deleted**. The hero centre is now
**empty**, and the hero's background is a WebGL mesh gradient. `style.css` → **`1.0.8`**,
`app.js` → **`1.0.6`** (this is the first version in which `app.js` changed since `v1.0.3`).
Both bumps touched all 11 main pages per §2.7. Touched files: `index.html`, `style.css`,
`app.js`, the 11 `?v=` bumps, and this document.

| Piece | Where | Markup |
|---|---|---|
| Canvas layer | `.lm-hero-mesh` | `<canvas class="lm-hero-mesh" id="lm-hero-mesh" aria-hidden="true">` |
| No-WebGL fallback | `.lm-hero`'s `background-image` | *(none — CSS only)* |
| Shader + lifecycle | `initHeroMesh()` in `app.js` | *(none)* |

**There are no third-party dependencies.** The shader is compiled and linked from strings in
`app.js`; there is no CDN URL, no `scene.splinecode`, and no external script on the homepage
at all. Nothing here is covered by §2.7's scheme and nothing can 404.

### Agreed parameters

```js
colors:      ['#fdfbf7', '#f3eee4', '#e6ded0', '#f8f5ee', '#d4af37', '#f2ebe0'],
distortion:  0.6,
swirl:       0.4,
speed:       0.3
```

These live in one object, `HERO_MESH`, and are uploaded verbatim as the `u_colors`,
`u_distortion`, `u_swirl` and `u_speed` uniforms. **The palette and the three scalars are
specified — treat them as fixed.** Everything else in the shader (blob radii, drift rates,
warp frequencies) is an implementation detail chosen to make *that* palette look like luxury
linen; see constraint 4 before "simplifying" it.

### How it works, in one paragraph

One full-screen triangle, no index buffer. The fragment shader centres and aspect-corrects
`gl_FragCoord`, applies a rotational warp (`swirl`) about the middle, applies an fbm domain warp
(`distortion`), then accumulates six gaussian colour blobs drifting on Lissajous-ish paths,
each scaled by a per-blob weight, and divides by the total weight. Because that division makes
the result a **convex combination of the palette**, no region of the wash can ever fall outside
the palette, blow out to white, or go black — the clamp at the end is belt-and-braces. `speed`
multiplies the elapsed-time uniform; all internal drift rates are an order of magnitude below
it so the motion reads as ambient light rather than a sliding stain.

### Four constraints that are easy to break

**1. `.lm-hero-mesh` is `z-index: 0`, and that is load-bearing.** This is the §13 constraint 1
hazard, relocated. `.lm-hero-grid` is `z-index: 1` and the fixed `.lm-header` is `z-index: 100`;
the canvas is opaque, so at `z-index: auto` it competes with the grid directly and paints over
the "Beauty Clinic" headline, the lead paragraph and both hero buttons. **Do not "tidy" this to
`auto`, and do not raise `.lm-hero-grid` above `1`.**

**2. `display: block` on the canvas is not cosmetic.** A `<canvas>` is `inline` by default,
which puts its baseline gap *inside* `height: 100%` and leaves ~4px of unpainted strip at the
bottom of the hero. Also `width`/`height` are the *attributes* here — `app.js` sets them to the
backing-store size, and CSS `width`/`height: 100%` only size the element's box.

**3. The CSS fallback lives on `.lm-hero`, NOT on `.lm-hero-mesh`.** `app.js` bails by setting
`canvas.style.display = 'none'` if the context cannot be created or the shader will not
compile/link. Whatever paints `.lm-hero` then shows through. Putting the fallback on the canvas
would hide it exactly when it is needed. **Never remove `.lm-hero`'s `background-image`** — it
is also what renders for the first few milliseconds before the shader's first frame, and for
anyone whose browser blocks WebGL outright.

**4. `accentDamp: 0.78` is a measured value, not a taste knob.** The palette is lopsided: five
of six colours are near-identical linen creams, and `#d4af37` has a chroma of **157/255**
against their ~22. With one gaussian per colour at equal weight, whichever blob is nearest owns
the pixel outright, so the gold stops being a tint and becomes a saturated panel painted
across the hero. `u_weight[]` damps each blob by `1 - accentDamp * (chroma_i / peak_chroma)`,
computed from the colours themselves rather than hardcoded by index, so re-paletting cannot
silently reintroduce the problem. Measured: at `accentDamp` 0 the wash peaks at
`rgb(204,172,66)` — essentially flat `#d4af37`. At 0.62 it peaks at `rgb(215,187,94)`. At
**0.78** it peaks at `rgb(217,195,126)`, and 97.7% of the hero background is warm-tinted
(r > b). **Anything below ~0.7 reads as a gold wash rather than warm linen.**

### Lifecycle, and why each part is there

`initHeroMesh()` is homepage-only and no-ops without `#lm-hero-mesh`, matching
`initVideoModal()`'s precedent (§2.3, §10). It is defensive at every step because a shader is
the easiest thing on this site to break:

- **Context creation fails / shader will not compile** → `bail()` hides the canvas; constraint 3
  means the hero still has a complete on-brand background.
- **`prefers-reduced-motion: reduce`** → exactly **one** frame is drawn and the rAF loop never
  starts. This is a *real* suppression, unlike §13's retired "leave the third-party scene
  running" argument — this shader is driven by this page. The query is also re-read on change,
  so toggling the OS setting while the page is open takes effect.
- **Hero scrolled out of view** → an `IntersectionObserver` cancels the loop.
- **Tab hidden** → `visibilitychange` cancels the loop.
- **Context lost by the driver** → `webglcontextlost` calls `preventDefault()` (without it the
  context is gone for good) and nulls the program. `webglcontextrestored` calls the same
  `setup()` that built it originally, rather than reloading the page.
- **Resize while paused** → repaints a single frame, so the canvas never shows a stretched
  stale image.

The backing store is capped at `maxEdge: 1440`. A mesh gradient is pure low-frequency colour,
so a dense store gains nothing and costs a lot to fill; the browser's bilinear upscale is
indistinguishable on a wash this soft and doubles as extra smoothing. On a 1920×1080 display
the canvas backing store is **1440×810**.

### Rules that keep this from regressing

- Keep the six palette colours and the three scalars exactly as listed above. They are the
  brief. Tune `accentDamp` only with §16 constraint 4's measurements in hand.
- Keep `.lm-hero-mesh` as the **first child of `.lm-hero`**, before `.lm-hero-grid`. Order does
  not affect paint (the `z-index` values do), but it keeps the markup readable.
- Keep `pointer-events: none` on the canvas. Every click in the hero belongs to the copy or the
  doctor card, and `elementFromPoint` at the centre of a button must return `A.lm-btn`.
- Keep the canvas `aria-hidden` and give it no `role`/fallback text. It is pure decoration;
  the hero's real `<h1>` is `.visually-hidden` (§10).
- Do **not** move `initHeroMesh()` into a new file. It belongs in `app.js` alongside
  `initVideoModal()`: homepage-only behaviour that no-ops when its markup is absent.
- `.lm-hero`'s `overflow: hidden` is still needed — it is what stops the `.lm-bottom-bar`'s
  sibling sections from bleeding, and the canvas relies on the section to clip it.

### Verified for `v1.0.8` (Chrome headless via CDP, `localhost:8000`)

- **Shader compiles and links.** Console is clean at every viewport — no `console.warn` from
  `buildProgram()`, and `display` computes to `block` rather than `none`, which can only happen
  if `setup()` returned `true`.
- **Layout:** `position: absolute`, `z-index: 0`, `pointer-events: none`, `display: block`, and
  sized to the full section (1440×900 → `1440×900`; 360×740 → `360×1032`) at all seven
  viewports (1920×1080 → 360×740). `.lm-hero-grid` stays `z-index: 1`, `.lm-header` `100`.
- **Paint order:** the element at the centre of **both** buttons is `A.lm-btn` at all seven
  viewports. The copy and the buttons float above the wash.
- **Buttons stacked:** "Book Appointment" is above "Smart Mirror" at all seven viewports
  (`stacked: true`), and both share an identical `left` (`aligned: true`) — `align-items:
  flex-start`, not `stretch`.
- **Columns level and pushed down:** at ≥1000px both columns report an identical `top` and an
  identical `padding-top` (37.8px @1920, 31.5px @1440, 28px @1180). Gap from the nav bar's
  bottom edge to the top of the wordmark: **317px** @1920×1080, 225px @1440×900, 186px @1180.
  Under 1000px `.lm-hero-doctors`' padding correctly drops to `0px` (single-column stack — it
  is no longer the first thing in the section).
- **No top clipping from the centring:** `overflowTop: 0` at all seven viewports. This is the
  reason `.lm-hero-grid` uses `margin-block: auto` and **not** `align-content: center` — see
  constraint 5 below.
- **Pixels (this is the part §13 could not do).** The shader's output *does* composite into
  `Page.captureScreenshot` under the same `--disable-gpu` headless flag, because SwiftShader is
  rendering a shader this page compiled itself. Decoding three screenshots ~2.5s apart at
  1440×900 and sampling six open-background points:

  | probe | t≈3.2s | t≈5.7s | t≈8.2s |
  |---|---|---|---|
  | (650, 90) | `rgb(220,201,148)` | `rgb(217,195,126)` | `rgb(220,200,143)` |
  | (1000, 200) | `rgb(238,228,206)` | `rgb(231,214,164)` | `rgb(225,201,128)` |
  | (1250, 110) | `rgb(237,228,205)` | `rgb(233,219,181)` | `rgb(228,209,154)` |

  Range across all six probes: `rgb(217,195,126)` → `rgb(239,231,211)`. Chroma 28–97. Max
  frame-to-frame drift over 5s: **118** (summed RGB delta) — visible, continuous, ambient.
  **`near-black` pixels in the background band: 0.** `warm` (r > b) pixels: **97.7%**.
- **Reduced motion:** total summed RGB delta across the background band over 2s is **exactly
  0** — the wash is genuinely frozen, not merely slow.
- Pre-flight checks 1–8 pass (17 JSON blocks, 3,969 local refs with 0 missing, 63/63 gallery
  alignment, 230/230 `lang="en" dir="ltr"`, 0 inline scripts or `<style>` blocks).
  Check 9 still fails by design (§7).
- `node --check app.js` passes.

### Constraint 5, added after the first implementation: never `align-content: center` here

The obvious way to vertically centre the two columns in the hero is `align-content: center` on
`.lm-hero`. **Do not do this.** `.lm-hero` carries `overflow: hidden`, and a centred grid row
that is *taller* than its container overflows equally in both directions — the top half lands
outside the section and is clipped away.

This is not theoretical: with the buttons stacked (§16) and the hero's top padding raised, the
hero measures **1111px at a 740px viewport** (and 1032px at 360×740), so the content genuinely
does exceed `100svh` on phones. `.lm-hero-grid` therefore uses **`margin-block: auto`**, which
centres when there is slack and collapses to `0` when there is none — verified
`overflowTop: 0` at all seven viewports, including the two where the hero overflows.

### Two consequences worth knowing before the next change

1. **The hero is now taller than the fold on phones.** `min-height` is `100svh`, not `height`,
   so the section grows: 1032px at 360×740, 1068px at 414×896, 1111px at 999×740. This is the
   arithmetic consequence of stacking the buttons (~+62px) and raising the hero's top padding
   (~+56px). It is correct behaviour for a scrolling page, but if a design later demands the
   doctor card be visible without scrolling on a 740px phone, the lever is `.lm-hero`'s
   `padding-block` top value, not the button stack.
2. **The 9–27px `scrollWidth` overflow at ≤1180px is pre-existing and unrelated.** The offenders
   are all `.ga-row` / `.ga-group` / `.ga-thumb` — the gallery marquee's horizontal strip (§2.5).
   No `.lm-hero*` element is among them, and `git diff` confirms neither the marquee CSS nor
   `initMarqueeDrag()` was touched in `v1.0.8`.

> ⚠️ **Still needs a human eye:** the numbers above prove the wash renders, animates, stays
> inside the palette, is warm, and never goes black. They cannot say whether the *composition*
> is right — i.e. whether the warm zone sits where you want it relative to the wordmark. Open
> the page and look at it.

---

## 17. `v1.0.9` — page-wide mesh, glass navbar + new logo, homepage coverflow

Three changes, one version. `style.css` 1.0.8 → **1.0.10**, `app.js` 1.0.6 → **1.0.7**,
bumped on all 11 main pages (the only pages that load them — the other 219 files reference
neither asset). The CSS took a second bump during review: see the logo-size trap in §17.4, which
no amount of reading the source would have caught. Architecture stays as §2 states it: vanilla,
no build step, no framework, no new dependency.

### 17.1 The mesh is now page-wide, and is injected rather than authored

§16 described a canvas scoped to the hero. It is now the site background. Three changes, and
all three are load-bearing:

- **`.lm-hero-mesh` → `.lm-bg-mesh`, `absolute` → `fixed`, `z-index: 0` → `-1`.** A wash that
  only fills the hero reads as a section; the same wash fixed behind the whole page reads as a
  background. `fixed` + `z-index: -1` means it never scrolls and never covers content.
- **`initHeroMesh()` → `initPageMesh()`, and it creates its own canvas.** It inserts
  `<canvas id="lm-bg-mesh">` as the **first element child of `<body>`**. This is why §6's
  mesh check now asserts that parentage: `body::before` is a pseudo-element, so it is always
  painted first, and the canvas lands immediately after it — which is the only reason the
  shader wins over the CSS fallback it hides on success. Do not "tidy" the canvas into
  `index.html`; that would mean 11 near-identical copies to keep in sync, and it is what made
  this awkward the first time.
- **The fallback moved with it, from `.lm-hero` to `body::before`.** This is not cosmetic.
  `.lm-hero` carried `background-color: #fdfbf7`, and an opaque first viewport would have
  hidden the entire page-wide canvas for the entire first screenful. `.lm-hero` now paints
  nothing of its own. If you ever give `.lm-hero` a background back, the wash disappears behind
  it and nothing warns you.

Parameters are retuned, not just relocated: `distortion` 0.6 → **0.5**, `swirl` 0.4 → **0.3**,
`speed` 0.3 → **0.15**. Same six colours, same `accentDamp: 0.78`, same `maxEdge: 1440`. The
softer numbers are because the wash is now on screen for the length of a whole page rather than
one viewport: at the hero's settings it became noticeable and tiring within a few seconds of
scrolling. Every lifecycle guarantee in §16 still holds — reduced-motion freeze, `bail()` to
`display: none`, visibility pausing, `webglcontextlost` / `webglcontextrestored`. One was
**removed**: the `IntersectionObserver`. A fixed full-viewport canvas is on screen by
definition, so it reported intersecting once and then never again.

### 17.2 The language chip is gone

`.lm-lang` and its `<span class="lm-lang">EN</span>` are deleted from `style.css` and
`index.html`. There is no second localisation to switch to — the control had already been
reduced to an inert `<span>` with no `href`, no `hreflang` and no handler (§12). It sat between
the nav links and the Contact CTA and, being a filled gold circle next to a filled gold button,
read as interactive while doing nothing. `<html lang="en">` is what assistive technology
actually uses; the chip was decoration.

⚠️ `index.html` is the **only** page that had it. The other 10 main pages still use the old
`.site-header` / `.brand` navbar and never carried `.lm-*` at all — so "remove the chip from
the navbar" is a one-file change here, and it is easy to waste time looking for ten.

### 17.3 Glassmorphic navbar

`.lm-nav` was already translucent with `backdrop-filter`; it is now built to actually read as
glass. Four things, all of which are needed together:

1. `blur(26px) saturate(1.85)` on a `46%` `--card` fill (was `18px` / `1.5` on `70%`).
   `saturate()` is not decoration — the wash behind the bar is warm and low-contrast, and
   without it the blur just greys the page out.
2. An `inset 0 1px 0 #ffffffb3` top highlight. This is the lit top edge of a glass slab, and
   it is what gives the pill thickness.
3. A wide, low-opacity drop shadow (`0 12px 40px` at `8%`) plus a tighter `0 2px 8px` at `5%`
   underneath, so the bar floats clear instead of lying flat on a linen page.
4. `@supports not (backdrop-filter…)` restoring a `94%` fill. An unsupported
   `backdrop-filter` is dropped *wholesale*, not partially applied, and a 46% fill with no blur
   is a transparent bar.

Scrolled state firms the fill to `82%` and deepens the blur to `32px`: once content is passing
under the bar it has to stay legible. Keeping the rest-state fill lighter than the scrolled one
is deliberate — an opaque-from-the-start bar gives the effect away immediately, whereas one
that firms up on scroll shows the refraction on the first glance at the hero.

All fills stay in `color-mix(…, var(--card), transparent)` rather than `rgba()` literals, so
the bar re-tints itself under a dark scheme instead of staying linen-white.

### 17.4 New logo

`assets/icons/logo.svg` is replaced: a 40×40 gold-gradient leaf inside a ring, single stroke
weight, `fill-opacity .13` on the leaf, one gradient (`#lm-gold`, `#EFD98C → #D4AF37 → #9C7B22`),
1.1 KB.

⚠️ **`.lm-brand img { width: 40px; height: 40px }` is the rule that decides the rendered size.**
The `width="40" height="40"` attributes in `index.html` were bumped from `39` at the same time, but
they are *not* what sizes the logo — CSS wins over presentational attributes, so the attributes only
set the intrinsic ratio before the stylesheet arrives. The first pass of this work updated the HTML
and left the CSS rule at `34px`, so the new logo silently rendered at 34×34 for a full review cycle.
**A headless-browser check is the only thing that caught it**: `naturalWidth` was `40` while
`getBoundingClientRect()` was `34`. If you resize the logo again, change all three and assert the
*rendered* box, not `naturalWidth`.

⚠️ Still only on the homepage (`localLogo=1` across the 11). The footer wordmark and icon, and
the old `.brand` logo on the other 10 pages, all point at `lemonclinic.org/images/logo/*.svg`
— **remote files this repo cannot edit**. "Redesign the logo across the project" therefore
means the local asset plus the homepage nav. Changing the rest needs the production media
library.

### 17.5 Homepage coverflow replaces the cases marquee

The before/after cases were three `.ga-row`s of the **same ten cards repeated 3×** (30 `.ga-thumb`,
30 image requests for 10 unique images), scrolling continuously. Now: ten unique `.cf-item`s in
a coverflow, autoplaying at **3500 ms**. Total homepage characters dropped **195,437 → 182,021**
and local refs **3,969 → 3,949**.

Markup: `.cf[data-cf] > .cf-track > .cf-item > .cf-card`, each card carrying the photo plus a
`.cf-doc` (avatar + surname) and a `.cf-tag` (treatment name). **No Prev/Next buttons** — the
carousel advances on its own, and is driven by drag, click and arrow keys instead.

Interaction contract, all verified in `cf-test.js`:

| Input | Result |
|---|---|
| autoplay | one step every 3500 ms, wrapping |
| `pointerenter` / `focusin` / hidden tab | autoplay **stops** |
| `pointerleave` / `focusout` / visible tab | autoplay **resumes** |
| click a side card | brings it to the centre, does not navigate |
| click the centred card | follows the link |
| drag < 12px | treated as a click |
| drag 12–40px | no step |
| drag > 40px | one step, in the direction of travel |
| `←` / `→` | previous / next |
| `Home` / `End` | first / last |
| `prefers-reduced-motion` | **no autoplay**, carousel still fully usable |

Four constraints that are easy to break:

1. **`--d` is the signed distance from the active card, folded around the ring.**
   `ringDelta()` returns the *shortest* signed distance, so advancing off the end wraps to the
   first card without the stack flying backwards across all ten. Every visual property —
   `translateX`, `rotateY`, `scale`, `opacity`, `saturate` — is a `calc()` on `--d` or `--ad`
   (its unsigned form; CSS has no portable `abs()` for a custom property). app.js therefore
   **never touches `style.transform`**, and the transition lives on `.cf-item`.
2. **`z-index` is set from JS, not in CSS.** A dropped `calc()` in `z-index` would silently
   leave all ten cards in DOM order — the tenth case painting over the active one. Assert
   `item.style.zIndex` in the harness if you touch `render()`.
3. **Roving `tabindex`, with exactly one `tabindex="0"`.** Without it, Tab walks through ten
   cards before reaching "See all cases". The active card also carries `aria-current="true"`.
   Note the cards are **real links with real `aria-label`s** and there are no `aria-hidden`
   clones — unlike the old marquee, which needed `tabindex="-1"` on its two duplicate groups.
4. **Cards are `aspect-ratio: 5 / 4`, which is the source photos' own ratio** (640×512), and
   `.cf-track`'s height is the same expression so the two can never drift apart. This is
   deliberate: these are before/after *comparisons*, and cropping the frame to a portrait card
   would cut away the part of the face the visitor came to look at. If you change one, change
   both, and re-check that the images are not being cropped.

Reduced motion stops autoplay but does **not** disable the carousel — a carousel that never
advanced would hide nine of the ten cases. Drag, click and arrow keys all still work; only the
slide becomes a snap.

### 17.6 What this changed about the old gallery marquee

`.ga-marquee` is **still on the page** — but it is now `.ga-marquee.team-marquee`, the doctors
row further down. `initMarqueeDrag()` binds to `.ga-marquee` with no scoping, so it now drives
the team carousel instead of the cases, which is the correct outcome. It and the drag-inertia
code are **untouched**.

`.ga-thumb`, `.ga-doc` and `.ga-cap` had no other users anywhere in the repo (verified across all
11 pages) and their rules are deleted. `.ga-row` / `.ga-group` / `ga-scroll` are kept — the team
marquee still needs them. Do not delete those with the others.

The "See all cases" arrow was **U+2190 `←`**, pointing back at nothing. It is now **U+2192 `→`**.
The twelve other `←` on the homepage (room links, `tc-more`, blog CTA, doctors CTA, Google
reviews) are a separate convention and were deliberately left alone.

### 17.7 Verified

**Static (no browser):**
- `node --check app.js` clean; CSS braces balanced.
- `initCoverflow()` exercised against a DOM stub — the state machine, including the ring wrap in
  both directions, the drag thresholds, and reduced-motion leaving the carousel usable.
- §6 checks 2, 3, 5, 7 and the new check 10 all pass: 17 JSON blocks / 0 errors; 3,949 local
  refs / 0 missing; `nb-data` 63 / figures 63 / `data-i` 63 / **id-order-mismatch 0** /
  **duplicate-ids 0**; 0 inline executable scripts; 0 inline `<style>`; 0 U+FFFD and 0 mojibake
  markers across all 11 pages.
- No duplicate `id` on the homepage (28 ids). No homepage class left without a CSS rule by this
  change — the three that are (`scan-host`, `f-enamad`, `ic-book-step`) are pre-existing and
  untouched.
- `git diff --check` reports only `face-analysis.html`, whose trailing two spaces are in `HEAD`.

**In a real browser** (headless Chrome 154 over CDP, software WebGL, `localhost:8000`):
- The mesh mounts on **all 11 pages**: `#lm-bg-mesh` is `document.body.firstElementChild`,
  `position: fixed`, `z-index: -1`, `pointer-events: none`, sized to the viewport × DPR.
- The shader genuinely rasterises — luma stdev 21–38 in the top band, warm (`R` > `B`), mean luma
  213–222, never black, and **animating** (frames 1.4 s apart differ). Under
  `prefers-reduced-motion: reduce` the frames are **byte-identical**: frozen.
- `.lm-hero` computes `rgba(0, 0, 0, 0)`; both hero CTAs and the video card are hit-testable on
  top (`elementFromPoint` returns `A.lm-btn` / the card's own `IMG`, never the canvas).
- Glass is real: computed `backdrop-filter: blur(26px) saturate(1.85)`, and blanking it changes the
  nav's pixels (summed |Δ| ≈ 22,000) — i.e. the bar is genuinely refracting the wash behind it.
- The logo renders **40×40** with `naturalWidth` 40 and no aspect distortion. *(This is the check
  that caught the 34px CSS bug in §17.4.)*
- Coverflow, measured at 360 / 768 / 1440: 10 items, all the same layout box, **every card exactly
  5:4** in layout, `--d` running 0,1,2,3,4,5,−4,−3,−2,−1 around the ring, opacity 1.00 → 0.15 with
  distance, `z-index` = `10 − |d|` (correctly distance-based, not DOM order), one `tabindex="0"`,
  one `aria-current`, 10/10 labelled real links, all 20 remote images (10 case photos + 10 avatars
  from 3 doctors) decoded.
- Live interaction, autoplay off via reduced motion so only a gesture can move it: mouse-drag left
  120px → **+1**, right 120px → **−1**, a 30px drag → **no step**, and the same with real touch
  events. `is-grabbing` is set mid-drag. Hover pauses (8 s, zero movement), pointer-out resumes,
  autoplay steps +1 only and never skips or reverses, arrows/Home/End move one step, and a drag
  does **not** navigate away from the page.
- No page exceptions at 360, 414, 768, 1024, 1280, 1440, 1920. The navbar fits the viewport at
  768 and above.
- ⚠️ **There *is* still a 27px horizontal overflow at 360px and 18px at 768px, and it is not
  ours.** Traced to `.room-copy` in the rooms section: 367px of content in a 319px box, which
  propagates `.room` → `.cluster` → `main` → document. Those rules are **byte-identical to `HEAD`**
  and no diff line touches that section, so this is the same pre-existing 9–27px band §12
  recorded. Hiding `.cf`, `.cf-track`, `.team-marquee`, `.ga-marquee`, `.ga-row`, `.ga-group` and
  `.lm-hero` in turn leaves it at 27px. The coverflow contributes **zero**: `UL.cf-track` holds
  726px of fanned content and is correctly clipped by its own `overflow: hidden`.
  *The earlier "0px at 360" reading was a measurement artefact — taken before the remote
  `lemonclinic.org` images had loaded, so the rooms section had no intrinsic width yet.*
- ⚠️ **Consequence worth knowing: the overflow makes the navbar look like it overflows too.** At
  360px `window.innerWidth` is **387** while `documentElement.clientWidth` is 360 — the layout
  viewport widens to absorb the document's horizontal overflow, and `position: fixed` chrome sizes
  to the layout viewport, so `.lm-header` spans `11…376` and `.lm-nav` ends at 365.
  **Proved not to be the logo**: forcing the logo back to `34px` leaves `.lm-nav`'s right edge at
  **exactly the same pixel** (365) at both 360 and 414. Fixing `.room-copy` fixes the navbar too.
  Fixing it is a separate job in a section nobody has touched.
- The `←` → `→` CTA arrow, the 10 unique case photos, the team marquee and the video modal trigger
  all confirmed present in the rendered DOM.

> ⚠️ **Two things a machine still cannot answer.** Both are judgement calls about *composition*,
> not correctness, and neither is answerable from pixels:
> 1. Whether the fan spacing and card size are the ones you want. Measured facts: `--cf-step` is
>    `clamp(84px, 27vw, 128px)` on phones and `clamp(112px, 13vw, 168px)` above; cards are
>    `clamp(214px, 62vw, 300px)`; `.cf-track` is `overflow: hidden`, so on a 360px screen the five
>    cards beyond ±2 steps fall outside the clip and only ~5 of 10 are on screen at once. That is
>    how a coverflow behaves, but if you want more of the stack visible on a phone, `--cf-step`
>    and the card `clamp()` are the two levers — and they are coupled to the track's height
>    expression, so change both.
> 2. Whether the wash's warm zone sits where you want it relative to the wordmark, and whether the
>    new logo's weight feels right against the type.
>
> Also still open, unchanged: `assets/` is untracked (§6 check 9, §7) and will 404 in production,
> and `Frame 4.jpg` has never been opened in any session.

---

## 18. `v1.0.11` — inverted-perspective coverflow + navbar synced across all 11 pages

`style.css` 1.0.10 → **1.0.11**, bumped on all 11 main pages. `app.js` **unchanged** at 1.0.7 —
every behaviour this release needed was already there (3500ms `COVERFLOW_INTERVAL`, ring wrap,
drag, keyboard, reduced-motion). This was a geometry-and-consistency release, not a behaviour one.

### 18.1 The three constraints, all coupled

1. **The card size is now the ACTIVE card's size, not every card's.** `--cf-card-w` was
   introduced on `.cf` and is read by *both* `.cf-track`'s height and `.cf-item`'s width. Those two
   were separate `clamp()` literals before and had to be changed together; deriving both from one
   custom property is what makes them impossible to desync. Side cards are laid out at the same size
   and then pushed back along Z and scaled down, so only the centre is full size.
2. **`62vw` is the load-bearing number.** It caps the card at 62% of the viewport, which is the
   reason the centre card fits the track at *every* width with no horizontal overflow of its own.
   Changing it changes the whole layout.
3. **Transform order is the whole trick.** `translateZ` must be listed *after* `rotateY`. Reading a
   transform list left to right, the innermost op applies first, so `scale`/`rotateY` happen in the
   card's own frame while `translateZ` is still in the parent's unrotated frame — which is what makes
   side cards recede *straight back* instead of swinging sideways along their own rotation.

```
transform: translate(-50%,0) translateX(d * step)
           translateZ(ad * -170px) rotateY(d * -44deg) scale(1 - ad * .1)
```

### 18.2 The `reveal-s` trap — this one is a genuine bug class

The `.cf` root also carried `reveal-s`, a scroll-linked `animation-timeline: view()` **scale**
(`@keyframes rv-scale { from { transform: scale(.94) } to { transform: none } }`). Consequences:

- The card rendered **588×470, not 625×500** — the animation's `from` state is `scale(.94)`, and a
  scroll-timeline animation holds its resolved value, so the hero card was permanently 6% undersized.
- Worse, it was a **2D transform on the container of a 3D scene**, squashing the entire perspective
  fan rather than just the cards.
- Caught only by measuring, not reading: `getBoundingClientRect()` on the active card returned
  588×470 while the track computed 500. See §18.5 for the probe that isolates it.

**Rule: never put a `reveal-*` class on an element that establishes a `perspective` for its
children.** The reveal transforms and the carousel transforms are different coordinate systems.

### 18.3 Side cards rotate INWARD — verified from the matrix, not from the sign

The `-1` on `rotateY(d * var(--cf-rotate) * -1)` looks wrong at a glance. It is correct. Rather than
reason about it, §18.5 computes camera-space Z for each side card's inner vs outer edge from the
real computed `matrix3d`:

| d | inner edge | Z(inner) | Z(outer) | magnification | verdict |
|---|---|---|---|---|---|
| −1 | RIGHT | −387.1 | **+47.1** | 0.805 / **1.030** | INWARD |
| +1 | LEFT | **+47.1** | −387.1 | **1.030** / 0.805 | INWARD |

The inner edge is nearer the viewer on both sides, so both cards angle toward the centre. If you ever
flip that sign, re-run this check — the table, not the arithmetic, is the source of truth.

### 18.4 Navbar sync is CSS-only, and why that was the right call

All 11 pages already share `id="site-header"`, the same drawer markup, and `app.js`'s `.scrolled`
toggle. Only the homepage has `.lm-*` classes; the other ten carry `.site-header` / `.wrap.bar`.
Rewriting ten files to copy the homepage markup would have been the slower, riskier route and would
have put 11 files in the diff for a styling change. Instead, the **existing secondary markup was
restyled to be the same pill**: `.site-header` becomes the fixed floating container and
`.site-header > .bar` carries the glass.

One non-obvious dependency: `body:has(main:not(.hero-overlap)) .site-header` painted a solid
full-bleed bar on every secondary page (the homepage's `main` has `.hero-overlap` and escapes it).
That rule had to be neutralised or the opaque bar shows through the translucent pill.

Both bars now measure 58–59px tall, 1283px wide at 1440, `border-radius: 999px`, identical
`color(srgb 0.956863 0.937255 0.894118 / 0.46)`, identical `blur(26px) saturate(1.85)`, 40px logo,
38px CTA. The mega-menu, the phone number and the booking CTA are all preserved — they are
functionality, not decoration. **If you change the `.lm-nav` glass, change `.site-header > .bar`
in the same commit**; the two blocks are duplicated on purpose and will drift otherwise.

### 18.5 Two measurement traps that produced false failures

Worth recording because both initially read as code bugs:

- **Autoplay must be read from `aria-label`, not `--d`.** The active card's `--d` is *always* `0` —
  it is the centred card — so polling it reports "autoplay broken" on a perfectly working carousel.
  Poll `.cf-item.is-active .cf-card`'s `aria-label` instead.
- **Overflow probes must be clipping-aware.** `.cf-item`s extend well past the viewport by design and
  are correctly clipped by `.cf-track { overflow: hidden }`. A naive "right > clientWidth" sweep flags
  all of them and looks like a 200px regression. Skip elements inside any clipping ancestor — and
  confirm by hiding `.cf` and checking `scrollWidth` is unchanged (it is).

Also: `.cf-meta`'s `padding-bottom` is `.9rem`, sized against the **taller** of the two pills
(`.cf-doc` 39.3px from the 36px avatar, vs `.cf-tag` 34px). At `.8rem` the row overflowed its content
box by ~1px. Invisible, but it is why the value is `.9rem` and not a rounder number.

### 18.6 Verified for `v1.0.11`

**Static:** `node --check app.js` clean; CSS braces 1292/1292; 0 U+FFFD across all 11 pages;
all 11 carry `style.css?v=1.0.11` / `app.js?v=1.0.7`.

**Measured geometry** (headless Chrome 154 over CDP, `localhost:8000`, settled — not mid-transition):

| viewport | centre card | track | ratio |
|---|---|---|---|
| 1920 | 625×500 | 500 | 1.00 |
| 1440 | **625×500** | 500 | 1.00 |
| 1280 | 625×500 | 500 | 1.00 |
| 1024 | 625×500 | 500 | 1.00 |
| 768 | 476×381 | 381 | 1.00 |
| 360 | 223×179 | 179 | 1.00 |

**500px on desktop is inside the 480–520px brief.** The root's transform is `none` at every width,
confirming §18.2.

**Behaviour:** autoplay advances every ~3.5s (cases observed changing at the right cadence, never
skipping or reversing); pauses on hover and resumes on pointer-out; all 10 cases reachable with
wraparound; both pills inside the card, inside the `.cf-meta` content box, sharing a row, not
colliding. All 11 pages pass the navbar parity check; at 360 the burger is visible, the desktop nav
is hidden, the pill fits the viewport and the drawer opens.

⚠️ **The pre-existing overflow is unchanged and still not ours** — 18px at 768, 27px at 360, from the
same `.room-copy` rules byte-identical to `HEAD` (§17.7). `scrollWidth` is **identical** with
`.cf` hidden, which is the clean way to show the coverflow contributes zero.

⚠️ **Not verified:** screenshots were captured to `%TEMP%\opencode\shots\v11-*.png` but this model
cannot read images, so composition was confirmed by measurement only. **A human should look at
`v11-cf-1440.png` and `v11-nav-laser.png` before shipping** — specifically whether 625px feels
right at 1440, and whether the mega-menu still reads well inside the narrower pill.

> Cumulative autoplay-intent (two pause sources active at once, e.g. hover *and* a hidden tab) is
> still only tested one source at a time.