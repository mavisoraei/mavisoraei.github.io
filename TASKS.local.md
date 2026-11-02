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

## T31
- [ ] Keep exactly one visible `h1` in `index.html` (hero title)
- [ ] Demote the other `h1` to an equivalent `h2` or styled `p` without changing its appearance
- [ ] Verify with the smoke test
- Status: TODO
- Commit: —
- Leftover: —
