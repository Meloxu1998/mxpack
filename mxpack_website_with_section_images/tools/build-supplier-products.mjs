import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://mxpackpro.com';
const content = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-products.json'), 'utf8'));
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-provenance.json'), 'utf8'));
const sourceById = new Map(provenance.products.map(p => [p.id, p]));
const products = content.map(p => ({...p, ...{source: sourceById.get(p.sourceId)}}));
if (products.length !== 20 || products.some(p => !p.source) || new Set(products.map(p => p.slug)).size !== 20) {
  throw new Error('Catalog must contain 20 unique, source-backed products.');
}
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const json = data => JSON.stringify(data).replace(/</g, '\\u003c');
const schema = data => `<script type="application/ld+json">${json({'@context':'https://schema.org', ...data})}</script>`;
const url = p => `/products/${p.slug}`;
const quote = p => `/get-a-quote?product=${p.slug}&source=product-detail`;
const categoryNames = {'food-boxes':'Food boxes',bakery:'Bakery',catering:'Catering',drinkware:'Cups & carriers',bags:'Paper bags',retail:'Mailers & gifts'};
const image = (p, lazy = true) => `<img src="${p.source.imagePath}" srcset="${p.source.thumbnailPath} 480w, ${p.source.imagePath} 960w" sizes="(max-width: 760px) 100vw, (max-width: 1060px) 50vw, 33vw" alt="${esc(p.name)} with example custom printed artwork" width="960" height="960" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'}>`;
const rootify = html => html.replace(/\b(href|src)="([^"#][^"]*)"/g, (match, attr, value) =>
  /^(?:\/|https?:|mailto:|tel:|data:)/.test(value) ? match : `${attr}="/${value}"`);
let catalog = fs.readFileSync(path.join(root, 'products.html'), 'utf8');
catalog = catalog.replace(/<p class="catalog-empty"[^>]*>[\s\S]*?<\/p>/g, '');
const header = rootify(catalog.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] || '');
const footer = rootify(catalog.slice(catalog.indexOf('<footer class="site-footer">')));
const head = rootify(catalog.match(/<head>([\s\S]*?)<\/head>/)?.[1] || '')
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'')
  .replace(/\s*<link rel="stylesheet" href="\/assets\/css\/(?:products-catalog-v2|catalog-products).css[^>]+>/g,'');
if (!header || !footer || !head) throw new Error('Approved page shell not found.');
const extraCss = '<link rel="stylesheet" href="/assets/css/catalog-products.css?v=20261021-1">';
const organization = { '@type':'Organization', name:'MXPACKPRO', url:base, email:'sales@mxpackpro.com', telephone:'+86 155 2116 3050'};
fs.mkdirSync(path.join(root, 'products'), {recursive:true});

for (const p of products) {
  const title = `${p.keyword.replace(/^./, c => c.toUpperCase())} | MXPACKPRO`;
  const description = `Order ${p.keyword} from MXPACKPRO. MOQ from ${p.source.minimumOrder} pieces; sizes, materials, samples and delivery reviewed for your project.`;
  const pageHead = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(description)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${base}${url(p)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(description)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}${url(p)}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${base}${p.source.imagePath}`);
  const faq = [[p.question,p.answer],
    [`What is the starting order quantity for ${p.name.toLowerCase()}?`, `The supplier catalog lists a starting order of ${p.source.minimumOrder} pieces for this format. The final minimum depends on the approved size, board, print process and packing arrangement. Your project quotation confirms the applicable quantity.`],
    ['What should I send for an accurate quotation?', `Send ${p.measure.toLowerCase()}, the order quantity, artwork status and delivery country. Tell us the intended use and target date so the sample route, board specification and production schedule can be reviewed.`],
    ['Can I check a sample before production?', 'Ask about the available stock sample or a custom structural prototype. A sample should be checked with your actual product before approving the dieline and print. Sample charges, shipping and timing are confirmed in the quotation.']];
  const related = products.filter(q=>q.slug!==p.slug && q.category===p.category).concat(products.filter(q=>q.slug!==p.slug && q.category!==p.category)).slice(0,3);
  const familyLink = p.family === 'products' ? '/products' : `/${p.family}`;
  const body = `<main id="main"><div class="container product-breadcrumb"><a href="/products">All products</a><span>/</span><a href="${familyLink}">${esc(categoryNames[p.category])}</a><span>/</span><span>${esc(p.name)}</span></div>
<section class="detail-hero"><div class="detail-hero-media supplier-product-media">${image(p,false)}</div><div class="detail-hero-copy"><p class="eyebrow">${esc(categoryNames[p.category])} / custom packaging</p><h1 class="display-title">${esc(p.name)}</h1><div class="rule"></div><p>${esc(p.intro)}</p><div class="hero-actions"><a class="button" href="${quote(p)}" data-track="quote_product_click" data-product-id="${p.slug}">Request product pricing <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a><a class="text-link" href="#specifications">Compare specifications</a></div><div class="feature-row"><div class="feature"><i class="icon" data-lucide="layers-3" aria-hidden="true"></i><strong>From ${p.source.minimumOrder} pieces*</strong><span>Confirmed with your specification</span></div><div class="feature"><i class="icon" data-lucide="ruler" aria-hidden="true"></i><strong>Size & fit review</strong><span>Measured around the packed product</span></div><div class="feature"><i class="icon" data-lucide="printer" aria-hidden="true"></i><strong>Your artwork</strong><span>Print and dieline approval</span></div></div></div></section>
<section class="section section-white" id="specifications"><div class="container spec-layout"><div><p class="eyebrow">Before you order</p><h2 class="section-title">Specify the pack you actually need.</h2><table class="spec-table"><tbody><tr><th>Construction</th><td>${esc(p.structure)}</td></tr><tr><th>Material</th><td>${esc(p.material)}</td></tr><tr><th>Size information</th><td>${esc(p.measure)}</td></tr><tr><th>Starting MOQ</th><td>${p.source.minimumOrder} pieces; final minimum confirmed in your quotation</td></tr><tr><th>Print</th><td>Custom logo and artwork; process and finish reviewed against the approved dieline</td></tr><tr><th>Sample</th><td>Stock sample or project-specific prototype, subject to availability and quotation</td></tr><tr><th>Production & delivery</th><td>Schedule and shipping cost confirmed after size, quantity, artwork and destination review</td></tr></tbody></table><p class="catalog-note">*Starting quantity is based on the selected supplier listing. Example artwork and contents show the format; they are not included in your order.</p></div><div><p class="eyebrow">Best suited to</p><h2 class="section-title">Choose for your application.</h2><ul class="check-list">${p.uses.map(use=>`<li>${esc(use)}</li>`).join('')}</ul><p class="section-copy">Food-contact suitability, coatings, load capacity and any market-specific requirements are confirmed for the final specification. Send your product details before making performance or compliance assumptions.</p><a class="text-link" href="/materials-food-safety">Compare materials and food-contact considerations</a></div></div></section>
<section class="section section-cream"><div class="container spec-layout"><div><p class="eyebrow">Buyer checklist</p><h2 class="section-title">Check fit before you commit.</h2><ul class="check-list">${p.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul></div><div><p class="eyebrow">Quotation brief</p><h2 class="section-title">Make the first quote useful.</h2><p class="section-copy">Send your measurements, estimated quantity, artwork status and delivery country. Include the sample checks above and your target date. Pricing is based on the complete specification, not the example image alone.</p><div class="hero-actions"><a class="button button-dark" href="${quote(p)}" data-track="quote_product_click" data-product-id="${p.slug}">Discuss this product <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a><a class="text-link" href="/moq-pricing-guide">What affects the price?</a></div></div></div></section>
<section class="section section-white"><div class="container"><div class="section-head"><div><p class="eyebrow">Purchasing questions</p><h2 class="section-title">Ordering ${esc(p.name.toLowerCase())}.</h2></div></div><div class="accordion">${faq.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
<section class="section section-sage"><div class="container"><div class="section-head"><div><p class="eyebrow">Compare formats</p><h2 class="section-title">Other options for your brief.</h2></div><a class="text-link" href="/products">View all 20 products</a></div><div class="product-grid">${related.map(q=>`<a class="product-card" href="${url(q)}" data-track="catalog_product_click" data-product-id="${q.slug}"><div class="product-card-media supplier-product-media">${image(q)}</div><div class="product-card-body"><h3>${esc(q.name)}</h3><p>From ${q.source.minimumOrder} pieces. ${esc(q.structure)}.</p><span class="text-link">View product</span></div></a>`).join('')}</div></div></section>
<section class="cta-band"><div class="container cta-inner"><span class="cta-icon"><i class="icon" data-lucide="package-open" aria-hidden="true"></i></span><div><h2>Build the right pack around your product.</h2><p>Start with the size, quantity and delivery country. We will review the practical next step.</p></div><a class="button" href="${quote(p)}" data-track="quote_product_click" data-product-id="${p.slug}">Request a quote <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a></div></section></main>`;
  const schemas = [organization, {'@type':'CollectionPage',name:p.name,description:p.intro,url:`${base}${url(p)}`,image:`${base}${p.source.imagePath}`,about:{'@type':'Thing',name:p.keyword},isPartOf:{'@type':'CollectionPage',name:'MXPACKPRO packaging catalog',url:`${base}/products`}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${base}/`},{'@type':'ListItem',position:2,name:'Products',item:`${base}/products`},{'@type':'ListItem',position:3,name:p.name,item:`${base}${url(p)}`}]},
    {'@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}];
  const html = `<!doctype html>\n<html lang="en"><head>${pageHead}\n${extraCss}\n${schemas.map(schema).join('\n')}</head><body class="product-detail-page" data-product-id="${p.slug}"><a class="skip-link" href="#main">Skip to content</a>${header}${body}${footer}`;
  fs.writeFileSync(path.join(root,'products',`${p.slug}.html`), html
    .replace('"@type":"CollectionPage","name":', '"@type":"WebPage","name":')
    .replaceAll('The supplier catalog lists a starting order of', 'This format has a starting order of')
    .replaceAll('Starting quantity is based on the selected supplier listing.', 'Starting quantity applies to the pictured format and is subject to your final specification.'));
}

const cards = products.map(p=>`<article class="catalog-card" data-catalog-category="${p.category}" data-product-id="${p.slug}" data-product-moq="${p.source.minimumOrder}" data-catalog-search="${esc([p.name,p.keyword,...p.uses].join(' ').toLowerCase())}"><a class="catalog-card-media supplier-product-media" href="${url(p)}" data-track="catalog_product_click" data-product-id="${p.slug}">${image(p)}</a><div class="catalog-card-body"><p class="catalog-card-kicker">${esc(categoryNames[p.category])}</p><h2><a href="${url(p)}" data-track="catalog_product_click" data-product-id="${p.slug}">${esc(p.name)}</a></h2><p class="catalog-card-description">${esc(p.intro.split('. ')[0])}.</p><dl class="catalog-specs"><div><dt>Starting MOQ</dt><dd>${p.source.minimumOrder} pieces*</dd></div><div><dt>Format</dt><dd>${esc(p.structure)}</dd></div><div><dt>Best for</dt><dd>${esc(p.uses[0])}</dd></div><div><dt>Custom options</dt><dd>Size, material & print review</dd></div></dl><div class="catalog-card-actions"><a class="text-link" href="${url(p)}" data-track="catalog_product_click" data-product-id="${p.slug}">View specifications</a><a class="button button-dark" href="/get-a-quote?product=${p.slug}&source=catalog" data-track="quote_product_click" data-product-id="${p.slug}">Get pricing</a></div></div></article>`).join('\n');
const filters = `<div class="container catalog-filters" role="group" aria-label="Filter packaging products"><button class="catalog-filter" type="button" data-catalog-filter="all" aria-pressed="true"><i class="icon" data-lucide="layout-grid" aria-hidden="true"></i>All products</button>${Object.entries(categoryNames).map(([value,label])=>`<button class="catalog-filter" type="button" data-catalog-filter="${value}" aria-pressed="false">${label}</button>`).join('')}</div>`;
catalog = catalog.replace(/<div class="container catalog-filters"[\s\S]*?<\/div><\/div><div class="container"><div class="catalog-grid">/,`${filters}</div><div class="container"><div class="catalog-search-row"><label class="catalog-search"><i class="icon" data-lucide="search" aria-hidden="true"></i><span class="sr-only">Search packaging products</span><input type="search" data-catalog-search-input placeholder="Search by product or use" autocomplete="off"></label><label class="catalog-sort"><span>Sort by</span><select data-catalog-sort><option value="recommended">Recommended</option><option value="moq">Lowest starting MOQ</option><option value="name">Name: A to Z</option></select></label><p data-catalog-result-count role="status" aria-live="polite">20 products</p></div><div class="catalog-grid">`);
catalog = catalog.replace(/(<div class="catalog-grid">)[\s\S]*?(<\/div><p class="catalog-note">)/,`$1\n${cards}\n$2`);
catalog = catalog.replace(/<p class="catalog-note">[\s\S]*?<\/p>/, '<p class="catalog-note">*Starting MOQ is taken from the selected supplier listing. Final quantity, size, materials, print, price and schedule are confirmed with your project brief. Color and artwork variants of the same structure are grouped together.</p><p class="catalog-empty" data-catalog-empty hidden>No products match your selection. Try another search or category.</p>');
catalog = catalog.replace('Compare six practical packaging families for takeaway, delivery, drinks, bakery and retail.','Compare 20 packaging formats for takeaway, catering, drinks, bakery and retail.');
catalog = catalog.replace('Six core product families','20 selected packaging formats').replace('Selected formats from 200 pcs','MOQ shown by product').replace('MOQ confirmed by structure and print method','Starting quantities from verified supplier listings');
catalog = catalog.replaceAll('Selected custom formats can start from 200 pieces. The applicable MOQ depends on structure, material, size and printing method.', 'The listed formats start from 250 or 300 pieces, depending on the product. The applicable MOQ is confirmed for your structure, material, size and printing method.')
  .replaceAll('Starting MOQ is taken from the selected supplier listing.', 'Starting MOQ applies to the pictured format and is subject to your final specification.')
  .replaceAll('Starting quantities from verified supplier listings', 'Confirm the minimum for your exact specification');
catalog = catalog.replace('Compare six core food packaging families with custom printing, selected low-MOQ formats, samples and export support.','Compare 20 distinct packaging formats, starting quantities and buyer specifications with custom print and sample support.');
catalog = catalog.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"CollectionPage"[\s\S]*?<\/script>/,schema({'@type':'CollectionPage',name:'Custom Food Packaging Products',url:`${base}/products`,dateModified:'2026-10-21',mainEntity:{'@type':'ItemList',numberOfItems:products.length,itemListElement:products.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:`${base}${url(p)}`}))}}));
if (!catalog.includes('data-catalog-search-input') || (catalog.match(/data-catalog-category=/g)||[]).length!==20) throw new Error('Catalog replacement did not produce exactly 20 cards.');
if (!catalog.includes('/assets/css/catalog-products.css')) catalog=catalog.replace('</head>',`  ${extraCss}\n</head>`);
catalog=catalog.replaceAll('products-catalog-v2.js?v=20261009-1','products-catalog-v2.js?v=20261021-1');
fs.writeFileSync(path.join(root,'products.html'),catalog);

for (const family of ['burger-boxes','takeaway-food-boxes','pizza-boxes','paper-cups','custom-paper-bags','bakery-cake-boxes']) {
  const file=path.join(root,`${family}.html`);
  let html=fs.readFileSync(file,'utf8').replace(/<section class="section section-white" data-supplier-formats[\s\S]*?<\/section>/g,'');
  const familyProducts=products.filter(p=>p.family===family);
  const section=`<section class="section section-white" data-supplier-formats><div class="container"><div class="section-head"><div><p class="eyebrow">Available formats</p><h2 class="section-title">Compare product-specific specifications.</h2></div><a class="text-link" href="/products">Full product catalog</a></div><div class="product-grid">${familyProducts.map(p=>`<a class="product-card" href="${url(p)}" data-track="catalog_product_click" data-product-id="${p.slug}"><div class="product-card-media supplier-product-media">${image(p)}</div><div class="product-card-body"><h3>${esc(p.name)}</h3><p>From ${p.source.minimumOrder} pieces. ${esc(p.structure)}.</p><span class="text-link">View specifications</span></div></a>`).join('')}</div></div></section>`;
  html=html.replace('<section class="cta-band">',`${section}<section class="cta-band">`);
  if (!html.includes('/assets/css/catalog-products.css')) html=html.replace('</head>',`  ${extraCss}\n</head>`);
  fs.writeFileSync(file,html);
}

const sitemapPath=path.join(root,'sitemap.xml');
let sitemap=fs.readFileSync(sitemapPath,'utf8');
for(const p of products) if(!sitemap.includes(`<loc>${base}${url(p)}</loc>`)) sitemap=sitemap.replace('</urlset>',`  <url><loc>${base}${url(p)}</loc><lastmod>2026-10-21</lastmod></url>\n</urlset>`);
fs.writeFileSync(sitemapPath,sitemap);
fs.writeFileSync(path.join(root,'seo-system/data/catalog-keyword-map.csv'),`product_id,primary_keyword,landing_page,category,starting_moq,source_id\n${products.map(p=>[p.slug,p.keyword,`${base}${url(p)}`,p.category,p.source.minimumOrder,p.sourceId].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')}\n`);
console.log('Built 20 source-backed product pages, category links, searchable catalog and sitemap entries.');
