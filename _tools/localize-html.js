'use strict';
const fs = require('fs');

const CONFIG = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const PAGES = ['index', 'laser', 'facial', 'services', 'doctors', 'blog', 'areas', 'gallery', 'gallery_new', 'prices', 'contact', 'ai-analysis', 'face-analysis'].map(function (p) { return p + '.html'; });

function readDoc(file) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  return { text: text.replace(/\r\n/g, '\n'), bom: bom, eol: eol };
}
function writeDoc(file, doc) {
  let text = doc.text;
  if (doc.eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (doc.bom ? '\uFEFF' : '') + text, 'utf8');
}

const MAP_PLACEHOLDER = '<div class="hl-map hl-map--placeholder" role="img" aria-label="Map placeholder for Lemon Aesthetic Clinic in Nisantasi, Istanbul" style="display:grid;place-items:center;min-height:320px;aspect-ratio:1;padding:24px;border:1px solid #b08f56;border-radius:var(--radius-lg);background:linear-gradient(135deg,#faf6ee,#e8d9bb);color:var(--foreground);text-align:center"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="display:block;margin-block-start:12px;font-weight:600">Nisantasi, Istanbul</span><span style="display:block;font-size:13px;color:var(--muted-foreground)">Map placeholder</span></div>';

const AREAS_MAIN = '<main id="main" class> <div class="wrap"><nav class="crumbs" aria-label="Page path"><ol role="list"><li><a href="/index.html">Home</a><span class="sep" aria-hidden="true">›</span></li><li><span aria-current="page">Visit</span></li></ol></nav></div> <header class="pg-hero wrap"><p class="eyebrow">Lemon Aesthetic Clinic</p><h1>Visit the Clinic</h1><p class="lead">Lemon is at 12 Example Street, Nisantasi, Istanbul. The clinic is easy to reach by public transport and taxi, and the team will send exact arrival details when you book.</p></header> <section class="pg-price-table wrap"><h2>Sample Price</h2><div class="lp-scroll"><table class="pr-table"><thead><tr><th scope="col">Treatment</th><th scope="col">Details</th><th scope="col">Price (USD)</th></tr></thead><tbody><tr><td data-label="Treatment">Botox</td><td data-label="Details"></td><td class="num" data-label="Price">from 1,400,000</td></tr><tr><td data-label="Treatment">Lip Fillers</td><td data-label="Details">per cc</td><td class="num" data-label="Price">from 7,000,000</td></tr><tr><td data-label="Treatment">Laser, full face</td><td data-label="Details"></td><td class="num" data-label="Price">from 350,000</td></tr></tbody></table></div><a class="pt-link" href="/prices.html">See the full price list →</a></section> <div class="pg-grid wrap"><article class="pg-body"><h2>Getting here</h2><p>Lemon is in Nisantasi, Istanbul. The exact address is 12 Example Street, Nisantasi, Istanbul. Public transport, taxi and nearby parking are all available; the team will send the best arrival route with your booking confirmation.</p><h2>Opening hours</h2><p>Monday to Saturday, 10:00 - 19:00. Appointments are recommended so the physician can reserve enough time for your consultation.</p><h2>Before your visit</h2><p>Bring a list of any medicines you take and tell the doctor about allergies, pregnancy or previous aesthetic treatment. The first session is usually a consultation; no treatment is required on the same day.</p><h2>Contact</h2><p>Call <a href="tel:+902120000000">+90 212 000 00 00</a> or use the <a href="/contact.html">Contact &amp; Booking</a> form. You can also message the clinic on WhatsApp.</p></article><aside class="pg-side"><div class="pg-cta-card"><p>Preview your result before injection with Lemon Smart Mirror, or book now.</p><div class="pg-cta-actions"><a class="btn-primary" href="/contact.html">Book Appointment</a><a class="btn-ghost" href="/face-analysis.html">Smart Mirror</a></div></div>' + MAP_PLACEHOLDER + '</aside></div> </main>';

function applyCommon(doc, file) {
  let t = doc.text;
  const exact = function (from, to) { t = t.split(from).join(to); };
  const regex = function (re, to) { t = t.replace(re, to); };

  /* Titles and descriptions */
  exact('Lemon Aesthetic Clinic Chitgar, West Tehran | Botox, Filler, Laser', 'Lemon Aesthetic Clinic Nisantasi, Istanbul | Botox, Filler, Laser');
  exact('Lemon Aesthetic Clinic Chitgar, West Tehran | Botox, filler, laser', 'Lemon Aesthetic Clinic Nisantasi, Istanbul | Botox, filler, laser');
  exact('Candela Hair Removal Laser in West Tehran & Chitgar | Lemon Clinic', 'Candela Hair Removal Laser in Nisantasi, Istanbul | Lemon Clinic');
  exact('Laser hair removal in West Tehran and Chitgar with Candela | Lemon Clinic', 'Laser hair removal in Nisantasi, Istanbul with Candela | Lemon Clinic');
  exact('Candela Hair Removal Laser in West Tehran', 'Candela Hair Removal Laser in Nisantasi');
  exact('Laser hair removal in West Tehran and Chitgar', 'Laser hair removal in Nisantasi, Istanbul');
  exact('Facial in West Tehran', 'Facial in Nisantasi');
  exact('Fees and prices 2026 | Lemon Aesthetic Clinic, West Tehran', 'Fees and prices 2026 | Lemon Aesthetic Clinic, Nisantasi, Istanbul');
  exact('Contact & Book Appointment | Lemon Aesthetic Clinic, West Tehran', 'Contact & Book Appointment | Lemon Aesthetic Clinic, Nisantasi, Istanbul');
  exact('Areas served by Lemon Aesthetic Clinic | West Tehran', 'Visit Lemon Aesthetic Clinic | Nisantasi, Istanbul');
  exact('Lemon Aesthetic Clinic in West Tehran (District 22 and Chitgar), with easy access for West Tehran residents. Local pages for West Tehran, District 22 and Chitgar.', 'Visit Lemon Aesthetic Clinic at 12 Example Street, Nisantasi, Istanbul. Opening hours, sample prices and booking information.');
  exact('Contact and book an appointment at Lemon Aesthetic Clinic in West Tehran (District 22 and Chitgar): exact address, phone, WhatsApp, opening hours and the booking form.', 'Contact and book an appointment at Lemon Aesthetic Clinic in Nisantasi, Istanbul: address, phone, WhatsApp, opening hours and the booking form.');
  exact('Lemon Clinic prices in West Tehran and Chitgar (2026)', 'Lemon Clinic sample prices in Nisantasi, Istanbul (2026)');
  exact('Lemon Clinic service rates in West Tehran, Chitgar (2026)', 'Lemon Clinic sample service rates in Nisantasi, Istanbul (2026)');
  exact('near Chitgar Lake (District 22), West Tehran', 'in Nisantasi, Istanbul');
  exact('West Tehran (District 22 and Chitgar)', 'Nisantasi, Istanbul');
  exact('West Tehran, near Chitgar Lake (District 22)', 'Nisantasi, Istanbul');
  exact('West Tehran, District 22, near Chitgar Lake', 'Nisantasi, Istanbul');
  exact('Chitgar, West Tehran', 'Nisantasi, Istanbul');
  exact('West Tehran and Chitgar', 'Nisantasi, Istanbul');
  exact('West Tehran & Chitgar', 'Nisantasi, Istanbul');

  /* Blog article copy */
  exact('What is retatrutide and is it licensed in Iran?', 'What is retatrutide and is it licensed?');
  exact('Zicorpa or Tirzacto; which Iranian tirzepatide should we choose?', 'Zicorpa or Tirzacto; which tirzepatide should we choose?');
  exact('What is the difference between Zicorpa and Spartina and which Iranian weight-loss product is better?', 'What is the difference between Zicorpa and Spartina and which weight-loss product is better?');
  exact('What is the difference between Zicorpa and Spartina, and which Iranian weight-loss pen is better?', 'What is the difference between Zicorpa and Spartina, and which weight-loss pen is better?');
  exact('Spartina is the Iranian version of tirzepatide.', 'Spartina is a tirzepatide brand.');
  exact('an Iranian company', 'a manufacturer');
  exact('Iranian tirzepatide', 'tirzepatide');
  exact('Two new Iranian pens', 'Two new pens');
  exact('which Iranian tirzepatide', 'which tirzepatide');
  exact('which Iranian weight-loss pen', 'which weight-loss pen');
  exact('wheat-toned Iranian skin', 'wheat-toned skin');
  exact('tips specific to Iranian skin', 'tips for sensitive skin');
  exact('Most Persian texts give', 'Most sources give');
  exact('searching for it in Persian', 'searching for it online');
  exact('dark Iranian skin', 'dark skin');
  exact('fair-to-medium Iranian skin', 'fair-to-medium skin');
  exact('fair skin and dark hair typical of Iranian skin', 'fair skin and dark hair');
  exact('typical of Iranian skin', 'skin');
  exact('Iranian olive skin', 'olive skin');
  exact('Iranian, health-licensed', 'health-licensed');
  exact('Iranian Medical Council', 'the relevant medical council');
  exact('Which wavelength for Iranian skin?', 'Which wavelength for your skin?');
  exact('#which-wavelength-for-iranian-skin', '#which-wavelength-for-your-skin');
  exact('which-wavelength-for-iranian-skin', 'which-wavelength-for-your-skin');

  /* Prices / currency */
  exact('Price (toman)', 'Price (USD)');
  exact('price (toman)', 'price (USD)');

  /* Links to locale-specific pages and articles */
  exact('/spartina-price-in-2026-the-real-cost-of-one-course-4-million-toman-per.html', '/prices.html');
  exact('/what-is-retatrutide-and-is-it-licensed-in-iran-retatrutide-is-being-in.html', '/weight-loss.html');
  exact('/zicorpa-or-tirzecto-which-iranian-tirzepatide-should-we-choose-two-new.html', '/weight-loss.html');
  exact('/what-is-the-difference-between-zicorpa-and-spartina-and-which-iranian.html', '/spartina-2.html');
  exact('https://lemonclinic.org/%D9%82%DB%8C%D9%85%D8%AA/data.json', '/data/sample-prices.json');

  /* Remove locale-only navigation and area links */
  regex(/<li>\s*<a href="(?:\.\/|\/)?tehran-beauty-price-index\.html">[^<]*<\/a>\s*<\/li>/gi, '');
  regex(/<li>\s*<a href="(?:\.\/|\/)?installment-payment\.html">[^<]*<\/a>\s*<\/li>/gi, '');
  regex(/<li>\s*<a href="(?:\.\/|\/)?(?:west-tehran|district-22|chitgar)\.html"[\s\S]*?<\/li>/gi, '');
  regex(/<h3><a href="(?:\.\/|\/)?areas\.html">Locations &amp; Club<\/a><\/h3>/gi, '<h3>Club</h3>');
  regex(/<h3><a href="(?:\.\/|\/)?areas\.html">Locations & Club<\/a><\/h3>/gi, '<h3>Club</h3>');
  regex(/<a href="(?:\.\/|\/)?(?:west-tehran|district-22|chitgar)\.html"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  regex(/<p class="hl-near">[\s\S]*?<\/p>/gi, '');

  /* Remove local trust seals and licence bar */
  regex(/\s*<div class="f-enamad">[\s\S]*?<\/div>/gi, '');
  regex(/<div class="trust-item">(?:(?!<\/div>)[\s\S])*?Online TTAC authenticity check(?:(?!<\/div>)[\s\S])*?<\/div>/gi, '');
  regex(/<span>Holding a [^<]*Medical Practice License[^<]*<\/span>/gi, '');
  exact('© 1405', '© <span data-year>2026</span>');

  /* Remove Neshan/Balad buttons; keep the rest of the location actions */
  regex(/<a\b[^>]*>\s*(?:Neshan|Balad)\s*<\/a>/gi, '');

  /* Replace the hotlinked map picture with a neutral placeholder */
  regex(/<a class="hl-map"[\s\S]*?<\/a>/gi, MAP_PLACEHOLDER);

  /* Phone, WhatsApp, address and hours */
  exact('https://wa.me/989004709161', 'https://wa.me/' + CONFIG.whatsappHref);
  exact('989004709161', CONFIG.whatsappHref);
  exact('+982147009161', CONFIG.phoneHref);
  exact('+98 21 4700 9161', CONFIG.phone);
  exact('021 4700 9161', CONFIG.phone);
  exact('090 0470 9161', CONFIG.whatsapp);
  exact('0912xxxxxxx', '05xx xxx xx xx');
  exact('09xxxxxxxxx', '05xx xxx xx xx');
  exact('Saturday to Thursday', 'Monday to Saturday');
  exact('10 to 19', '10:00 - 19:00');
  exact('Tehran, Kharazi Highway, Ardestani Boulevard, Parseh Commercial Complex, 8th Floor', CONFIG.address);
  exact('Tehran, Kharazi Highway, Ardestani Boulevard, Parseh Commercial Complex, Floor 8', CONFIG.address);
  exact('Kharazi Expressway, Ardastani Blvd, Parseh Business Complex, Floor 8', CONFIG.address);
  exact('Kharazi Highway, Ardestani Boulevard, Parseh Commercial Complex, 8th Floor', CONFIG.address);
  exact('Ardestani Boulevard, Parseh Commercial Complex, 8th Floor', CONFIG.address);
  exact('Parseh Business Complex, Ardestan Boulevard, District 22, West Tehran, near Chitgar Lake', CONFIG.address);
  exact('Parseh Commercial Complex', 'Example Business Centre');
  exact('Parseh Business Complex', 'Example Business Centre');
  exact('Kharazi Highway', 'Example Street');
  exact('Kharazi Expressway', 'Example Street');
  exact('Ardestani Boulevard', 'Nisantasi');
  exact('Ardastani Blvd', 'Nisantasi');
  exact('Ardestan Boulevard', 'Nisantasi');
  exact('Ardestani Blvd', 'Nisantasi');

  /* Review-source labels: remove Iran-only platforms */
  exact('5.0 out of 5 based on 79 real reviews on Google, Balad, Neshan and BeautyPul', '5.0 out of 5 based on 79 real reviews on Google');
  regex(/https?:\/\/(?:www\.)?(?:neshan\.org|balad\.ir|beautypay\.app)[^"'\s<]*/gi, CONFIG.mapsUrl);
  exact('https://www.google.com/maps?cid=2160021389971725298', CONFIG.mapsUrl);
  exact('Neshan user', 'Google user');
  exact('Balad user', 'Google user');
  exact('Bald user', 'Google user');
  exact('on Neshan', 'on Google');
  exact('on Balad', 'on Google');
  exact('on Bald', 'on Google');
  exact('· Neshan', '· Google');
  exact('· Balad', '· Google');
  exact('· Bald', '· Google');
  exact('BeautyPul', 'Google');
  exact('Beautypay', 'Google');
  exact('Neshan', 'Google');
  exact('Balad', 'Google');

  /* Place names */
  exact('West Tehran', 'Nisantasi');
  exact('District 22', 'Nisantasi');
  exact('Chitgar Lake and Park and Iran Mall', 'the city centre and public transport');
  exact('Chitgar Lake and Park', 'the city centre');
  exact('Chitgar Lake', 'the city centre');
  exact('Iran Mall', 'the city centre');
  exact('Chitgar', 'Istanbul');
  exact('Tehran', 'Istanbul');
  exact('Kharazi', 'Example');
  exact('Ardestani', 'Nisantasi');
  exact('Ardastani', 'Nisantasi');
  exact('Parseh', 'Example');

  /* Clean up repeated place names produced by the replacements */
  exact('Istanbul, Nisantasi', 'Nisantasi, Istanbul');
  exact('Nisantasi (Nisantasi and Istanbul)', 'Nisantasi, Istanbul');
  exact('Nisantasi, Nisantasi, Istanbul', 'Nisantasi, Istanbul');
  exact('Nisantasi, Istanbul, Istanbul', 'Nisantasi, Istanbul');
  exact('Nisantasi, Nisantasi', 'Nisantasi');
  exact('Istanbul, Istanbul', 'Istanbul');

  /* Rewrite the prices hero */
  regex(/<header class="pr-hero wrap">[\s\S]*?<\/header>/i, '<header class="pr-hero wrap"><h1>Service Fees</h1><p class="lead">The prices on this page are sample prices for demonstration only (updated October 2026). Filler prices are per cc and laser prices are per session. Final pricing is confirmed at consultation.</p><p class="pr-index-link">Members of <a href="/customer-club.html">Lemon Customer Club</a> get additional benefits beyond this price list.</p></header>');

  /* Replace the services instalment paragraph */
  regex(/<p>\s*The cost of all these services can be paid in instalments[\s\S]*?<\/p>/i, '<p>Payment is due on the day of treatment. The full price list is on <a href="/prices.html">Pricing Page</a>.</p>');

  /* Replace the visible prices FAQ about instalments */
  regex(/<details class="faq-item"><summary>Can the prices on this page be paid in instalments\?<\/summary>[\s\S]*?<\/details>/i, '<details class="faq-item"><summary>How do I pay?</summary><p>Payment is due on the day of treatment. The clinic accepts cash, card and bank transfer; final pricing is confirmed at consultation.</p></details>');

  /* Rewrite only the areas page main */
  if (file === 'areas.html') {
    regex(/<main id="main" class>[\s\S]*?<\/main>/i, AREAS_MAIN);
  }

  /* Canonical and Open Graph URLs */
  const pageUrl = file === 'index.html' ? CONFIG.siteUrl + '/' : CONFIG.siteUrl + '/' + file;
  regex(/<link rel="canonical" href="[^"]*">/i, '<link rel="canonical" href="' + pageUrl + '">');
  regex(/<meta property="og:url" content="[^"]*">/i, '<meta property="og:url" content="' + pageUrl + '">');
  exact('<meta property="og:locale" content="fa_IR">', '<meta property="og:locale" content="en_US">');

  /* Current year fallback script */
  if (t.indexOf('data-year') !== -1 && t.indexOf('querySelectorAll(\'[data-year]\')') === -1) {
    t = t.replace(/<\/body>/i, '<script>document.querySelectorAll(\'[data-year]\').forEach(function(n){n.textContent=new Date().getFullYear();});</script></body>');
  }

  doc.text = t;
  return doc;
}

for (const file of PAGES) {
  const doc = readDoc(file);
  applyCommon(doc, file);
  writeDoc(file, doc);
  console.log('localized', file);
}
