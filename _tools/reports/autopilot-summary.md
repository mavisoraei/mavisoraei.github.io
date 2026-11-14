# Autopilot summary — October 2026

Branch: `autopilot-oct26` · Queue: T00 → T15b → T22 → T23 → T24 → T30a → T30b → T23b → T27 → T28 → T26 → T25 → T29 → T31 → T99

Review branch: `review-nov26` · Queue: R01 → R02 → R03 → R04 → R05 → R06 → R07 → R08 → R09 → R10 → R11 → R12 → R13

Status: COMPLETE (autopilot) · RUNNING (review)

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
| T26 | DONE | 2e5b6c0 | Gallery filters rebuilt as one glass panel with a doctor popover. |
| T25 | DONE | 5a19d7c | Shared footer rebuilt with a glass CTA card and four link columns. |
| T29 | DONE | 3ece1b6 | 9 link-space/punctuation fixes; stray "See it." removed. |
| T31 | DONE | db804d2 | Hidden second `h1` demoted; exactly one `h1` on `index.html`. |
| T99 | DONE | this commit | Final smoke, JS syntax, link and localization checks pass; 2 pre-existing JS syntax failures reported. |
| R01 | DONE | 8999f52 | Hover underline removed from card and pill CTAs only. |
| R02 | DONE | 180a4ce | FAQ question/answer left-aligned; title stays centred. |
| R03 | DONE | 393a266 | Home CTA background seamless; 56-112px before the footer. |

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

## T29 - Copy artifacts
Scanned all 13 built pages with `_tools/find-t29.js` for `</a>[A-Za-z]`, `See it.`, `</a> [A-Z]` and the two examples in the queue. The "Prices 2026we" and "Customer Club Beyond this price list" examples no longer exist verbatim; the closest live cases are below.

Applied (9):
- `laser.html`: `Hair Removal Laser Prices 2026</a>we have calculated.` -> `...2026</a> we have calculated.`
- `laser.html`: `Alexandrite or Diode Laser: Which Is Better?</a>we have written.` -> `...</a> we have written.`
- `doctors.html`: `About Us</a> See it.</p>` -> `About Us</a>.</p>` (stray "See it." removed)
- `services.html`: `real cases of the same treatment</a> If you are unsure` -> `...</a>. If you are unsure`
- `doctors.html`: `Dr. Atefeh Norouhmohammadi</a>` + newline + `They are part` -> `...</a>.` + newline + `They are part`
- `doctors.html`: `Case Gallery</a> You can see it by filtering` -> `...</a>. You can see it by filtering`
- `face-analysis.html`: `Spartina Calculator</a> It helps you alongside` -> `...</a>. It helps you alongside`
- `index.html`: `Lemon Medical Aesthetic Clinic</a> In Nisantasi, near` -> `...</a>. In Nisantasi, near`
- `facial.html`: `skin care routine matched to your skin type</a> At home` -> `...</a>. At home`

Ambiguous, left unchanged (doctor name followed by a role caption, so no sentence punctuation is obviously missing):
- `laser.html`, `facial.html`, `services.html`: `Dr. Mostafa Hoosavi</a> General physician, ...`
- `laser.html`, `facial.html`, `services.html`: `Dr. Shadi Ghafouri</a> Dentist, founder and clinic director`
- `doctors.html`: `Dr. Gholizadeh</a> Researcher & Science Writer <a ...>Lemon Magazine</a> and injections ...`

Smoke **PASS**. No other text changed.

## T31 - One h1 on index.html
- The only visible `h1` is now the hero title `h1.lm-hero-v2__title` ("Your beauty, beautifully understood.").
- The second `h1.lm-hero-giant` (the decorative "Beauty Clinic" wordmark, hidden with `sr-only visually-hidden`) was demoted to `<p>` with the same classes and `id="lm-hero-title"`, so its `.lm-hero-giant` styling and the hero's `aria-labelledby` target are unchanged.
- Smoke **PASS**: `index.html` reports `h1=1` at 1440x900 and 390x844.

## T99 - Final verification
| Check | Command | Result |
|---|---|---|
| Smoke (13 pages x 1440/390) | `node _tools/smoke/smoke.js` | **SMOKE PASS**; 0 console errors, 0 page errors, 0 failed same-origin requests, no overflow, `h1=1` on every page |
| JS syntax | `node --check` over 94 JS files | 92 pass; 2 **pre-existing** failures: `extract.js` is UTF-16 (helper, not loaded by the site) and `assets/js/ai-flow.js` redeclares `const url` (dead file, referenced by no HTML) |
| Local links | `node _tools/check-links.js` | 31 files, **3107** local refs, **0** missing, **0** case mismatches |
| JSON-LD | `node _tools/validate-jsonld.js` | **18/18** blocks parse |
| Localization re-search | `node _tools/after-scan.js` | 0 Toman/Persian digits/Tehran/West Tehran/Chitgar/District 22/Kharazi/Ardestani/Parseh/Iran Mall/Iranian/Neshan/Balad/+98/021/0912/090/Tehran time/TTAC/Enamad/licence text/1405/price index/payment apps/area links/`fa-IR` |
| Known CSS leftovers | `node _tools/after-scan.js` | 4 legacy `installment` selectors + 5 generic `dir="rtl"` rules in `style.css` / `inner-unify.css`; unused by the 13 built pages (recorded since T30b) |
| Hotlinked Lemon images | `node _tools/after-scan.js` | 509 unique images remain intentionally hotlinked; listed in `_tools/reports/localization-hotlinks-after.csv` |

All queue tasks are DONE. No task was marked BLOCKED and no destructive command was needed.

## R01 — Button hover underline
- CDP hover sweep over index, laser, facial, doctors, prices, gallery: only two button-like elements gained `text-decoration: underline` — `.case-treat` (case-card CTA) and `.pr-benefit__link` ("Book a consultation →").
- Both now resolve to `text-decoration: none` on `:hover`/`:focus-visible`. No `border-bottom`, animated `::after` line or background-image underline was found on any `.btn*`, `.btn-pill`, `.btn-secondary`, `.lm-cta`, chip or card CTA.
- Body-text links keep their underline (`main p … a` rule untouched).
- Verified at 1440 and 390 with `_tools/r01-verify.js`: `decoration: none`, `border-bottom: 0px none`, `::after: none`.
- Cache queries bumped: `home-sections.css?v=1.0.8`, `inner-unify.css?v=1.2.3`.

## R02 — FAQ alignment
- `.faq-item summary` and `.faq-item p` now use `text-align: start`; the answer block lost `margin-inline: auto` so it starts at the card's text edge.
- The shared `.faq h2` centre rule was being outranked on inner pages by `main h2:not(#_)`; added `main .faq h2:not(#_)` in `inner-unify.css` so the "FAQ" title stays centred everywhere.
- Glass card, `+`/`−` icon, hover lift and `::details-content` animation are unchanged (verified via computed styles).
- Cache queries bumped: `style.css?v=1.0.37`, `inner-unify.css?v=1.2.5`.

## R03 — Pre-footer CTA and footer
- The fixed `#arch-intro-photo` (the lobby photograph, `position: fixed`, `z-index: 0`) was visible behind `.ft25-cta-zone` because that section lives outside `.sheet`. The section is now painted with `--page-end` (`#f6f3ec`, the closing colour of the sheet gradient), so the page background runs unbroken into the footer and the photo cannot show through.
- `.ft25-cta-zone` bottom padding changed from `0` to `clamp(3.5rem, 7vw, 7rem)`: measured gap CTA-card → footer is 101px at 1440 and 56px at 390 on index, laser, facial, prices and doctors.
- Pixel check across the junction at 1440 and 390: both sides of the seam read the same cream (246,243,236), so there is no hard cut.
- Cache query bumped: `style.css?v=1.0.38`.

## ASSUMPTIONS
- `QUEUE.local.md` is now exported in the project root from the recovered queue text. It is gitignored and intentionally left untracked.
- `REVIEW-QUEUE.local.md` holds the review queue verbatim, is gitignored and intentionally left untracked. Review work happens on `review-nov26`.
- R01 treats footer and mega-nav text links as inline text links, so they keep their hover underline; only card CTAs and pill CTAs were changed.
- R02 keeps the 62ch answer measure and the existing card padding; only alignment changed. The `style.css` cache bump touches all 214 HTML files because every page shares it.
- R03 paints the CTA zone with a flat cream (`--page-end`) rather than moving the footer partial inside `.sheet`; the sheet gradient is flat `#f6f3ec` at 100%, so the flat fill is an exact continuation. Pixel sampling used a small PNG decoder in `_tools/r03-verify.js`.
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
- T29 adds a full stop rather than a semicolon or comma where a link ends a sentence and the next clause starts with a capital letter; the "we have calculated / we have written" cases only needed the missing space because the queue gave them as the canonical missing-space examples.
- T29 leaves doctor name + role captions unchanged because "Dr. Name Role" is a valid caption pattern, not a demonstrably missing punctuation mark.
- T31 demotes the second `h1` to a `<p>` rather than an `h2` because it is a decorative, visually hidden wordmark and is not a section heading; keeping the class and id preserves both its styling and the hero's accessible name.

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
- [ ] T29: review the 7 ambiguous doctor name/role captions listed above and decide whether they need punctuation.
- [ ] T31: run smoke and confirm `index.html` has exactly one visible `h1`.
- R04 (this commit) DONE � text/template cleanup: Before labels, doctors copy, local-mirror removed (201 pages), skip-link + nav active; no leftovers.
- R05 (this commit) DONE - sticky label H2 24.5px, laser overview H2; leftover mobile long H2 wraps 3 lines.
- R06 (this commit) DONE - facial supervised card, 14px meta, full-width intro, two-up figures, callout alignment; no leftovers.
- R07 (this commit) DONE - doctors cards left-aligned, unified soft photo shadow, lower sections 24.5px H2/72ch; no leftovers.
- R08 (this commit) DONE - price cards full container axis (144-1296 / 46-344), shared tabular column and hover intact, laser tables fit at 390, dose scroller unchanged. Leftover: none.
- R09 (this commit) DONE - face-analysis article left edge 144px matching the hero cards, text measure 72ch/734px, mobile 46px. Leftover: 360px illustration stays centred.
- R10 (this commit) DONE - 63 gallery figures unified at 18px radius, 4/3 cover, 50% 30%; intro sections aligned to the grid at 144/46px with 28.8px H2 and 72ch text. Leftover: none.
- R11 (this commit) DONE - receipt hides header and centres mascot/title/card/CTA in a 520px panel (520x548 at 1440, 390 sheet at 390); .ics export is a 30-min Europe/Istanbul event. Leftover: none.
- R12 (this commit) DONE - generated-article H1 is clamp(1.75rem,3.2vw,2.75rem)/1.15 (44px/1440, 28px/390) and the hero card now spans the 1152px container; body 16.8px/1.8. Reference scan: 201/201 generated pages mention Tehran in the shared footer, 7 Iranian, 1 CinnaGen; blog.html has 1 CinnaGen. Leftover: blog hero H1 remains 64px because it is full-width, not in a card.
- R13 (this commit) DONE - _tools/reports/placeholder-links.md maps 81 nav/footer/home links to 201 placeholders; facial-fillers-2.html, mesogel-skin-boosters.html and botox.html are real T27 pages with sample USD prices and noindex; 198 other placeholders use a clean Coming soon card. Final smoke PASS, check-links 0 missing. Leftover: pre-existing syntax error in assets/js/ai-flow.js (duplicate `url`), not touched.

## FINAL VERIFICATION — R01–R13 (2026-11-10)

Final gate re-run after R13 (HEAD `db9e99c`). No site files changed in this step.

| Task | Commit | Status | Leftover |
|---|---|---|---|
| R01 | `8999f52` | DONE | Footer/mega-nav text links keep hover underline by design |
| R02 | `180a4ce` | DONE | None |
| R03 | `393a266` | DONE | None |
| R04 | `80b5bbf` | DONE | None |
| R05 | `9031b84` | DONE | Longest mobile label H2 wraps 3 lines |
| R06 | `9031b84` | DONE | None |
| R07 | `11e33b3` | DONE | None |
| R08 | `eed8f0a` | DONE | None |
| R09 | `78922a2` | DONE | 360px illustration stays centred |
| R10 | `0c527fa` | DONE | None |
| R11 | `38b981f` | DONE | None |
| R12 | `47ba1a6` | DONE | blog hero H1 stays 64px; generated article refs report-only |
| R13 | `db9e99c` | DONE | `assets/js/ai-flow.js` pre-existing syntax error (file not loaded by any page) |

### Final checks
- `node _tools/smoke/smoke.js`: **PASS** — 13 pages × 1440/390 = 26 runs, 0 console errors, 0 page errors, 0 failed requests, no horizontal overflow, exactly one visible h1 per page.
- `node --check` on all JS: **128/130 pass**. Failures: `extract.js` (UTF-16 encoded throwaway tool script, not site code) and `assets/js/ai-flow.js` (pre-existing duplicate `const url`, unused — ai-analysis loads `ai-app.js`).
- `node _tools/check-links.js`: **PASS** — 31 files, 3107 local refs, 0 case mismatches, 0 missing files.
- Localization scan (16 pages: 13 built + `facial-fillers-2`, `mesogel-skin-boosters`, `botox`):
  - `Toman` 0, `Iran` 0, `Iranian` 0, `+98` 0, `0912` 0, `local mirror` 0, `the the` 0, `ago:` 0.
  - `Tehran` 1 — `index.html:185` hero eyebrow reads "PERSONALIZED AESTHETICS · WEST TEHRAN".
  - `ago` 156 hits across the built pages, all legitimate Google-review dates ("5 months ago · Google").
  - License numbers: index 9, laser 2, facial 2, services 2, doctors 1 (demo credentials); the three new service pages contain none.
- Repo-wide localization context (report-only, article content untouched per R12): 198 generated pages still carry the old footer with `tel:+982147009161` and West Tehran; 7 pages mention "Iranian", 1 "Iran", 3 "CinnaGen", 3 "Toman".

### ASSUMPTIONS
- R01: footer and mega-nav text links are inline text links, so they keep their hover underline; only card/pill CTAs changed.
- R02: 62ch answer measure and existing card padding stay; only alignment changed.
- R03: CTA zone is flat `--page-end` cream, exactly continuing the flat sheet end, instead of moving the footer partial.
- R04: "local mirror" removal applied to generated placeholder pages; body text otherwise unchanged.
- R05: sticky offset = header + chip bar + 24px (157px measured); mobile 3-line wraps accepted as cosmetic.
- R06: two-up figures use 4/3, 28px radius and shared caption style; "A facial session" figure moved without changing ids/links.
- R07: one soft panel shadow replaces per-image borders/shadows; lower-section H2 matched to R05 scale.
- R08: price card column widened to the container; designed six-column `#dose` scroller kept on mobile.
- R09: 72ch measure means 734px at the built container; illustration left centred.
- R10: 18px medium radius and 50% 30% object-position applied to all 63 figures.
- R11: "Add to calendar" is a client-side `.ics` download with Europe/Istanbul clinic time.
- R12: generated article content is report-only; blog hero H1 left full-width at 64px.
- R13: new service pages are demo-safe English with sample USD prices, noindex, and the T27/facial layout.
- FINAL: `ago` inside review dates is not a broken fragment; license numbers on built pages are demo credentials and were counted rather than removed. `index.html` copy was not edited because this gate authorises scans/checks only.

### PARTIAL / BLOCKED
- BLOCKED: none.
- PARTIAL (report-only): index hero "WEST TEHRAN" leftover; 198 generated article footers with +98 phone and Tehran address; `ai-flow.js` syntax error.

### Manual review checklist
- [ ] Booking popup success state at 1440 and 390: form header hidden, mascot/title/summary card/Done/Add to calendar centred, `.ics` downloads, no large empty area.
- [ ] Sticky H2 on `laser.html` and `facial.html`: follows scroll inside its section, stops at section end, at most 2 lines at 1440.
- [ ] `doctors.html`: three equal-height cards, left-aligned text/check lists, identical soft shadows with no hard photo edge.
- [ ] `prices.html`: price cards share the exact 144/1296 (46/344 mobile) container axis; laser tables and `#dose` scroller have no page overflow.
- [ ] `gallery.html`: all before/after halves share 18px radius, 4/3 ratio and 50% 30% crop.
- [ ] Article template: generated article H1 44px at 1440 / 28px at 390 in the 1152px hero card; `blog.html` hero intentionally still 64px.
- [ ] New service pages `facial-fillers-2.html`, `mesogel-skin-boosters.html`, `botox.html`: T27 layout, USD prices, noindex, no Iranian references or license numbers, nav/footer working.
| S01 | DONE | this commit | Pill CTAs and .svc-card no longer draw a hover/focus underline; quiet scan 0/16 pages, smoke PASS. |
| S04 | DONE | this commit | FAQ heading starts at the list edge (delta 0px, 1440/390); accordion boxes untouched; smoke PASS. |
| S03 | DONE | this commit | One closing mascot CTA per page; extra bands removed (6 svc-cta, prices pr-note, doctors docs-cta), mascot bottom fade masked on 16/16; smoke PASS. |
| S08 | DONE | this commit | Index eyebrow now NISANTASI, ISTANBUL; 16/16 pages clean of Tehran/Iran/Toman in copy, titles and meta; smoke PASS. |
| S05 | DONE | this commit | Doctor photos anchored bottom, overflow hidden, no tilt/rotation; 4/4 cards flush (bottom gap 0px) at 1440 and 390; smoke PASS. |
| S07 | DONE | this commit | Contact calendar+times group centred at max 900px (equal gaps 1440/390), popup calendar centred, empty times panel now prompts for a day; smoke PASS. |
| S02 | DONE | this commit | Sticky service H2 bounded by `.svc-sec__row` (305 scroll steps at 1440, 0 overlaps), faded-rule dividers with 3.5rem spacing, tocbar/header 0.92 + blur; smoke PASS. |
| S06 | DONE | this commit | face-analysis: 5-card How It Works grid (equal height at 1440) + two-column about block; all later sections and FAQ JSON-LD removed; check-links 0 missing, smoke PASS. |

## Review2 final verification

| Task | Commit | Status | Leftovers |
| --- | --- | --- | --- |
| S01 | 1325dbc | DONE | none |
| S02 | 2b36e0a | DONE | none |
| S03 | c959d09 | DONE | unused `.svc-cta` / `.pr-note` rules remain in inner-unify.css |
| S04 | f97e9b9 | DONE | none |
| S05 | 8e20c0f | DONE | none |
| S06 | 31e0a56 | DONE | none |
| S07 | 45edc8a | DONE | none |
| S08 | b254946 | DONE | 199 generated placeholder/article pages still carry Tehran in the shared footer (outside the 16-page scope) |

Final checks (branch `review2-nov26`, not merged, not pushed):

- smoke: 16 pages (13 built + 3 new service pages) at 1440 and 390 -> PASS, 0 console/page errors, 0 failed requests, no overflow, exactly one h1 per page.
- check-links: 31 files, 3083 local refs, 0 missing files, 0 case mismatches.
- rendered text: 16 pages at 1440 + 390 -> 0 hits for Tehran, Iran, Toman, +98, "ago:" and "local mirror" across body text, title, meta description, JSON-LD and href/src/alt/aria-label.
- node --check: 2 pre-existing failures, both unreferenced by any page: `extract.js` (UTF-16 scratch utility) and `assets/js/ai-flow.js` (duplicate `const url`); neither was touched in this review.

Manual checks before merge:

- [ ] Hover and keyboard-focus a pill CTA and a `.svc-card`: no underline appears (S01).
- [ ] Scroll laser/facial/botox/fillers/mesogel: each sticky H2 stops at its text block and never covers a figure, callout, table or the next section; faded dividers and 3.5rem rhythm visible (S02).
- [ ] Each of the 16 pages shows exactly one closing mascot CTA with a soft bottom fade (S03).
- [ ] FAQ title sits flush with the list left edge on every page (S04).
- [ ] Doctors: all four portraits sit flush to the card bottom with no hover rotation; gradient/multiply blend intact (S05).
- [ ] Face-analysis: one row of five equal glass cards at 1440, two-column about block with the lip image, no leftover sections or FAQ (S06).
- [ ] Contact: calendar + times panel centred as one group; empty state reads "Select a day to see available times."; popup matches (S07).
- [ ] Home eyebrow reads "NISANTASI, ISTANBUL"; no Tehran/Iran/Toman text on the 16 pages (S08).


## Review3 task log

| Task | Commit | Status | Notes |
| --- | --- | --- | --- |
| D1 | this commit | DONE | gallery: removed the two intro text sections, FAQ block and FAQ JSON-LD after the case grid (kept 63 figures, lightbox data, one CTA band + footer); check-links 0 missing, smoke PASS |
| D2 | this commit | DONE | chip bar: cream sheet is hidden in normal flow (opacity 0, no 100vw feather), turns into a full-width rgba(246,243,236,.94) blur sheet with a hairline bottom border only when the is-stuck class fires from a sentinel IntersectionObserver; chip shadow kept inside the masked scroller; delta vs bar-hidden outside the container <=5/255 at 1440 on laser/prices/facial/facial-fillers-2, stuck state verified at y=62, smoke PASS |
| D3 | this commit | DONE | location box: OSM embed (bbox centred 41.0486,28.9937, marker, lazy, no-referrer, titled) layered over the retained placeholder fallback at 28px radius; touch pointer-events none at 390; desktop copy height equals map (440/440, 384/384), lead top delta 0, actions bottom delta 0, 40px column gap; removed aspect-ratio so the box no longer overflows 390 (map 71-330, was 71-391); directions links all point to Nisantasi, Istanbul, smoke PASS |
| D4 | this commit | DONE | doctors: all four photo boxes 552x690 at 1440 and 297.5x371.9 at 390 (aspect 4/5, column width, object-fit cover); cut-out portraits 50% 100%, illustrated cards 50% 50%; soft var(--shadow-soft) restored on the panel; data-tilt=5 moved onto the panel that holds backdrop+image, reveal animation disabled there so the inline tilt is not overridden; rest transform none, hover rotates up to 5deg with perspective 900px and resets, skipped at 390 touch and under prefers-reduced-motion (hover transform none), smoke PASS |
| M1 | this commit | DONE | home phone hero: measured h1 44.084px at 428 (box 33-395), 40.17px at 390 (30-360) and 37.08px at 360 (27.7-332.3), all inside the viewport; made the title fluid with clamp(34px,10.3vw,72px) and gave h1/eyebrow max-width 100% + normal wrap; eyebrow wraps to 43.2px tall and stays inside the same boxes; intro now has a 3.8s hard fail-safe (measured gone at 2.87-2.96s at 428); smoke runs 1440/428/390/360 (64 samples) and fails on text range boxes crossing the viewport (an injected 130px nowrap probe is caught as textclip=1), full run SMOKE PASS |
