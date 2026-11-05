import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compactInteractionHtml} from './url-state-html.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/burger-category-buying-brief.json'), 'utf8'));
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updatedOn)) throw Error('A verified content revision date is required');
const target = path.join(root, 'burger-boxes.html');
let html = fs.readFileSync(target, 'utf8');
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(data.seoTitle)}</title>`)
  .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(data.description)}`)
  .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(data.seoTitle)}`)
  .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(data.description)}`)
  .replace(/(<h1 class="display-title">Clamshell Burger Boxes<\/h1><div class="rule"><\/div><p>)[\s\S]*?<\/p>/, `$1${esc(data.intro)}</p>`)
  .replaceAll('Kraft or white food-grade paperboard', 'Board selected for the packed burger')
  .replaceAll('Grease-resistant barrier options', 'Barrier requirement reviewed for the recipe')
  .replaceAll('Food-grade material options by project', 'Documentation reviewed for the intended use and market')
  .replaceAll('<strong>Food performance</strong>', '<strong>Packing conditions</strong>')
  .replaceAll('Strong, stackable corrugated boxes for hot pizza, flat foods and delivery orders.', 'Compare corrugated pizza-carton construction, dimensions and packing requirements.')
  .replaceAll('Printed hot and cold paper cups designed to carry your brand beyond the counter.', 'Explore paper cup formats and confirm intended use and filling conditions.');
const brief = `<section class="section section-cream" data-burger-buying-brief><div class="container spec-layout"><div><p class="eyebrow">Choose the order format</p><h2 class="section-title">A burger box or a complete meal pack?</h2><table class="spec-table"><thead><tr><th>Format</th><th>What to confirm</th></tr></thead><tbody>${data.formats.map(format=>`<tr><th scope="row"><a href="/products/${format.slug}">${esc(format.name)}</a></th><td>${esc(format.brief)}</td></tr>`).join('')}</tbody></table></div><div><p class="eyebrow">Prepare your quotation</p><h2 class="section-title">Send a usable burger-packaging brief.</h2><p class="section-copy">Include the assembled burger dimensions, wrapping, quantity per size and artwork, delivery country and required arrival date. Show the complete order and flag any proposed fries, drink or sharing layout.</p><p class="section-copy">Ask for internal dimensions, sample scope and the exact components included in the quotation. Food-contact documentation and any barrier proposal are reviewed for the intended conditions, not inferred from the artwork.</p><a class="button button-dark" href="/get-a-quote#category=burger-boxes&amp;from=%2Fburger-boxes">Discuss the order format <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a></div></div></section>`;
const briefPattern = /<section\b[^>]*data-burger-buying-brief[^>]*>[\s\S]*?<\/section>|<section class="section section-cream"><div class="container"><div class="section-head"><div><p class="eyebrow">Make it yours<\/p>[\s\S]*?<\/section>/;
if (!briefPattern.test(html)) throw Error('Expected burger category brief section not found');
html = html.replace(briefPattern, brief);
const exportBrief = data.exportBrief;
if (!exportBrief?.title || !exportBrief.intro || !exportBrief.checks?.length) throw Error('Missing destination quotation brief');
const exportMarkup = `<section class="section section-white" data-export-brief><div class="container"><p class="eyebrow">Destination and pack-out</p><h2 class="section-title">${esc(exportBrief.title)}</h2><p class="section-copy">${esc(exportBrief.intro)}</p><ul class="check-list">${exportBrief.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul></div></section>`;
if (/\bdata-export-brief\b/.test(html)) html = html.replace(/<section\b[^>]*data-export-brief[^>]*>[\s\S]*?<\/section>/, exportMarkup);
else html = html.replace(brief, brief + exportMarkup);
const faq = `<section class="section section-white"><div class="container"><div class="section-head"><div><p class="eyebrow">Frequently asked questions</p><h2 class="section-title">Ordering burger boxes.</h2></div></div><div class="accordion">${data.faq.map(([q,a], i)=>`<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>`;
const faqPattern = /<section class="section section-white"><div class="container"><div class="section-head"><div><p class="eyebrow">Frequently asked questions<\/p>[\s\S]*?<\/section>/;
if (!faqPattern.test(html)) throw Error('Expected burger category FAQ section not found');
html = html.replace(faqPattern, faq);
html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (whole, start, source, end) => {
  const schema = JSON.parse(source);
  if (schema['@type'] === 'CollectionPage') { schema.description = data.intro; schema.dateModified = data.updatedOn; }
  else if (schema['@type'] === 'FAQPage') schema.mainEntity = data.faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}));
  else return whole;
  return start + JSON.stringify(schema).replaceAll('<', '\\u003c') + end;
});
fs.writeFileSync(target, compactInteractionHtml(html, '/burger-boxes'));
console.log('Updated only burger category buying copy, metadata and matching FAQ; existing layout, links and inquiry receiver preserved.');
