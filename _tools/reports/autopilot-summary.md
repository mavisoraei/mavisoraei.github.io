# Autopilot summary — October 2026

Branch: `autopilot-oct26` · Queue: T00 → T15b → T22 → T23 → T24 → T30a → T30b → T27 → T28 → T26 → T25 → T29 → T99

Status: RUNNING

## Task log

| Task | Status | Commit | Notes |
|---|---|---|---|
| T00 | DONE | 6525986 | Smoke harness + baseline created. |
| T15b | DONE | ae22fbf | Completed before autopilot session. |
| T22 | DONE | 77b5f9c | Outlined glass pill restored on section CTAs. |
| T23 | DONE | bb59c84 | Warm doctor photos, centred card text, empty licence hidden. |
| T24 | DONE | 9203f38 | Shared FAQ restyled as centred glass cards. |

## T22 — Outlined glass pill for section CTAs
- Mapped 14 non-dark `.btn-pill` links to `.btn-secondary` across index, contact, laser, facial, services, prices.
- Removed `.btn-pill.arrow-link` from the button system's text variant; it was the rule that had flattened these pills.
- Final values: 48px high, `padding-inline: 28px`, border `rgba(176,143,86,.45)`, bg `rgba(255,255,255,.5)`, radius `999px`, text `var(--btn-espresso)`.
- Hover: bg `rgba(255,255,255,.8)`, border `rgba(176,143,86,.75)`, arrow slides 3px. Active scale `.98`, focus-visible ring inherited.
- Dark `.btn-pill--dark` primary buttons untouched. `style.css` cache bumped to `1.0.33` on 214 pages.
- Verified computed style on `.price-cta` (48px / 28px / 0.5 white / champagne border / 999px / centred).

## T24 — FAQ restyle
- Shared `.faq`/`.faq-item` rules in `style.css`; `inner-unify.css` overrides removed so inner service pages use the same component.
- Heading and list centred at 820px; card fill `rgba(250,246,238,.72)`, border `rgba(255,255,255,.7)`, radius `20px`, padding `22px 28px 22px 56px` (logical).
- Question `18px/600`, centred; `+`/`−` in a 30px circle at the inline end. Answer `16px/1.8`, `62ch`, muted, centred.
- Open state adds a `2px rgba(176,143,86,.45)` ring; hover lifts 2px; focus-visible outline; reduced-motion disables transitions.
- Smooth open/close uses `::details-content` + `interpolate-size: allow-keywords` with an auto-height fallback.
- Cache bumps: `style.css` 1.0.34 -> 1.0.35 (214 pages), `inner-unify.css` 1.2.0 -> 1.2.2 (11 pages).
- Verified on index/laser/facial/prices: 820px, 18/600 question, 16/1.8 answer, 30px icon, 20px radius.

## T23 — Doctor cards
- Home carousel `.team-card` only; `doctors.html` uses a different card system (`spread-photo` / `docs-*`), so it was left alone.
- Photo container background changed from the flat `color-mix(...)` beige to `linear-gradient(180deg,#f6eddc 0%,#ead9bb 100%)`; `img` now uses `mix-blend-mode: multiply`.
- `.team-meta`, `h3`, `.team-role`, `.team-lic` set to `text-align: center`; `.team-lic:empty` hidden (removes both the row and its top divider).
- Equal heights confirmed: four visible cards measured 427px each; carousel animation and edge fades untouched.
- Could not eyeball faces/green scrubs: the hotlinked doctor photos timed out on the local server, so the specified gradient was kept unchanged.

## T00 — Smoke test harness
- Created `_tools/smoke/smoke.js` (zero dependencies, reuses `_tools/responsive-audit/lib/cdp.js`).
- 13 pages × 1440×900 and 390×844 touch; console/page errors, failed requests, overflow, visible h1 count.
- Baseline `_tools/reports/smoke-baseline.json`; latest `_tools/reports/smoke-latest.md`.
- First run: **SMOKE PASS** (baseline saved; pre-existing issues tolerated).

### Pre-existing findings in baseline (not fixed, per T00)
- `index.html`: 2 visible h1 elements.
- One console error on index/services/doctors/blog/areas/gallery/gallery_new/prices/contact (same message on each page).
- Off-site failed requests on most pages (hotlinked `lemonclinic.org` assets), no failed same-origin requests.

## ASSUMPTIONS
- `QUEUE.local.md` is not present in the repo; the queue text in the session prompt is authoritative.
- `smoke.js` treats a changed h1 count, a new console/page error, a new failed same-origin request, or a new overflow offender as a NEW problem. Off-site request failures are reported but not compared, because hotlinked `lemonclinic.org` assets time out intermittently. Pre-existing keys are ignored.

## BLOCKED
- None.

## Manual review checklist
- [ ] T00: open `_tools/reports/smoke-latest.md`; confirm the pre-existing baseline findings are acceptable.
