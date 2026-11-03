'use strict';
const fs = require('fs');

const FILE = 'prices.html';
let text = fs.readFileSync(FILE, 'utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';

/* 1. Give each category H2 an anchor id for the sticky chip bar. */
text = text.replace(
  /<section class="pr-block" id="([^"]+)"([^>]*)>([\s\S]*?)<\/section>/g,
  function (whole, id, attrs, body) {
    if (/<h2[^>]*\bid=/.test(body)) return whole;
    const headId = id + '-head';
    const bodyWithId = body.replace(/<h2(\s[^>]*)?>/, function (tag, extra) {
      return '<h2 id="' + headId + '"' + (extra || '') + '>';
    });
    return '<section class="pr-block" id="' + id + '"' + attrs + '>' + bodyWithId + '</section>';
  }
);

/* 2. Every category, including the cc table, becomes a glass card. */
text = text.replace(/<section class="pr-block"/g, '<section class="pr-block glass-card glass-card--panel"');

const benefits = [
  '<section class="pr-benefits wrap" aria-label="Price list notes">',
  '  <h2 class="visually-hidden">Price list notes</h2>',
  '  <div class="pr-benefits__grid">',
  '    <article class="glass-card pr-benefit">',
  '      <span class="pr-benefit__icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"></path><path d="M9 14a3 3 0 0 0 3 3"></path></svg></span>',
  '      <div class="pr-benefit__body">',
  '        <h3 class="pr-benefit__title">Pricing basis</h3>',
  '        <p>Filler prices are per cc and laser prices are per session.</p>',
  '        <a class="pr-benefit__link" href="#pr-filler-head">See filler prices <span aria-hidden="true">&rarr;</span></a>',
  '      </div>',
  '    </article>',
  '    <article class="glass-card pr-benefit">',
  '      <span class="pr-benefit__icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg></span>',
  '      <div class="pr-benefit__body">',
  '        <h3 class="pr-benefit__title">Final quote</h3>',
  '        <p>Final pricing is confirmed at consultation.</p>',
  '        <a class="pr-benefit__link" href="/contact.html">Book a consultation <span aria-hidden="true">&rarr;</span></a>',
  '      </div>',
  '    </article>',
  '    <article class="glass-card pr-benefit">',
  '      <span class="pr-benefit__icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span>',
  '      <div class="pr-benefit__body">',
  '        <h3 class="pr-benefit__title">Customer Club</h3>',
  '        <p>Members get additional benefits beyond this price list.</p>',
  '        <a class="pr-benefit__link" href="/customer-club.html">Explore the club <span aria-hidden="true">&rarr;</span></a>',
  '      </div>',
  '    </article>',
  '  </div>',
  '</section>'
].join(eol);

const chips = [
  ['pr-botox-head', 'Botox', 'Botox'],
  ['pr-filler-head', 'Fillers', 'Fillers'],
  ['pr-filler-dissolve-head', 'Enzyme', 'Filler Dissolving Enzyme'],
  ['pr-body-filler-head', 'Body', 'Body Fillers'],
  ['pr-threads-head', 'Threads', 'Facial Threads'],
  ['pr-endolift-head', 'Endolift', 'Endolift'],
  ['pr-blepharoplasty-head', 'Blepharoplasty', 'Blepharoplasty'],
  ['pr-mesogel-head', 'Mesogel', 'Mesogel & Skin Boosters'],
  ['pr-hair-head', 'Hair', 'Hair Mesotherapy'],
  ['pr-skin-head', 'Skin', 'Skin Treatments'],
  ['pr-spartina-head', 'Spartina', 'Spartina (Weight Loss)'],
  ['pr-prostoline-head', 'Prostolin', 'Prostolin Mesotherapy'],
  ['pr-laser-head', 'Laser', 'Laser Hair Removal'],
  ['pr-facial-head', 'Facial', 'Facial'],
  ['dose', 'CC guide', 'How many cc are needed']
];

const chipItems = chips.map(function (chip) {
  const href = '#' + chip[0];
  return '        <li><a href="' + href + '" data-short="' + chip[1] + '" title="' + chip[2] + '" aria-label="' + chip[2] + '">' + chip[2] + '</a></li>';
}).join(eol);

const tocbar = [
  '<div class="lm-svc-tocbar" data-svc-tocbar>',
  '  <div class="wrap lm-svc-tocbar__in" data-lenis-prevent-wheel>',
  '    <nav class="svc-toc" aria-labelledby="svc-toc-title">',
  '      <p class="toc-title" id="svc-toc-title">On this page</p>',
  '      <ol role="list">',
  chipItems,
  '      </ol>',
  '    </nav>',
  '  </div>',
  '</div>'
].join(eol);

const hero = [
  '<header class="pr-hero wrap">',
  '  <div class="pr-hero__top">',
  '    <h1>Service Fees</h1>',
  '    <p class="pr-updated"><span class="pr-updated__dot" aria-hidden="true"></span>Updated October 2026</p>',
  '  </div>',
  '  <p class="lead">Filler prices are per cc and laser prices are per session.</p>',
  '</header>',
  benefits,
  tocbar
].join(eol);

text = text.replace(/<header class="pr-hero wrap">[\s\S]*?<\/header>/, hero);
text = text.replace(/<div class="pr-grid wrap">/, '<div class="pr-grid pr-grid--single wrap">');
text = text.replace(/<div class="pr-main">/, '<div class="pr-main">' + eol + '  <p class="pr-sample-note">Sample prices in USD for demonstration only; final pricing is confirmed at consultation.</p>');
text = text.replace(/<aside class="pr-side">[\s\S]*?<\/aside>/, '');

const cta = [
  '<section class="pr-note glass-card glass-card--panel wrap" aria-label="Book an appointment or preview your result">',
  '  <div class="pr-note__copy">',
  '    <p class="pr-note__eyebrow">Next step</p>',
  '    <h2>Book your consultation or preview the result first.</h2>',
  '    <p>Some other specialist services are not on this list; call for their fees and appointments.</p>',
  '  </div>',
  '  <div class="pr-note__actions">',
  '    <a class="btn-pill btn-pill--dark" href="/contact.html">Book Appointment</a>',
  '    <a class="btn-pill btn-secondary" href="/face-analysis.html">Smart Mirror</a>',
  '  </div>',
  '</section>'
].join(eol);

text = text.replace(/<section class="pr-note wrap">[\s\S]*?<\/section>/, cta);
text = text.replace('inner-unify.css?v=1.2.2', 'inner-unify.css?v=1.2.3');

fs.writeFileSync(FILE, text, 'utf8');

console.log('hero=' + (text.includes('pr-hero__top') ? 'ok' : 'MISSING'));
console.log('benefits=' + (text.match(/class="glass-card pr-benefit"/g) || []).length);
console.log('chips=' + (text.match(/data-short=/g) || []).length);
console.log('glass-price-cards=' + (text.match(/pr-block glass-card glass-card--panel/g) || []).length);
console.log('h2-head-ids=' + (text.match(/-head"/g) || []).length);
console.log('sample-note=' + (text.includes('pr-sample-note') ? 'ok' : 'MISSING'));
console.log('aside=' + (text.includes('pr-side') ? 'STILL PRESENT' : 'removed'));
console.log('cta=' + (text.includes('pr-note__actions') ? 'ok' : 'MISSING'));
console.log('css-version=' + (text.includes('inner-unify.css?v=1.2.3') ? 'ok' : 'MISSING'));
