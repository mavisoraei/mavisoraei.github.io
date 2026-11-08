# Autopilot summary — October 2026

Branch: `autopilot-oct26` · Queue: T00 → T15b → T22 → T23 → T24 → T30a → T30b → T23b → T27 → T28 → T26 → T25 → T29 → T31 → T99

Status: RUNNING

## Task log

| Task | Status | Commit | Notes |
|---|---|---|---|
| T00 | DONE | 6525986 | Smoke harness + baseline created. |
| T15b | DONE | ae22fbf | Completed before autopilot session. |
| T22 | DONE | 77b5f9c | Outlined glass pill restored on section CTAs. |
| T23 | DONE | bb59c84 | Warm doctor photos, centred card text, empty licence hidden. |
| T24 | DONE | 9203f38 | Shared FAQ restyled as centred glass cards. |
| T30a | DONE | 31de0af | Iran-specific localization inventory (analysis only). |
| T30b | DONE | e9c7802 | Demo localization, sample USD prices, JSON-LD cleanup, noindex. |
| T23b | DONE | e72cee4 | `doctors.html` cards warmed and centred; equal photo/copy heights. |
| T27 | DONE | 6660579 | Laser/facial body split into 300px label + 760px reading column. |
| T28 | DONE | 279e8f3 | Pricing top rebuilt; sticky chips; 15 glass price cards; CTA band. |

## T22 — Outlined glass pill for section CTAs
- Mapped 14 non-dark `.btn-pill` links to `.btn-secondary` across index, contact, laser, facial, services, prices.
- Removed `.btn-pill.arrow-link` from the button system's text variant; it was the rule that had flattened these pills.
- Final values: 48px high, `padding-inline: 28px`, border `rgba(176,143,86,.45)`, bg `rgba(255,255,255,.5)`, radius `999px`, text `var(--btn-espresso)`.
- Hover: bg `rgba(255,255,255,.8)`, border `rgba(176,143,86,.75)`, arrow slides 3px. Active scale `.98`, focus-visible ring inherited.
- Dark `.btn-pill--dark` primary buttons untouched. `style.css` cache bumped to `1.0.33` on 214 pages.
- Verified computed style on `.price-cta` (48px / 28px / 0.5 white / champagne border / 999px / centred).

## T30a — Localization inventory
- Report `_tools/reports/localization-inventory.md`; full unique hotlink list `_tools/reports/localization-hotlinks.csv`.
- 31 files scanned (13 pages, 9 CSS, 8 JS, `data/availability.json`); 17 had matches.
- Key totals: Tehran 308, West Tehran 174, Chitgar 103, District 22 66, Kharazi 24, Ardestani 22, Parseh 31, Iranian 28, Neshan 220, Balad 76, +98 57, 021 41, 0912 13, 090 12, TTAC 12, Enamad 36, licence text 12, 1405 12, price index 26, installment 49, payment apps 78, area links 51.
- 518 unique hotlinked `lemonclinic.org` image URLs (1354 references); logo/map/mascot/consultant listed individually, the rest grouped by directory.
- Persian/Arabic-Indic digits: 0. `data/availability.json`: 0 matches.
- No site file changed; replacement plan is at the end of the report.

## T30b — Demo localization
- Added `site.config.json` with demo values: Lemon, Istanbul, Nisantasi, Turkiye; `12 Example Street, Nisantasi, Istanbul`; `+90 212 000 00 00`; WhatsApp `+90 500 000 00 00`; `hello@example.com`; Monday-Saturday 10:00-19:00; `Europe/Istanbul`; USD.
- Localized 13 built pages plus `booking.js`, `contact-modal.js`, `ai-app.js` and the `style.css` locale comment: places, address, phones, WhatsApp, hours, map labels, meta, JSON-LD, booking placeholders, timezone and weekdays.
- Prices: `data/sample-prices.json` holds 93 explicit sample USD amounts, preserving relative order. `_tools/reports/localization-map.md` records the mapping and 271 original visible occurrences; no currency conversion is implied.
- Removed price-index, instalment/payment-app and area-page links, Neshan/Balad pills, TTAC/Enamad seals, the Tehran licence text and `1405`. Replaced the home/contact map image with a neutral CSS/inline-SVG placeholder.
- Remaining hotlinked Lemon images are intentionally left: 512 unique URLs (509 under `/images/`, 1 mascot, 2 root icons), listed in `_tools/reports/localization-hotlinks-after.csv`.
- JSON-LD: removed `Offer`, `AggregateOffer`, `hasOfferCatalog` and price keys; sanitized `fa-IR`, Tehran addresses, Iranian `sameAs` and `IRR`. All 18 JSON-LD blocks parse.
- Added `<meta name="robots" content="noindex, nofollow">` to all 13 built pages.
- After-scan in scope: 0 Toman, Tehran/West Tehran, Chitgar, District 22, Kharazi, Ardestani, Parseh, Iran Mall/Iranian, Neshan/Balad, +98/021/0912/090, Tehran time, TTAC, Enamad, licence text, 1405, price index, payment apps or removed-page links. Four legacy `.price-installment` CSS selectors and five generic `dir="rtl"` CSS rules remain (unused by the 13 pages).
- Smoke: **SMOKE PASS**; `index.html` still has the pre-existing 2 visible h1 elements, left for T31.

## T23b — Doctors page cards
- `doctors.html` only uses the `spread-photo` / `spread-copy` system; `.spread-photo` now has the same `linear-gradient(180deg,#f6eddc 0%,#ead9bb 100%)` as T23 and its image uses `mix-blend-mode: multiply`.
- `.spread-copy`, headings, role, hours and credentials are centred; `.cred` is a centred grid with 46ch items, and `.role:empty`, `.doc-hours-line:empty` and `.cred li:empty` are hidden.
- `.spread` and both columns use `align-self: stretch`; measured at 1440px with reveal transforms disabled, photo and copy heights matched in all four rows (601/601, 624/624, 853/853, 601/601).
- Kept the alternating `spread-rev` layout, all links and the existing photo sources. Cache bump: `doctors.html` `style.css?v=1.0.36`.
- Verified with `_tools/check-t23b.js`; smoke **PASS**.

## T27 — Service body editorial split
- Removed the duplicate `.svc-lead` on `laser.html`; `facial.html`'s lead also repeated the hero summary, so it was removed too. The body intro paragraph remains on both pages, so no unique copy was lost.
- `_tools/split-service-body.js` grouped each H2 and its following siblings into `.svc-sec` with `.svc-sec__label` + `.svc-sec__content`; the pre-H2 intro became `.svc-sec--intro` so its text shares the reading-column edge.
- `_tools/verify-t27.js` confirms body text, ids and hrefs are unchanged (laser 7331/7331 chars, facial 2786/2786).
- At 900px+: `grid-template-columns: minmax(180px, 300px) minmax(0, 760px)`, space-between, 300px label at container left and 760px reading column at container right. `.svc-sec__content` uses `display: contents`; text children sit on `grid-column: 2`, tables/wide figures/.svc-wide span `1 / -1`. Below 900px it is a block layout at the container edge.
- Measured at 1440px: before body 760px at x=340..1100; after body 1160px at x=140..1300, H2 x=140, text x=540..1300, wide figure x=140..1300. At 390px both before and after are 350px at x=20..370.
- `.laser-pack img` resets `max-width` so the image itself, not only the figure box, spans the 1160px container. Cache bump: `inner-unify.css?v=1.2.3` on laser and facial.
- Optional sticky H2 left off to avoid overlap with the sticky TOC bar. Smoke **PASS**. Local screenshots: `_tools/reports/t27-laser.png`, `_tools/reports/t27-facial.png` (untracked).

## T28 — Pricing page top and glass cards
- Hero is now H1 + one lead line + an "Updated October 2026" pill. The old notes became three compact glass cards: Pricing basis (`#pr-filler-head`), Final quote (`/contact.html`) and Customer Club (`/customer-club.html`); all targets exist.
- The sidebar Quick jump is replaced by the shared `.lm-svc-tocbar` with 15 short chips. Category H2s got `-head` ids so the existing heading observer can set the active chip; the original section ids remain for old anchors.
- All 15 price blocks (14 categories + the cc table) are `glass-card glass-card--panel` panels in a 760px column. `.pr-rows` and `.pr-list` use a 104px price column, tabular numerals, no underline until hover, and a 6% row hover tint.
- Laser tables share a 48/26/26 column split; the dose table keeps its fixed layout. The sample note is rendered once above the cards from the new `site.config.json` `samplePricesNote`.
- Closing CTA band after the FAQ with Book Appointment + Smart Mirror. Cache bump: `inner-unify.css?v=1.2.3` on `prices.html`.
- Verification: `_tools/verify-t28.js` preserves 182 price tokens, 101 non-anchor hrefs, 79 price rows and all 40 old ids. `_tools/check-t28-compact.js` at 1440/390 measured 760px/298px cards, 104px price columns, no overflow, a working active chip, and hover underline/row tint. Smoke **PASS**.
- Local screenshots `_tools/reports/t28-*.png` are untracked.

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

## T26 - Gallery filter panel
- One `glass-card` panel at `--container` width, aligned with the hero and grid; the label column is 88px at every breakpoint.
- Treatment row: 10 chips, all 40px high with 8px gaps in a nowrap scroller; feathered mask at 1200px and below; the active chip keeps the design-system espresso treatment and `aria-pressed`.
- Doctor row: custom trigger plus a listbox popover with 28px avatars and initials fallback; options use `aria-selected`; the trigger updates its avatar and label. The popover flips above the trigger when the space below is too short.
- `63 cases` live count and `Clear filters`; the clear button is hidden until a filter is active, and the side area is right aligned at every width.
- Filtering predicate (`all` / `g:*` / `doc:*`) and hash format (`#g=...`, `#doc=...`) are unchanged; invalid hashes fall back to `all`. The legacy `gallery_new.html` still filters and receives card avatars through a fallback source.
- Verified at 1440/1200/1024/900/768/560/390: panel alignment, one 40px chip row, no page overflow, keyboard Arrow/Home/End/Escape, outside-click close and image-error initials fallback. Smoke **PASS**.
- Local screenshots `_tools/reports/t26-*.png` are untracked.

## T25 - Shared footer redesign
- Old -> new: removed the `f-top` white brand band, the `f-mascot` dark band and the `f-trust` row; the mascot copy now lives in a light glass CTA card (`ft25-cta`) directly above one dark espresso footer.
- CTA card: kicker, title, mascot on the right and two buttons (primary `Book Appointment`, secondary `Smart Mirror`); stacks at <=760px.
- Footer grid: brand column (one logo, 2-line description, 40px social discs) + Services (8 links + All services), Clinic (6), Visit (address, phone, WhatsApp, hours with 16px icons), Company (8 merged club/doctors links). Column gaps 48px, min column 160px.
- Tokens: background `#25211d`; titles 12px/600 uppercase `.14em` `#c8a96d`; links 15px/1.9 `#e9e1d2`; description 14.5px `#b8ae9d`; dividers `rgba(255,255,255,.08)`.
- Contrast on `#25211d`: links **12.30:1**, champagne titles **7.12:1**, muted description **7.29:1**.
- Responsive: 5 columns above 1279px, 2 columns <=1279px, single-column accordions <=640px. The 2-column breakpoint is 1279px rather than 1000px because a 5-column grid with 160px minimums plus 48px gaps cannot fit the 944px container at 1024px.
- Flags: `showLicenseBar`, `showLocalTrustSeals` and `showAreaPages` are off, so the licence line, seals and area links are absent; the licence line is conditional on the flag.
- Pages updated (13): index, laser, facial, services, doctors, blog, areas, gallery, gallery_new, prices, contact, ai-analysis, face-analysis. Implemented once in `_tools/partials/footer.html` and applied with `_tools/apply-footer.js`; `style.css` bumped to `1.0.36`.
- Smoke **PASS** at 1440x900 and 390x844 on all 13 pages. Screenshots `_tools/reports/t25-*.png` are untracked.

## ASSUMPTIONS
- `QUEUE.local.md` is now exported in the project root from the recovered queue text. It is gitignored and intentionally left untracked.
- T30b demo values are placeholders, not a real clinic address or phone number. Sample USD prices are illustrative and must not be treated as a currency conversion.
- The 13 built pages are marked `<meta name="robots" content="noindex, nofollow">` because the demo values and sample prices must not be indexed.
- T30b removed JSON-LD `Offer`/`AggregateOffer` blocks rather than publishing sample prices in structured data.
- `smoke.js` treats a changed h1 count, a new console/page error, a new failed same-origin request, or a new overflow offender as a NEW problem. Off-site request failures are reported but not compared, because hotlinked `lemonclinic.org` assets time out intermittently. Pre-existing keys are ignored.
- T28 keeps the old price category section ids and adds `-head` ids to their H2s so the shared chip bar's heading observer can track them. The sample note is a static mirror of `site.config.json` `samplePricesNote`; this static page has no runtime config loader.
- T26 keeps the existing single-active-filter behaviour (treatment or doctor) and the old hash format; the doctor control is a custom listbox popover, not a native select.
- T26 turns the treatment row into a horizontal scroller at all widths and feathers it at 1200px and below; the 88px label column is retained on mobile by design.
- T26 uses initials for missing or broken doctor photos and flips the doctor popover above the trigger when the viewport below is too short.
- T25 keeps the footer's small accordion/year script inline in the shared partial, matching the inline `[data-year]` script already present on every built page; it is not added to `app.js` to avoid a second year handler and an `app.js` cache bump.
- T25's 2-column breakpoint is 1279px, not the literal 1000px, because the 5-column grid cannot fit the 944px container at 1024px without overflow. At 1000px and below the layout is 2 columns as required.
- T25 leaves the pre-existing `.ga-row` doctor-carousel overflow at 1024px alone; it is unrelated to the footer and is clipped below 1000px.

## BLOCKED
- None.

## Manual review checklist
- [ ] T00: open `_tools/reports/smoke-latest.md`; confirm the pre-existing baseline findings are acceptable.
- [ ] T30b: review the 93 sample USD amounts and page counts in `_tools/reports/localization-map.md`; confirm the demo address/phone/email and the `noindex` decision.
- [ ] T30b: spot-check `index.html`, `contact.html`, `prices.html` and `laser.html` for copy tone and the neutral map placeholder.
- [ ] T23b: open `doctors.html` and confirm the champagne photo backdrop, centred text, hidden empty licence rows and equal card heights.
- [ ] T27: open `laser.html` and `facial.html` at desktop and mobile; confirm the H2 label column, the shared reading-column edge, and that wide figures reach the container edge.
- [ ] T28: open `prices.html` at desktop and mobile; confirm the three note cards, the sticky chip bar, the 760px glass price column, row hover, and the closing CTA band.
- [ ] T26: open `gallery.html` at desktop and mobile; confirm the panel alignment, 40px chips, doctor popover/initials, result count and clear button.
- [ ] T25: open any built page and confirm the glass CTA card, one-logo footer, 4 link columns, accordion at <=640px and the current-year bar.
- [ ] T31: run smoke and confirm `index.html` has exactly one visible `h1`.
