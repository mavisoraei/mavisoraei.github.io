# Placeholder pages: what the current site actually needs

_Analysis only. No site files were changed. Generated 2026-10-25._

## Scope and method

- **Inventory:** 232 local HTML files = **13 built pages** (index, laser, facial, services, doctors, blog, areas, gallery, gallery_new, prices, contact, ai-analysis, face-analysis) + **219 placeholder pages**.
- **Global chrome:** the `.lm-header` mega menu, the `.mobile-drawer` and the `.site-footer` carry the same link set on every built page that has them (only the built-page AI link is swapped between `ai-analysis` and `face-analysis`), so each target is counted **once** as `global nav` (`nav` and `footer` are kept as separate markers because the footer set is much smaller).
- **Per-page links:** links inside `<main>` were split by `<section>`; the home page is reported per section, other built pages by name.
- **Ignored:** every placeholder’s own "Mirrored sections" list (template boilerplate), `mailto:`/`tel:`/hash-only links and external hosts (maps, Instagram, WhatsApp, BeautyPay, Neshan, Balad, eNamad).
- **Normalisation:** relative / `./` / root-absolute / `https://lemonclinic.org/...` / `.html` / trailing-slash / `#fragment` / `?query` variants were all resolved to one local file; Persian live paths were matched to their placeholder via the `Live source path` in each file.
- **Tier rules:** **T1** = linked from global nav, home page, or a built index page (services, prices, doctors, areas, gallery). **T2** = linked only from another built page (blog, laser, facial, contact, ai-analysis, face-analysis, gallery_new). **T3** = no inbound link from any built page. Placeholders linking to placeholders were checked: **none exist** outside the ignored boilerplate, so T2 does not propagate further.
- **Live check caveat:** this network cannot reach `lemonclinic.org` directly (TCP 80/443 time out; `curl.exe` status `000`), so the required curl loop was run through the `r.jina.ai` fetch proxy, which reports the origin status in its output. `sitemap.xml` was fetched once the same way.

## Headline numbers

| Tier | Pages | Share | What it means |
|---|---:|---:|---|
| **Tier 1** | **90** | 41% | On the site’s own navigation / home / index pages — keep |
| **Tier 2** | **111** | 51% | Reachable only through blog/laser/facial/contact/tool pages — keep with blog |
| **Tier 3** | **18** | 8% | Orphans — all 18 are also absent from `sitemap.xml` |

### By type

| Type | T1 | T2 | T3 | Total | Verdict |
|---|---:|---:|---:|---:|---|
| Service | 64 | 0 | 15 | 79 | Build 64, drop 15 dead English-slug twins |
| Doctor | 6 | 0 | 0 | 6 | Build all 6 |
| Area | 3 | 0 | 0 | 3 | Build all 3 |
| Article | 4 | 104 | 1 | 109 | Build 108, drop 1 dead duplicate |
| Article category | 0 | 7 | 0 | 7 | Build all 7 with the blog |
| Other | 13 | 0 | 2 | 15 | Build 13, drop 2 dead duplicates |
| **Total** | **90** | **111** | **18** | **219** | **201 keep / 18 drop** |

### Strong vs weak Tier 1

- **84 strong T1** pages are linked from the mega menu, the home page or a real index page.
- **6 weak T1** pages have the site-wide footer as their only Tier-1-strength link: `faq`, `gift-draw`, `laser-device-rental`, `lemonai-software`, `model-registration`, `privacy-policy`.

### Where the links come from

| Source | Distinct placeholders linked |
|---|---:|
| Global nav — mega menu | 64 |
| Global nav — footer | 21 |
| Home page | 76 |
| `blog.html` | 120 |
| `services.html` | 68 |
| `prices.html` | 33 |
| `gallery_new.html` | 14 |
| `laser.html` | 13 |
| `doctors.html` | 10 |
| `face-analysis.html` | 8 |
| `areas.html` | 6 |
| `facial.html` | 5 |
| `contact.html` | 3 |

`blog.html` is the single entry point for the whole Tier 2 layer: it links all **111** T2 targets (104 articles + 7 category pages) plus 9 pages that are already T1. Only 6 of those articles get a second contextual link (5 from `laser.html`, 1 from `facial.html`).

## 30 most-linked placeholders

Ranked by number of distinct inbound source groups (nav, footer, home, each built page). `nav`/`footer` are global; bracketed items are the home section or the section of the linking page.

| # | Page | Type | Tier | Sources | Inbound |
|---:|---|---|---|---:|---:|
| 1 | `botox.html` | Service | 1 | nav · footer · home[All services] · areas[.pg-price-table wrap] · blog[.cat-block] · face-analysis[top] · prices[Botox price] · +1 more | 8 |
| 2 | `rejuvenation-mesogel.html` | Service | 1 | nav · footer · home[All services] · areas[.pg-price-table wrap] · blog[.cat-block] · gallery_new[Portfolio gallery] · laser[Frequently asked questions] · +1 more | 8 |
| 3 | `facial-fillers-2.html` | Service | 1 | nav · footer · home[Lemon services, All services] · areas[.pg-price-table wrap] · blog[.cat-block] · prices[Filler price, Filler dissolution enzyme price] · services[.svc-group] | 7 |
| 4 | `skin-treatment.html` | Service | 1 | nav · home[All services] · blog[.cat-block] · gallery_new[Portfolio gallery] · laser[Frequently asked questions] · prices[Skin treatment prices] · services[.svc-group] | 7 |
| 5 | `contouring-full-face-2.html` | Service | 1 | nav · home[All services] · face-analysis[top] · gallery_new[Portfolio gallery] · prices[Filler price] · services[.svc-group] | 6 |
| 6 | `eyelid-blepharoplasty.html` | Service | 1 | nav · home[All services] · doctors[top] · gallery_new[Portfolio gallery] · prices[Blepharoplasty price] · services[.svc-group] | 6 |
| 7 | `lip-fillers-2.html` | Service | 1 | nav · home[All services] · face-analysis[top] · gallery_new[Portfolio gallery] · prices[Filler price] · services[.svc-group] | 6 |
| 8 | `spartina-2.html` | Service | 1 | nav · footer · home[Lemon services, All services] · face-analysis[top] · prices[Spartina injection price] · services[.svc-group] | 6 |
| 9 | `under-eye-fillers-2.html` | Service | 1 | nav · home[All services] · face-analysis[top] · gallery_new[Portfolio gallery] · prices[Filler price] · services[.svc-group] | 6 |
| 10 | `cat-eye-botox.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · prices[Botox price] · services[.svc-group] | 5 |
| 11 | `chitgar.html` | Area | 1 | footer · home[Access and location] · areas[.pg-price-table wrap, .ar-more] · contact[Access and location] · laser[.svc-prices wrap] | 5 |
| 12 | `dr-farideh-gholizadeh-researcher-emergency-physician-medical-license-1.html` | Doctor | 1 | home[Lemon doctors] · doctors[top, .docs-more wrap] · facial[Facial] · laser[Laser Hair Removal] · services[top] | 5 |
| 13 | `dr-mostafa-hoosavi-general-physician-aesthetic-medicine-medical-licens.html` | Doctor | 1 | home[Lemon doctors] · doctors[top, team-inactive (#team-inactive)] · facial[Facial] · laser[Laser Hair Removal] · services[top] | 5 |
| 14 | `dr-shadi-ghafouri-dentist-founder-of-lemon-clinic.html` | Doctor | 1 | home[Lemon doctors] · doctors[top, team-inactive (#team-inactive)] · facial[Facial] · laser[Laser Hair Removal] · services[top] | 5 |
| 15 | `endolift-lift.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · prices[Endolift price] · services[.svc-group] | 5 |
| 16 | `face-lift-threads.html` | Service | 1 | nav · footer · home[All services] · gallery_new[Portfolio gallery] · services[.svc-group] | 5 |
| 17 | `scar-treatment-subcision.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · prices[Skin treatment prices] · services[.svc-group] | 5 |
| 18 | `west-tehran.html` | Area | 1 | footer · home[Access and location] · areas[.pg-price-table wrap, .ar-more] · contact[Access and location] · laser[.svc-prices wrap, Frequently asked questions] | 5 |
| 19 | `acne-treatment.html` | Service | 1 | nav · home[All services] · facial[.svc-prices wrap] · services[.svc-group] | 4 |
| 20 | `barbie-back-botox.html` | Service | 1 | nav · home[All services] · prices[Botox price] · services[.svc-group] | 4 |
| 21 | `body-fillers.html` | Service | 1 | nav · home[All services] · prices[Body filler price] · services[.svc-group] | 4 |
| 22 | `cheek-fillers-2.html` | Service | 1 | nav · home[All services] · prices[Filler price] · services[.svc-group] | 4 |
| 23 | `chin-fillers-2.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · services[.svc-group] | 4 |
| 24 | `chin-jlines-botox.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · services[.svc-group] | 4 |
| 25 | `dimono.html` | Service | 1 | nav · home[All services] · prices[Mesogel and skin booster prices] · services[.svc-group] | 4 |
| 26 | `district-22.html` | Area | 1 | footer · home[Access and location] · areas[.pg-price-table wrap, .ar-more] · contact[Access and location] | 4 |
| 27 | `gummy-smile-botox.html` | Service | 1 | nav · home[All services] · prices[Botox price] · services[.svc-group] | 4 |
| 28 | `hair-mesotherapy.html` | Service | 1 | nav · home[All services] · prices[Mesotherapy and hair loss treatment prices] · services[.svc-group] | 4 |
| 29 | `jalupro.html` | Service | 1 | nav · home[All services] · prices[Mesogel and skin booster prices] · services[.svc-group] | 4 |
| 30 | `jawline-fillers.html` | Service | 1 | nav · home[All services] · gallery_new[Portfolio gallery] · services[.svc-group] | 4 |

## Tier 3 — all 18 orphans (safe to drop)

| Page | Type | Live source | Duplicate of | Status |
|---|---|---|---|---|
| `what-is-spartina-weekly-slimming-ampoule-sinagen-production-spartina-i.html` | Article | `/magazine/spartina/` | `what-is-spartina-the-weekly-weight-loss-injection-made-by-cinnagen-spa.html` | 404; zero inbound links |
| `dr-ghafouri-lip-fillers.html` | Other | `/gallery/` | `gallery.html` | 404; zero inbound links |
| `start-your-free-ai-analysis-with-lemon.html` | Other | `/آنالیز-صورت/اپ/` | `ai-analysis.html` | 200; zero inbound links |
| `cheek-fillers.html` | Service | `/services/fillers/گونه/` | `cheek-fillers-2.html` | 404; zero inbound links |
| `chin-fillers.html` | Service | `/services/fillers/چانه/` | `chin-fillers-2.html` | 404; zero inbound links |
| `contouring-full-face.html` | Service | `/services/fillers/کانتورینگ-فول-فیس/` | `contouring-full-face-2.html` | 404; zero inbound links |
| `crow-s-feet-fillers.html` | Service | `/services/fillers/شقیقه/` | `temple-fillers.html` | 404; zero inbound links |
| `facial-fillers.html` | Service | `/services/fillers/` | `facial-fillers-2.html` | 404; zero inbound links |
| `facials.html` | Service | `/services/facials/` | — (no local twin) | 404; zero inbound links |
| `fillers-jaw-angle.html` | Service | `/services/fillers/زاویه-فک/` | `jawline-fillers.html` | 404; zero inbound links |
| `lip-fillers.html` | Service | `/services/fillers/لب/` | `lip-fillers-2.html` | 404; zero inbound links |
| `localized-slimming.html` | Service | `/services/slimming/لاغری-موضعی/` | `localized-slimming-2.html` | 404; zero inbound links |
| `mesotherapy-skin-booster.html` | Service | `/services/mesotherapy/` | — (no local twin) | 404; zero inbound links |
| `nose-fillers.html` | Service | `/services/fillers/بینی/` | `nose-fillers-2.html` | 404; zero inbound links |
| `slimming.html` | Service | `/services/slimming/` | `weight-loss.html` | 404; zero inbound links |
| `smile-line-fillers.html` | Service | `/services/fillers/خط-خنده-و-اندوه/` | `smile-line-fillers-2.html` | 404; zero inbound links |
| `spartina.html` | Service | `/services/slimming/spartina/` | `spartina-2.html` | 404; zero inbound links |
| `under-eye-fillers.html` | Service | `/services/fillers/زیر-چشم/` | `under-eye-fillers-2.html` | 404; zero inbound links |

Every Tier 3 page points at a phantom or duplicate URL. **17 of the 18 return 404**; the single 200 is `/آنالیز-صورت/اپ/` (`start-your-free-ai-analysis-with-lemon`), which is live but absent from the sitemap and is the same app already built as `ai-analysis.html`. None of the 18 appears in the 317-URL `sitemap.xml`. Example: `https://lemonclinic.org/services/fillers/لب/` → **404**, while `https://lemonclinic.org/خدمات/فیلر/لب/` → **200**.

## The 15 "other" pages

| Page | Tier | Linked from | In sitemap | Live | Recommendation |
|---|---|---|---|---|---|
| `installment-payment.html` | 1 | footer · prices[top] · services[top] | yes | 200 | Build |
| `lemon-medical-aesthetic-clinic.html` | 1 | footer · home[About the clinic] · doctors[top] | yes | 200 | Build |
| `careers.html` | 1 | footer · doctors[.docs-more wrap] | yes | 200 | Build |
| `customer-club.html` | 1 | footer · prices[top] | yes | 200 | Build |
| `faq.html` | 1 | footer · blog[.cat-block] | yes | 200 | Build (weak T1: footer is only strong link) |
| `gift-draw.html` | 1 | footer · face-analysis[top] | yes | 200 | Build (weak T1: footer is only strong link) |
| `lemonai-software.html` | 1 | footer · face-analysis[top] | yes | 200 | Build (weak T1: footer is only strong link) |
| `physician-training.html` | 1 | footer · doctors[.docs-more wrap] | yes | 200 | Build |
| `privacy-policy.html` | 1 | footer · face-analysis[top] | yes | 200 | Build (weak T1: footer is only strong link) |
| `tehran-beauty-price-index.html` | 1 | footer · prices[top] | yes | 200 | Build |
| `installment-gel-injections.html` | 1 | prices[top] | yes | 200 | Build |
| `laser-device-rental.html` | 1 | footer | yes | 200 | Build (weak T1: footer is only strong link) |
| `model-registration.html` | 1 | footer | yes | 200 | Build (weak T1: footer is only strong link) |
| `dr-ghafouri-lip-fillers.html` | 3 | — | **no** | 404 | **Drop** |
| `start-your-free-ai-analysis-with-lemon.html` | 3 | — | **no** | 200 | **Drop** |

Notes: `installment-gel-injections.html` is the one "other" page that is *not* in the footer — it is linked from the prices page and is live. `dr-ghafouri-lip-fillers.html` is not a doctor page at all: its "Live source path" is `/gallery/`, i.e. the gallery itself. `start-your-free-ai-analysis-with-lemon.html` is the `/آنالیز-صورت/اپ/` app, already built as `ai-analysis.html`.

## Duplicates and slug collisions

No two placeholders share an identical live path, but **16 files are duplicates** of another placeholder/built page — and all 16 are in Tier 3. Two patterns:

1. **Ten translated-prefix twins.** The mirror stored both an English-prefix URL (`/services/fillers/...`, 404) and the Persian URL (`/خدمات/فیلر/...`, 200). The `-2` file is the live one; the clean-slug file is the dead one. These are also **slug collisions**: `cheek-fillers` / `cheek-fillers-2`, `chin-fillers` / `-2`, `contouring-full-face` / `-2`, `facial-fillers` / `-2`, `lip-fillers` / `-2`, `localized-slimming` / `-2`, `nose-fillers` / `-2`, `smile-line-fillers` / `-2`, `spartina` / `-2`, `under-eye-fillers` / `-2`.
2. **Six mis-mapped / second copies**:
   - `crow-s-feet-fillers.html` → `/services/fillers/شقیقه/` = *temple*, duplicate of `temple-fillers.html` (the crow’s-feet page was saved under the wrong live path).
   - `fillers-jaw-angle.html` → same jaw-angle page as `jawline-fillers.html`.
   - `slimming.html` → `/services/slimming/` = the same category as `weight-loss.html` (`/خدمات/لاغری/`).
   - `dr-ghafouri-lip-fillers.html` → `/gallery/`, duplicate of the built `gallery.html`.
   - `start-your-free-ai-analysis-with-lemon.html` → `/آنالیز-صورت/اپ/`, duplicate of built `ai-analysis.html`.
   - `what-is-spartina-weekly-slimming-ampoule-...html` → `/magazine/spartina/`, duplicate of the Persian-path spartina article.

| Dead file | Keep instead | Reason |
|---|---|---|
| `cheek-fillers.html` | `cheek-fillers-2.html` | same title + same live path (translated prefix variant) |
| `chin-fillers.html` | `chin-fillers-2.html` | same title + same live path (translated prefix variant) |
| `contouring-full-face.html` | `contouring-full-face-2.html` | same title + same live path (translated prefix variant) |
| `crow-s-feet-fillers.html` | `temple-fillers.html` | mis-mapped: live source is /services/fillers/شقیقه/ (temple), same as temple-fillers |
| `dr-ghafouri-lip-fillers.html` | `gallery.html` | mis-mapped: live source is /gallery/, same as built gallery.html |
| `facial-fillers.html` | `facial-fillers-2.html` | same title + same live path (translated prefix variant) |
| `fillers-jaw-angle.html` | `jawline-fillers.html` | same live tail زاویه-فک (jaw angle) as jawline-fillers; English-prefix variant |
| `lip-fillers.html` | `lip-fillers-2.html` | same title + same live path (translated prefix variant) |
| `localized-slimming.html` | `localized-slimming-2.html` | same title + same live path (translated prefix variant) |
| `nose-fillers.html` | `nose-fillers-2.html` | same title + same live path (translated prefix variant) |
| `slimming.html` | `weight-loss.html` | live /services/slimming/ — category root; Persian twin is weight-loss.html (/خدمات/لاغری/) |
| `smile-line-fillers.html` | `smile-line-fillers-2.html` | same title + same live path (translated prefix variant) |
| `spartina.html` | `spartina-2.html` | same title + same live path (translated prefix variant) |
| `start-your-free-ai-analysis-with-lemon.html` | `ai-analysis.html` | live source /آنالیز-صورت/اپ/ is the AI face-analysis app already built as ai-analysis.html |
| `under-eye-fillers.html` | `under-eye-fillers-2.html` | same title + same live path (translated prefix variant) |
| `what-is-spartina-weekly-slimming-ampoule-sinagen-production-spartina-i.html` | `what-is-spartina-the-weekly-weight-loss-injection-made-by-cinnagen-spa.html` | same article, English /magazine/spartina/ vs Persian path |

**Slug collisions to watch when building:** the canonical live URLs are Persian, but the useful local slugs are the English ones. Build one page per *live URL* and name it with the clean slug (e.g. keep `lip-fillers.html`, drop `lip-fillers-2.html`), otherwise the two naming conventions will keep generating twins.

Also outside the 219: `gallery_new.html` is a built page with **zero inbound links** (not in nav or footer) and is a duplicate of `gallery.html`. `dr-ghafouri` is the 7th doctor file but points at `/gallery/`, so the mirror really has **6 doctor pages**, not 7.

## Live check

201 Tier 1/2 URLs were requested (status only, follow redirects, one request every ≥3.1 s), plus 18 Tier 3 spot-checks. Result across all 219: 200×202, 404×17. All 201 Tier 1/2 pages return **200**; no redirect left the requested URL.

No Tier 1/2 page redirected to a different URL.

**Sitemap reconciliation:** `sitemap.xml` is a single flat sitemap with **317 page URLs** (Persian + Arabic `/ar/` + one `/en`). **201 of the 219 placeholders are in it — exactly the 201 Tier 1 + Tier 2 pages. None of the 18 Tier 3 pages is in it.** That is an independent confirmation of the tiering.

## Recommendation

### Build first (in this order)

1. **Doctors (6 pages) — all of them.** Small set, highest trust/E-E-A-T value, and they are linked from the home page, `doctors.html`, `laser.html`, `facial.html` and `services.html`. These are the cheapest pages with the best internal support.
2. **Areas (3 pages).** `chitgar`, `west-tehran`, `district-22` are already wired from home ("Access and location"), `areas.html`, `contact.html` and the laser FAQ. Local-intent pages, no dependencies.
3. **The 13 live "other" pages**, starting with the ones that already have contextual links: About (`lemon-medical-aesthetic-clinic`), installment payment, Tehran price index, customer club, careers, physician training. The 6 weak ones — FAQ, laser-device-rental, gift-draw, lemonai-software, model-registration, privacy-policy — get their only strong link from the footer, so add a contextual link before building them.
4. **Service hubs before service leaves:** `botox`, `facial-fillers-2` (fillers hub), `weight-loss` (slimming hub), `skin-treatment`, the laser hub captured by `laser.html`, and `plastic-surgery`. Each is in the mega menu, the home "All services" grid, `services.html` and `prices.html` — they are the pages that will carry the internal links for everything else.
5. **The 4 home-featured articles:** what-is-spartina, spartina price, spartina clicks, what-is-zicorpa. They sit in the home "Daily beauty trend" block.
6. **Remaining 60 service pages**, grouped by cluster: fillers → botox → laser/skin → slimming → rejuvenation/threads → plastic surgery. Follow `prices.html` section anchors, because the price table already deep-links each cluster.
7. **Blog categories (7) + the 104 blog articles**, in the batches defined by the blog’s seven category blocks (Botox, Fillers, Laser, Skin, Rejuvenation/Lift, Weight loss/Spartina, Selection & aftercare).

### Safe to drop now (18 files)

- All **15 Tier 3 services**: `cheek-fillers`, `chin-fillers`, `contouring-full-face`, `crow-s-feet-fillers`, `facial-fillers`, `facials`, `fillers-jaw-angle`, `lip-fillers`, `localized-slimming`, `mesotherapy-skin-booster`, `nose-fillers`, `slimming`, `smile-line-fillers`, `spartina`, `under-eye-fillers`. Each has a live Persian-path twin (except `facials` and `mesotherapy-skin-booster`) and **all 15 return 404 on the English path**.
- **2 Tier 3 "other"**: `dr-ghafouri-lip-fillers` (404; it points at `/gallery/`) and `start-your-free-ai-analysis-with-lemon` (`/آنالیز-صورت/اپ/` is a live 200 but not in the sitemap; the app is already built as `ai-analysis.html`).
- **1 Tier 3 article**: `what-is-spartina-weekly-slimming-ampoule-...` (`/magazine/spartina/`), duplicate of the live Persian-path Spartina article.

### Do not drop blindly

- The **104 Tier 2 articles** all depend on `blog.html` as their single entry point. They are not orphans today, but if the blog is descoped they become orphans instantly. Before building them, add contextual links from the relevant service pages (botox ↔ botox articles, laser ↔ laser articles) so they do not hang off one page.
- `facials` and `mesotherapy-skin-booster` are dead URLs, but **facials exists live** at `/خدمات/فیشال/` and is in the sitemap without a local mirror. If "facial" is a business priority, mirror the real Persian URL instead of resurrecting the English slug. The sitemap also shows three other unmirrored service URLs (rhinoplasty, gynecomastia, liquid threads) and five more doctors — a content gap, not a placeholder decision.
- `gallery.html` / `gallery_new.html`: keep one. `gallery_new` has no inbound links and duplicates the footer-linked gallery.

### Net effect

Build **201** pages (90 T1 + 111 T2), delete **18** duplicate/orphan files, and merge the 10 translated-prefix twins onto their live Persian URLs. The 219-page mirror then becomes a 1:1 map of the site’s published URL set instead of carrying two naming schemes.

---

**Awaiting your approval.** Nothing has been built, deleted or renamed. On approval I can start with phase 1 (6 doctors + 3 areas + 13 other pages + the 6 service hubs).
