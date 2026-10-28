import fs from 'node:fs/promises';
import {compactInteractionHtml} from './url-state-html.mjs';
import path from 'node:path';

const root = process.cwd();
const guideOnly = process.argv.find(arg => arg.startsWith('--guide='))?.slice(8);
const reviewedDate = '2026-10-28';
const products = JSON.parse(await fs.readFile(path.join(root, 'seo-system/data/catalog-products.json'), 'utf8'));
const provenance = JSON.parse(await fs.readFile(path.join(root, 'seo-system/data/catalog-provenance.json'), 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const productLink = slug => {
  const product = products.find(item => item.slug === slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  const source = (Array.isArray(provenance) ? provenance : provenance.products).find(item => item.id === product.sourceId);
  if (!source) throw new Error(`Missing product source: ${slug}`);
  return `<a class="solution-product" href="/products/${slug}"><img src="${source.imagePath}" alt="${esc(product.name)}" width="480" height="480" loading="lazy"><span>${esc(product.name)} <span aria-hidden="true">&#8594;</span></span></a>`;
};
const solutions = [
  ['restaurants', 'Restaurants & takeaway', 'Built around your menu.', 'Choose the fit and closure for the finished meal, then test the packed order over your actual delivery time.', ['Burger size and lid clearance', 'Grease, moisture and ventilation', 'Counter assembly and delivery stacking'], ['custom-burger-clamshell-box', 'custom-corrugated-pizza-box']],
  ['catering', 'Catering & events', 'Carry the whole order.', 'Plan portions, dividers and handles together so a multi-item order stays organized from packing to handoff.', ['Portion count and sauce-cup dimensions', 'Packed weight and carrying method', 'Presentation and lid clearance'], ['window-grazing-box-with-dividers', 'handled-catering-tray']],
  ['food-brands', 'Food brands & retail', 'Make the range feel connected.', 'Coordinate print, dimensions and protection across retail packs and carriers without treating every format as the same product.', ['Consistent artwork across formats', 'Product protection and inserts', 'Retail pack versus shipping carton'], ['custom-bakery-carrier-bag', 'custom-printed-corrugated-mailer']],
  ['startups', 'Startups & new brands', 'Start with one clear specification.', 'Starting quantities vary by product and the approved specification. Confirm the MOQ for each size and print design before planning a launch.', ['One format and size to validate first', 'A packed sample before production', 'Quantity per design, not just total units'], ['custom-folding-pastry-carton', 'custom-printed-coffee-paper-cup']],
  ['enterprise', 'Enterprise projects', 'Keep repeat orders consistent.', 'Build an approved specification for each format, with documented artwork, packing requirements and order checkpoints.', ['Approved specifications and artwork versions', 'Quantities by format and delivery location', 'Sample approval and repeat-order checks'], ['catering-tray-with-cup-slots', 'compartment-catering-meal-tray']]
];
if (!guideOnly) {
let html = await fs.readFile(path.join(root, 'solutions.html'), 'utf8');
const rows = solutions.map(([id, label, title, intro, checks, slugs], index) => `<article class="solution-row" id="${id}"><div class="solution-row-index">0${index + 1}</div><div class="solution-row-copy"><p class="eyebrow">${esc(label)}</p><h2 class="section-title">${esc(title)}</h2><p class="section-copy">${esc(intro)}</p><ul class="check-list">${checks.map(text => `<li>${esc(text)}</li>`).join('')}</ul><a class="button button-dark" href="/get-a-quote?solution=${id}">Plan this packaging <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a></div><div class="solution-products">${slugs.map(productLink).join('')}</div></article>`).join('');
html = html.replace(/(<div class="container solution-rows">)[\s\S]*?(<\/div><\/section><section class="cta-band">)/, `$1${rows}$2`);
await fs.writeFile(path.join(root, 'solutions.html'), compactInteractionHtml(html, '/solutions'));
}

const table = (headings, rows) => `<div class="buyer-table-wrap" role="region" aria-label="Packaging comparison" tabindex="0"><table class="buyer-table"><thead><tr>${headings.map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, index) => index ? `<td>${cell}</td>` : `<th scope="row">${cell}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const section = (title, content) => `<section class="buyer-guide-section"><h2 class="section-title">${title}</h2>${content}</section>`;
const list = items => `<ol class="buyer-guide-checks">${items.map(([title, text]) => `<li><strong>${title}</strong><p>${text}</p></li>`).join('')}</ol>`;
const guideData = {
  'packaging-buying-guide': {
    intro: 'Choose packaging around the finished food, the service workflow and the delivery journey. Use the formats below as starting points, not as a substitute for testing a packed sample.',
    content: section('Match the format to the menu', table(['Your order', 'Format to compare', 'Check before approval'], [
      ['Burgers & sandwiches', '<a href="/products/custom-burger-clamshell-box">Hinged burger clamshell</a>', 'Finished height, toppings, closure clearance and grease exposure.'],
      ['Pizza', '<a href="/products/custom-corrugated-pizza-box">Corrugated pizza box</a>', 'Pizza diameter, ventilation and strength when stacked warm.'],
      ['Pastries & bakery', '<a href="/products/custom-folding-pastry-carton">Folding pastry carton</a>', 'Assortment footprint, liners, assembly speed and lid clearance.'],
      ['Catered assortments', '<a href="/products/window-grazing-box-with-dividers">Divided grazing box</a>', 'Portion layout, sauce cups, food separation and carrying weight.'],
      ['Drinks to go', '<a href="/products/handled-two-cup-carrier">Handled cup carrier</a>', 'Actual cup diameters, filled weight, balance and handle comfort.']
    ])) + section('Approve fit before print', list([
      ['Measure the packed product', 'Send internal length, width and height requirements, food temperature and the expected time in the pack. Include liners and inserts.'],
      ['Test the service journey', 'Check assembly, closing, carrying and stacking with your actual food or product. Review moisture and grease after the expected holding time.'],
      ['Sign off one complete specification', 'Approve the structure, material, artwork, quantity per design and export packing before production. Keep the approved sample for repeat orders.']
    ])),
    related: ['custom-burger-clamshell-box', 'window-grazing-box-with-dividers']
  },
  'materials-food-safety': {
    title: 'Food Packaging Materials & Food-Contact Checklist | MXPACKPRO',
    description: 'Compare kraft, white board and corrugated packaging. Prepare food-contact use conditions, component specifications and document checks before ordering.',
    intro: 'A material name alone does not establish food-contact suitability or environmental performance. Confirm the complete pack, intended food, use conditions and destination-market requirements.',
    content: section('Compare the complete construction', table(['Material / component', 'What to evaluate', 'What to request'], [
      ['Kraft paperboard', 'Appearance, thickness, folds, print coverage and exposure to oil or moisture.', 'Exact board grade, lining or barrier specification and a packed sample.'],
      ['White paperboard', 'Print appearance, rigidity, closure and the food-facing surface.', 'Board specification and documentation applicable to the intended use.'],
      ['Corrugated board', 'Flute, liner, packed weight and stacking or transport conditions.', 'Complete board construction, outer-carton details and relevant transit checks.'],
      ['Liners, barriers & windows', 'Contact with hot, wet or oily food; separation and holding time.', 'Component specifications, use limitations and supporting documents for the destination market.']
    ])) + section('Check claims against evidence', list([
      ['Define the actual use', 'Specify food type, temperature, contact duration and whether food touches the printed board directly. Do not assume microwave, oven or freezer compatibility.'],
      ['Review documents for the exact product', 'Ask which specification and use conditions a document covers. A general company certificate is not proof that every packaging format meets your requirements.'],
      ['Qualify environmental statements', 'Recycling and composting depend on the complete construction and local facilities. Request evidence for the exact claim instead of assuming that all paper packs are recyclable or compostable.']
    ])) + section('Turn the intended use into a written specification', table(['Application', 'Details to put in the brief', 'Sample and document checks'], [
      ['Pizza and warm takeaway meals', 'Food-facing liner or board, oily or wet contents, packing temperature, holding time and delivery route.', 'Confirm the complete contact construction. Check grease, moisture, closure and stacking with the actual packed meal; do not infer a heat rating from the board name.'],
      ['Dry bakery and gift assortments', 'Whether food is wrapped, where unwrapped food touches the pack, dividers and any window or adhesive.', 'Identify every food-facing component. Test fit and separation with the actual assortment rather than reusing a document for a different lined carton.'],
      ['Paper cups and beverage carriers', 'Separate the cup, lining and lid from the non-contact outer carrier. Specify the beverage and intended temperature and duration.', 'Review the cup and lid specification separately from handle balance and carrier fit. A carrier specification does not establish cup suitability.'],
      ['Chilled or reheated food', 'Storage conditions, contact time and any planned reheating in the pack.', 'Ask for evidence covering the exact use. Do not assume freezer, microwave or oven compatibility; use another agreed pack if the proposed conditions cannot be supported.']
    ])) + section('Match supporting documents to the pack', list([
      ['Identify the specification', 'Record the carton or cup code, board or lining grade, food-facing components, supplier, document date and revision. Ask whether the document covers the finished article or only a raw material.'],
      ['Check the covered use', 'Compare the food type, time, temperature and destination with the stated scope and limitations. A report for a different lining or use condition is not interchangeable.'],
      ['Keep an approval record', 'Save the agreed dieline, component specification, relevant supporting documents and packed-sample observations together. Recheck the scope if the lining, adhesive, print or intended use changes.']
    ])) + section('Use the destination-market references correctly', `<p>For a United States project, review the FDA guidance on <a href="https://www.fda.gov/food/packaging-food-contact-substances-fcs/determining-regulatory-status-components-food-contact-material" target="_blank" rel="noopener noreferrer">the regulatory status of food-contact components</a> and <a href="https://www.fda.gov/food/packaging-food-contact-substances-fcs/food-types-conditions-use-food-contact-substances" target="_blank" rel="noopener noreferrer">food types and conditions of use</a>. The relevant authorization and its limitations must match the component and intended use; these references are not an MXPACKPRO product certificate.</p><p>For an EU project, the European Commission explains the <a href="https://food.ec.europa.eu/food-safety/chemical-safety/food-contact-materials/legislation_en" target="_blank" rel="noopener noreferrer">general food-contact framework and material-specific rules</a>. Confirm which requirements apply to the complete construction and destination with the responsible compliance specialist. This buying checklist is not a declaration of compliance or legal assessment.</p><p>References checked on <time datetime="${reviewedDate}">28 October 2026</time>. Product-specific documentation and suitability remain subject to project confirmation.</p>`),
    faqs: [
      ['Is kraft board automatically suitable for direct food contact?', 'No. The colour or material name does not establish suitability. Confirm the complete food-facing construction, the food type, contact time and temperature, and documentation for the intended destination and use.'],
      ['Can one test report cover every box in my order?', 'Do not assume so. Check the product or material code, components, test scope, use conditions and limitations. Ask the supplier to explain which items and specifications the supporting documents cover before approval.'],
      ['What should I send for a material recommendation?', 'Send the packed product dimensions and weight, whether food is wrapped, food type, packing and storage conditions, expected contact time, delivery country and any reheating plans. Mark unknown items so they can be reviewed before a quotation is confirmed.']
    ],
    related: ['custom-corrugated-pizza-box', 'custom-printed-coffee-paper-cup']
  },
  'moq-pricing-guide': {
    intro: 'Check the selected product for its listed starting MOQ. Final MOQ and price depend on the approved size, material, printing and quantity per design; they are confirmed in the quotation.',
    content: section('Compare like-for-like quotations', table(['Quotation item', 'Information to provide', 'Why it changes the comparison'], [
      ['Format & size', 'Internal dimensions, packed weight and any insert or liner.', 'Material consumption and construction differ by specification.'],
      ['Order quantity', 'Units per size and artwork version; repeat-order plan if known.', 'A combined total may not satisfy the MOQ for each version.'],
      ['Artwork & finishing', 'Print coverage, number of versions and requested finishes.', 'Setup, tooling and finishing may be quoted separately.'],
      ['Samples & approval', 'Structural or printed sample; delivery destination.', 'Sample charges, revisions and approval timing need a clear scope.'],
      ['Packing & delivery', 'Destination postcode, delivery term and required arrival date.', 'Freight, duties and final delivery are not automatically included in the unit price.']
    ])) + section('A useful quotation brief', list([
      ['Start with the essentials', 'Share the format, internal size, quantity per design, food or product, destination and target arrival date. Attach artwork later if it is not ready.'],
      ['Separate confirmed from estimated', 'Mark undecided items clearly. Ask for suitable alternatives instead of comparing offers based on different assumptions.'],
      ['Confirm the total scope', 'Check sample and tooling charges, production timing after approval, packing, payment terms and the delivery term before ordering.']
    ])),
    related: ['custom-folding-pastry-carton', 'foldable-magnetic-gift-box']
  }
};
for (const [slug, data] of Object.entries(guideData)) {
  if (guideOnly && slug !== guideOnly) continue;
  const filename = path.join(root, `${slug}.html`);
  let page = await fs.readFile(filename, 'utf8');
  const faq = data.faqs ? section('Material ordering questions', `<div class="accordion">${data.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`) : '';
  const attribution = slug === 'materials-food-safety' ? `<p class="catalog-note">By MXPACKPRO team. Updated <time datetime="${reviewedDate}">28 October 2026</time>.</p>` : '';
  const article = `<article class="section section-white buyer-guide"><div class="container"><p class="eyebrow">Practical purchasing guidance</p>${attribution}<p class="section-copy buyer-guide-intro">${data.intro}</p>${data.content}${faq}${section('Compare real formats', `<div class="solution-products buyer-guide-products">${data.related.map(productLink).join('')}</div>`)}</div></article>`;
  page = page.replace(/<article class="section section-white(?: buyer-guide)?">[\s\S]*?<\/article>/, article);
  if (data.title) {
    page = page.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(data.title)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(data.title)}`)
      .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g, `$1${esc(data.description)}`);
    page = page.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (all, json) => {
      const schema = JSON.parse(json);
      if (schema['@type'] !== 'Article') return all;
      schema.description = data.description;
      schema.dateModified = reviewedDate;
      schema.mainEntityOfPage = `https://mxpackpro.com/${slug}`;
      return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    });
  }
  if (data.faqs) {
    page = page.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage"[\s\S]*?<\/script>/g, '');
    const schema = {'@context':'https://schema.org', '@type':'FAQPage', mainEntity:data.faqs.map(([name, text]) => ({'@type':'Question', name, acceptedAnswer:{'@type':'Answer', text}}))};
    page = page.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script></head>`);
  }
  await fs.writeFile(filename, compactInteractionHtml(page, '/' + slug));
}
if (guideOnly && !guideData[guideOnly]) throw new Error(`Unknown guide: ${guideOnly}`);
if (!guideOnly || guideOnly === 'materials-food-safety') {
  const sitemapPath = path.join(root, 'sitemap.xml');
  const sitemap = await fs.readFile(sitemapPath, 'utf8');
  await fs.writeFile(sitemapPath, sitemap.replace(/(<loc>https:\/\/mxpackpro.com\/materials-food-safety<\/loc><lastmod>)[^<]+/, `$1${reviewedDate}`));
}

// Retire the old generic MOQ claim in visible content and matching JSON-LD together.
for (const entry of guideOnly ? [] : await fs.readdir(root)) {
  if (!entry.endsWith('.html')) continue;
  const filename = path.join(root, entry);
  const original = await fs.readFile(filename, 'utf8');
  const updated = original
    .replaceAll('Selected projects can start from 200 pieces; send us', 'Starting MOQ depends on the format, size and print design; send us')
    .replaceAll('From 200 pieces for selected projects', 'Confirmed by format, size and print design')
    .replaceAll('Selected projects from 200 pieces', 'MOQ confirmed for your selected format')
    .replaceAll('Selected formats from 200 pieces with custom print and sample support.', 'Custom print and sample support, with MOQ confirmed by packaging format.');
  if (updated !== original) await fs.writeFile(filename, updated);
}
console.log(guideOnly ? `Updated only ${guideOnly}.` : 'Updated five solution journeys, three purchasing guides and legacy MOQ wording.');
