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
