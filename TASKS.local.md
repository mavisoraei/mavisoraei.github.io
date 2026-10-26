# Tasks

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
