# Autopilot summary — October 2026

Branch: `autopilot-oct26` · Queue: T00 → T15b → T22 → T23 → T24 → T30a → T30b → T27 → T28 → T26 → T25 → T29 → T99

Status: RUNNING

## Task log

| Task | Status | Commit | Notes |
|---|---|---|---|
| T00 | DONE | 6525986 | Smoke harness + baseline created. |
| T15b | DONE | ae22fbf | Completed before autopilot session. |
| T22 | DONE | 77b5f9c | Outlined glass pill restored on section CTAs. |

## T22 — Outlined glass pill for section CTAs
- Mapped 14 non-dark `.btn-pill` links to `.btn-secondary` across index, contact, laser, facial, services, prices.
- Removed `.btn-pill.arrow-link` from the button system's text variant; it was the rule that had flattened these pills.
- Final values: 48px high, `padding-inline: 28px`, border `rgba(176,143,86,.45)`, bg `rgba(255,255,255,.5)`, radius `999px`, text `var(--btn-espresso)`.
- Hover: bg `rgba(255,255,255,.8)`, border `rgba(176,143,86,.75)`, arrow slides 3px. Active scale `.98`, focus-visible ring inherited.
- Dark `.btn-pill--dark` primary buttons untouched. `style.css` cache bumped to `1.0.33` on 214 pages.
- Verified computed style on `.price-cta` (48px / 28px / 0.5 white / champagne border / 999px / centred).

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
