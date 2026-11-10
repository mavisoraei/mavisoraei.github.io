# Tasks

## T00
- [x] Create _tools/smoke/smoke.js (Node + headless Chrome/CDP, no root package.json)
- [x] 13 built pages at 1440x900 and 390x844 touch against http://localhost:8000
- [x] Report console/page errors, failed same-origin + other failed requests, horizontal overflow, exactly one h1
- [x] Output SMOKE PASS / SMOKE FAIL n and _tools/reports/smoke-latest.md
- [x] Baseline saved to _tools/reports/smoke-baseline.json; later runs fail only on NEW problems
- Status: DONE
- Commit: 6525986
- Leftover: none (pre-existing findings tolerated)

## T15b
- [x] Each card shows first 2 links; rest behind the existing "Show all N" toggle (cards with <=2 links have no toggle)
- [x] 3/2/1 grid, equal row heights, toggle pinned to card bottom, identical padding/title row/gaps
- [x] Intro, search (max 780px) and Popular label+chips share one centred axis; chips 36px and wrap; gaps 24/24/32px
- [x] "Services & Pricing" .price-cta centred under the grid
- [x] CSS logical properties; home-sections.css cache bumped to 1.0.7 on index/contact
- Status: DONE
- Commit: ae22fbf
- Leftover: none

## T22
- [x] Grepped section CTAs and mapped non-dark `.btn-pill` links to `.btn-secondary`
- [x] Shared CSS: outlined glass pill (48px, 28px inline padding, 1px rgba(176,143,86,.45), rgba(255,255,255,.5), 999px, dark text)
- [x] Hover: rgba(255,255,255,.8), border rgba(176,143,86,.75), 16px mask arrow slides 3px
- [x] Active scale .98 and focus-visible ring inherited from the button system
- [x] Removed `.btn-pill.arrow-link` from the text variant so arrow pills keep the secondary box
- [x] Dark primary `.btn-pill--dark` untouched; style.css cache bumped to 1.0.33
- Links changed: index (See all cases, All Magazine Articles, Lemon Doctors, Services & Pricing, Directions, Neshan, Balad), contact (Directions, Neshan, Balad), laser/facial/services/prices (secondary CTA in the closing band)
- Status: DONE
- Commit: 77b5f9c
- Leftover: none

## T23
- [x] Home doctor photo container: `linear-gradient(180deg,#f6eddc 0%,#ead9bb 100%)`
- [x] Photo `img { mix-blend-mode: multiply }`
- [x] All card text centred (name, role, licence); empty `.team-lic` row and divider hidden
- [x] Equal card heights retained (flex row stretch); carousel and edge fades untouched
- [x] doctors.html uses a different card system (`spread-photo` / `docs-*`), so it was not restyled
- Status: DONE
- Commit: bb59c84
- Leftover: faces/green scrubs not visually verifiable (hotlinked doctor photos timed out locally); gradient kept as specified

## T24
- [x] Shared `.faq` heading centred; list max-width 820px, centred
- [x] Items: rgba(250,246,238,.72) glass fill, white/champagne border, 20px radius, padding-block 22px / inline 28px 56px, soft shadow
- [x] Question 18px/600 centred; 30px circle +/- icon absolute at inline-end
- [x] Answer 16px/1.8, muted, centred, max-width 62ch; smooth height via `::details-content` + `interpolate-size`
- [x] Open champagne ring; hover lift; focus-visible ring; reduced-motion respected
- [x] Inner-page overrides in inner-unify.css aligned (no 17px/500 or 16px 22px padding); caches: style.css 1.0.35, inner-unify.css 1.2.2
- Status: DONE
- Commit: 9203f38
- Leftover: none

## T30a
- [x] Scanned 13 built pages, shared CSS/JS, JSON-LD/meta/alt and data/availability.json
- [x] Counts per file + example lines for every requested term
- [x] Hotlinked logo/map/mascot/consultant listed; other images grouped by directory
- [x] Doctor names/licence numbers listed only (6 names, 3 licence numbers)
- [x] Replacement plan for T30b added; no site files changed
- Report: `_tools/reports/localization-inventory.md` (+ full hotlink list `_tools/reports/localization-hotlinks.csv`)
- Status: DONE
- Commit: 31de0af
- Leftover: none

## T30b
- [x] `site.config.json` + demo values (Lemon, Istanbul, Nisantasi, Turkiye, sample USD)
- [x] Replaced place names, address, phone, WhatsApp, hours, map labels, meta and JSON-LD
- [x] Sample USD price map (`data/sample-prices.json`) + sample-price notes; no currency conversion
- [x] Neutral copy; removed price-index, instalment, area links, Neshan/Balad, TTAC/Enamad, licence and 1405
- [x] Neutral CSS/inline-SVG map placeholder; remaining hotlinked Lemon images listed
- [x] Removed JSON-LD Offer/AggregateOffer price blocks; sanitized fa-IR/Tehran/sameAs/IRR
- [x] Added `noindex, nofollow` to the 13 built pages
- [x] Smoke PASS; JSON-LD blocks parse; no raw Toman/Tehran/phone traces in scope
- Report: `_tools/reports/localization-map.md` (+ `localization-hotlinks-after.csv`)
- Status: DONE
- Commit: e9c7802
- Leftover: 4 legacy `.price-installment` CSS selectors and 5 generic `dir=rtl` CSS rules remain; 512 hotlinked Lemon images intentionally left (listed)

## T21
- [x] Redesign BODY (weight-loss) flow in ai-analysis.html like reference flow
- [x] Keep hash router and stubs in assets/js/ai-api.js
- [x] Mock data only
- [x] English LTR
- [x] Site tokens (cream/champagne, Runiga headings, .glass-card, button system, column max 720px)
- [x] FACE and ASK flows stay untouched
- [x] Routes: #/body/upload -> #/body/goal -> #/body/verify (if config.verifyContact) -> #/body/result
- [x] Progress: segmented bar with back arrow, step title and "n / 4"
- [x] #/body/goal: three metric cards (.glass-card) for Current weight (kg), Height (cm), Weight-loss goal (kg); label+unit, large centered tabular value, round minus/plus buttons, range slider with gold fill, value editable by tapping (numeric input)
- [x] Defaults 80 kg / 170 cm / 8 kg
- [x] Safety clamp for goal so resulting BMI >= 18.5 and goal <= 30 kg; inline note with booking link when clamped
- [x] "I am 18 or older" checkbox required
- [x] Share note from config (hidden if shareUnlock false)
- [x] Primary button "Next"
- [x] #/body/verify bottom sheet (focus trap concept, Esc/drag/close concept) with 6-box numeric code, auto-advance, paste, Confirm and continue, Change number, resend countdown 60s; mock any 6 digits pass via verifyContact stub
- [x] #/body/result: header with back and restart; tabs Now | Month 1 | With ambassador (third locked with lock, share-to-unlock overlay when tapped and shareUnlock true)
- [x] Image card with user photo, badge ("Your photo"/"Month 1 change"), Enlarge button with lightbox
- [x] Month 1 loading: blurred photo with glass panel, spinner, "Creating your preview...", "This takes 1-2 minutes. Please keep this page open." (4s fake delay)
- [x] Estimated cost from config.priceEstimate with note; buttons "Book a free consultation" (booking dialog with service prefilled) and "Send me the plan and price" (sheet name+email/phone; mock)
- [x] Visible line "Illustrative preview, not a guarantee or medical advice." on goal and result
- [x] States and a11y: loading, error with retry, reduced motion considerations, labels, keyboard support; works at 390px and desktop
- [x] All texts/prices/currency/duration/flags in ONE config object at top of flow JS
- [x] No new libraries
- [x] Commit and update TASKS.local.md

## T23b
- [x] Applied the T23 treatment to the `spread-photo` / `docs-*` cards in `doctors.html`
- [x] Warm champagne gradient + `mix-blend-mode: multiply` (same values as T23)
- [x] Centred all card text, hid empty licence rows, equal photo/copy heights; kept layout and links
- Status: DONE
- Commit: e72cee4
- Leftover: none

## T27
- [x] Removed the duplicate `.svc-lead` intro on `laser.html`; `facial.html`'s intro also repeated the hero summary, so it was removed too
- [x] Wrapped every body H2 and its following siblings in `.svc-sec` with `.svc-sec__label` / `.svc-sec__content`; text, ids and hrefs preserved
- [x] At 900px+: 300px label column + 760px reading column; tables and wide figures span the 1160px container; below 900px one left-aligned column
- [x] Optional sticky H2 not applied (avoids overlap with the sticky TOC bar)
- [x] Measured 1440px: before body 760px at x=340..1100; after body 1160px at x=140..1300, H2 x=140, text x=540..1300, wide figure x=140..1300. Mobile 350px at x=20..370
- [x] Smoke PASS; `node --check`; `_tools/verify-t27.js` text/ids/hrefs PASS
- Status: DONE
- Commit: 6660579
- Leftover: local screenshots `_tools/reports/t27-laser.png` and `_tools/reports/t27-facial.png` are untracked

## T28
- [x] Hero: H1 + one lead line + "Updated October 2026" pill; the old notes became three compact glass cards (pricing basis, final quote, Customer Club)
- [x] Replaced the sidebar Quick jump with the shared sticky chip bar: 15 short labels, active chip, feathered edges
- [x] All 15 price blocks are glass cards; service name left, price right in a 104px column, tabular numerals, underline only on hover, row hover highlight
- [x] Added the sample-prices note from `site.config.json` (`samplePricesNote`) above the cards
- [x] Closing CTA band with Book Appointment + Smart Mirror; all 182 price tokens, 101 non-anchor hrefs, 79 price rows and all old IDs preserved
- [x] `inner-unify.css?v=1.2.3` on prices; measured 760px cards at 1440px and 298px at 390px, no overflow; active chip and hover verified
- Status: DONE
- Commit: 279e8f3
- Leftover: local screenshots `_tools/reports/t28-*.png` are untracked

## T26
- [x] One glass filter panel at `--container` width; row 1 has a fixed 88px label column and 40px treatment chips with equal 8px gaps in a horizontal scroll row
- [x] Row 2 doctor filter is a compact custom select/popover with avatars and initials fallback; result count and clear button sit on the right
- [x] Feather edges on the chip scroller at 1200px and below; clear button only appears when a filter is active
- [x] Filtering predicate and hash behaviour unchanged; chips keep `aria-pressed`; popover supports Arrow/Home/End/Escape and closes on outside click
- [x] Verified 63 initial cases and all group/doctor counts; 40px chips, no orphan or overflow; popover flips up on short screens; smoke PASS
- Status: DONE
- Commit: 2e5b6c0
- Leftover: local screenshots `_tools/reports/t26-*.png` are untracked

## T25
- [x] Removed the separate white brand band, dark mascot band and 4-item trust row
- [x] Light glass CTA card above the footer (kicker, title, mascot right, Book Appointment + Smart Mirror); stacks at <=760px
- [x] One dark espresso footer at container width: brand column + Services (8 + All services), Clinic, Visit (address/phone/WhatsApp/hours with 16px icons), Company (merged club and doctors/clinics links)
- [x] `site.config.json` flags respected: no licence bar, no trust seals, no area links
- [x] Bottom bar: current year, language, Privacy Policy; licence only when the flag is on
- [x] Tokens: bg #25211d, 12px champagne titles, 15px/1.9 links, 14.5px muted description, 48px gaps, 160px min columns
- [x] Responsive: 2 columns <=1279px, accordion columns <=640px (2-column breakpoint kept at 1279px so the 5-column grid never overflows at 1024px)
- [x] Contrast: links 12.30:1, champagne titles 7.12:1, muted description 7.29:1 on #25211d
- [x] 13 pages updated via `_tools/apply-footer.js`; `style.css?v=1.0.36`; smoke PASS
- Status: DONE
- Commit: 5a19d7c
- Leftover: local screenshots `_tools/reports/t25-*.png` and the captured old footer are untracked

## T29
- [x] Scanned all 13 built pages for `</a>[A-Za-z]`, `See it.`, `</a> [A-Z]` and the known "Prices 2026we" / "Customer Club Beyond" examples
- [x] Applied 9 unambiguous fixes: 2 missing spaces in `laser.html`; 7 missing sentence punctuation in index, facial, services, doctors and face-analysis; removed the stray "See it." in `doctors.html`
- [x] Listed 7 ambiguous doctor name/role captions without adding punctuation
- [x] Smoke PASS; no other text changes
- Status: DONE
- Commit: 3ece1b6
- Leftover: ambiguous captions listed in the summary for manual review

## T31
- [x] Kept the single visible `h1.lm-hero-v2__title` ("Your beauty, beautifully understood.")
- [x] Demoted the hidden decorative `h1.lm-hero-giant` wordmark to `<p>` with the same classes and `id="lm-hero-title"`; `.lm-hero-giant` styles keep its appearance and the hero `aria-labelledby` target intact
- [x] Smoke PASS with `h1=1` on `index.html` at 1440 and 390
- Status: DONE
- Commit: db804d2
- Leftover: none

## T99
- [x] Final smoke PASS on all 13 pages at 1440 and 390
- [x] node --check over 94 JS files; 2 pre-existing failures reported (extract.js UTF-16, assets/js/ai-flow.js dead duplicate declaration)
- [x] check-links: 3107 local refs, 0 missing, 0 case mismatches
- [x] JSON-LD: 18/18 blocks parse
- [x] Localization re-search: 0 Iran-specific traces in scope; 4 legacy CSS installment selectors + 5 dir=rtl rules remain
- Status: DONE
- Commit: this commit
- Leftover: pre-existing dead ai-flow.js and UTF-16 extract.js; 509 intentional Lemon hotlinks

## R01
- [x] Hover audit via CDP on 6 pages: only .case-treat (card CTA) and .pr-benefit__link (pill CTA) gained an underline
- [x] Removed the hover/focus underline from both; body-text links keep theirs
- Status: DONE
- Commit: 8999f52
- Leftover: footer text links still underline on hover (nav links, not button-like)

## R02
- [x] FAQ summary and answer text set to text-align:start; block margin start-aligned
- [x] FAQ section title restated as centred on inner pages (main h2 reset outranked it)
- [x] Glass card, plus/minus icon, hover lift and details animation untouched
- Status: DONE
- Commit: 180a4ce
- Leftover: none

## R03
- [x] Home CTA no longer shows the fixed lobby photo: .ft25-cta-zone is painted with the sheet closing cream (--page-end)
- [x] CTA-to-footer gap now clamp(3.5rem, 7vw, 7rem) = 101px at 1440, 56px at 390 on all pages
- [x] Pixel sample across the junction on home: rgb(245,242,235) above / rgb(246,243,236) below, no seam
- Status: DONE
- Commit: 393a266
- Leftover: none

## R04
- [x] laser 'ago:' and face-analysis 'ago' caption now read 'Before'; doctors garbled paragraph rewritten; 'the the' and spaced comma fixed
- [x] Removed ' (local mirror)' from 201 generated titles/H1s and from placeholder pages
- [x] .skip-link hidden until keyboard focus on generated pages (nav-extras.css); Services marked active on service pages, Home no longer active
- Status: DONE
- Commit: this commit
- Leftover: none
## R05 - DONE - label H2 24.5px/1.15, free of 3-4 line wraps at 1440; label column sticky at 157px (stops at section end); laser intro H2 'About laser hair removal' (#overview). Leftover: longest mobile H2 wraps 3 lines.
## R06 - DONE - supervised card 18px padding and 6px line gaps (32px to docs); review meta 14px; intro full width 1160px; two-up 4/3 figures 568x425 each, 28px radius; relaxing callout at container edge. Leftover: none.
## R07 - DONE - doctor cards left-aligned incl. check-mark list; image border/shadow removed in favour of one soft panel shadow on all cards; lower sections H2 24.5px with 2.25em top gap, 1.1em paragraphs, 1.7 line-height, 72ch measure at container edge. Leftover: none.
## R08 - DONE - price cards span the full container (144,1296 at 1440; 46,344 at 390) matching notes/chip bar; tabular price column and row hover kept; laser tables fit at 390, #dose keeps its designed six-column scroller. Leftover: none.
## R09 - DONE - face-analysis article sits on the container axis: H2 and paragraphs start at 144px (same as the Full-Face Contouring card) with a 72ch measure (734px); mobile stays 46px full width. Leftover: illustration remains centred at 360px.
## R10 - DONE - all 63 gallery figures use radius var(--radius)=18px, overflow hidden, 4/3 ratio (363x272 at 1440; 296x222 at 390), object-fit cover, object-position 50% 30%; lower intro sections start at 144px (46px mobile) matching the grid, H2 28.8px/1.15, text 72ch/734px. Leftover: none.
## R11 - DONE - success receipt hides the form header, centres mascot/title/summary card/Done/Add to calendar in a 520px panel (520x548 dialog at 1440, 390px sheet at 390); Add to calendar downloads a 30-min clinic-time .ics. Leftover: none.
## R12 - DONE - article H1 clamp(1.75rem,3.2vw,2.75rem)/1.15 (44px at 1440, 28px at 390); hero card widened from 720px to the 1152px container; body 16.8/30.24 unchanged. References: 201/201 generated pages carry Tehran (shared footer West Tehran), 7 Iranian, 1 CinnaGen; blog.html 1 CinnaGen. Leftover: blog hero H1 stays 64px (full width, not in a card).
