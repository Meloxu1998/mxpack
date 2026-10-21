import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'index.html');
let html=fs.readFileSync(file,'utf8');
const products=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-products.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-provenance.json'),'utf8')).products;
const base='https://mxpackpro.com';
const moqOptions=[...new Set(products.map(product=>sources.find(source=>source.id===product.sourceId)?.minimumOrder))].sort((a,b)=>a-b);
if(moqOptions.some(value=>!Number.isFinite(value)||value<=0))throw new Error('Every displayed product needs a verified starting MOQ.');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const icon=name=>`<i class="icon" data-lucide="${name}" aria-hidden="true"></i>`;
const families=[
 ['Takeout food boxes','takeaway-food-boxes','window-grazing-box-with-dividers','Meal cartons, trays & grazing boxes'],
 ['Burger boxes','burger-boxes','custom-burger-clamshell-box','Hinged cartons for burgers & sandwiches'],
 ['Pizza boxes','pizza-boxes','custom-corrugated-pizza-box','Corrugated formats for takeaway pizza'],
 ['Paper cups & carriers','paper-cups','custom-printed-coffee-paper-cup','Printed cups and practical drink carriers'],
 ['Paper bags','custom-paper-bags','custom-bakery-carrier-bag','Bakery, takeaway & retail carry bags'],
 ['Bakery & cake boxes','bakery-cake-boxes','tall-cake-box-with-handles','Pastry cartons, cake carriers & sleeves']
];
const cards=families.map(([name,slug,productSlug,copy])=>{
 const product=products.find(p=>p.slug===productSlug);
 const source=sources.find(p=>p.id===product.sourceId);
 if(!product||!source)throw new Error(`Missing family source: ${slug}`);
 return `<a class="home-family" href="/${slug}" data-home-family="${slug}" data-track="home_category_click"><div class="home-family-media"><img src="${source.thumbnailPath}" srcset="${source.thumbnailPath} 480w, ${source.imagePath} 960w" sizes="(max-width:600px) calc((100vw - 56px) / 2), (max-width:1000px) 45vw, 390px" alt="${esc(product.name)}" width="480" height="480" loading="lazy" decoding="async"></div><div class="home-family-title"><h3>${esc(name)}</h3>${icon('arrow-right')}</div><p>${esc(copy)}</p></a>`;
}).join('');
const trust=html.match(/<section class="trust-strip"[\s\S]*?<\/section>/)?.[0]?.replace(/<img\b([^>]*?)>/g,(match,attrs)=>attrs.includes('loading=')?match:`<img loading="lazy" decoding="async" fetchpriority="low"${attrs}>`);
if(!trust)throw new Error('Existing customer artwork strip missing.');
const faqs=[
 ['Which food packaging products can I order?','Compare takeout boxes, burger boxes, pizza cartons, paper cups and carriers, paper bags, and bakery packaging. The full catalog also includes BBQ packaging, catering, retail and gift formats.','/products',`View all ${products.length} formats`],
 ['What is the minimum order quantity?',`The current catalog lists starting quantities of ${moqOptions.join(' or ')} pieces by format. Final MOQ is confirmed for each size, material and print design, rather than the combined order total.`,'/moq-pricing-guide','Understand MOQ & pricing'],
 ['Can I customize the size and printing?','Share the packed product dimensions, required quantity and artwork if available. We review the structure, material, print area and dieline before confirming a specification.','/custom-packaging','Review custom packaging'],
 ['Can I review a sample before production?','Ask for a structural or printed sample for your proposed specification. Sample scope, charges and timing are confirmed with the project; test the packed product before approving production.','/custom-packaging#samples','Plan sampling'],
 ['What should I send for a quotation?','Send the packaging type, internal size, quantity per design, food or product, delivery country and target arrival date. Include artwork if it is ready, and mark undecided details clearly.','/get-a-quote','Send your packaging brief'],
 ['Which materials and food-contact documents should I request?','Specify the food type, packing temperature, contact time and destination market. Request documents for the exact material and use conditions; a general certificate does not establish suitability for every product.','/materials-food-safety','Check material requirements'],
 ['How long do production and shipping take?','Timing is confirmed after the structure, quantity, print and sample approval requirements are known. Share your destination postcode and required arrival date so production and freight can be reviewed together.','/get-a-quote','Discuss your schedule']
];
const faqHtml=faqs.map(([question,answer,url,label],i)=>`<details${i===0?' open':''}><summary>${esc(question)}${icon('chevron-down')}</summary><div><p>${esc(answer)}</p><a class="text-link" href="${url}">${esc(label)}</a></div></details>`).join('');
const main=`<main id="main">
  <section class="home-stage" aria-labelledby="home-title">
    <div class="home-stage-media"><picture><source media="(max-width:1240px)" srcset="/assets/img/home/packaging-family-mobile-480.webp 480w, /assets/img/home/packaging-family-mobile-800.webp 800w, /assets/img/home/packaging-family-mobile-1200.webp 1200w" sizes="(max-width:600px) 100vw, 600px"><img src="/assets/img/home/packaging-family-desktop-1280.webp" srcset="/assets/img/home/packaging-family-desktop-1280.webp 1280w, /assets/img/home/packaging-family-desktop-1860.webp 1860w" sizes="100vw" alt="Coordinated custom food boxes, paper cup and carry bag with a shared print design; packaging concept" width="1860" height="846" fetchpriority="high"></picture><span class="home-image-note">Custom print concept</span></div>
    <div class="container home-stage-inner"><div class="home-stage-copy"><p class="eyebrow">MXPACKPRO / Foodservice packaging</p><h1 id="home-title">Custom food packaging.</h1><p class="home-stage-strap">Made for your brand.</p><p class="home-stage-description">Custom boxes, cups and bags for restaurants, bakeries and food brands. Sizes, materials and print reviewed for your project.</p><div class="hero-actions"><a class="button button-dark" href="/products" data-home-action="explore">Explore products ${icon('arrow-right')}</a><a class="button home-outline" href="/get-a-quote" data-track="quote_home_hero_click">Request a quote ${icon('arrow-right')}</a></div></div></div>
  </section>
  <section class="home-facts" aria-label="Packaging range and purchasing basics"><div class="container home-facts-grid"><a href="/products"><strong>${products.length} distinct formats</strong><span>Boxes, cups, carriers & bags</span></a><a href="/moq-pricing-guide"><strong>From ${moqOptions[0]} pcs*</strong><span>Listed starting quantities</span></a><a href="/custom-packaging"><strong>Custom size & print</strong><span>Reviewed around your product</span></a></div><p class="container home-moq-note">*Final MOQ is confirmed per size, material and print design.</p></section>
  <section class="home-collections" id="packaging"><div class="container"><div class="home-section-head"><div><p class="eyebrow">The packaging collection</p><h2>Find your format.</h2></div><div><p>Start with what you serve. Compare the shapes, materials and print options for your next order.</p><a class="text-link" href="/products">Browse all ${products.length} products</a></div></div><div class="home-families">${cards}</div></div></section>
  ${trust}
  <section class="home-custom" id="custom-packaging"><div class="container home-custom-grid"><div class="home-custom-copy"><p class="eyebrow">Your brand, across the range</p><h2>Custom size.<br>Custom print.</h2><p class="home-section-description">Build a coordinated packaging range around your product and the way your team packs it.</p><ol class="home-approval-steps"><li><span>01</span><div><h3>Define the fit</h3><p>Food, internal dimensions, carrying weight and quantity.</p></div></li><li><span>02</span><div><h3>Review the specification</h3><p>Material, artwork, print placement and dieline.</p></div></li><li><span>03</span><div><h3>Approve before production</h3><p>Sample scope, final details, packing and delivery terms.</p></div></li></ol><a class="button button-dark" href="/custom-packaging">Plan custom packaging ${icon('arrow-right')}</a></div><figure class="home-custom-media"><img src="/assets/img/v4/custom-packaging-hero.webp" alt="Matching print concept on a burger carton and paper cup" width="1536" height="1024" loading="lazy" decoding="async"><figcaption>Custom print concept</figcaption></figure></div><div class="container home-business-links"><span>Packaging for your operation</span><a href="/solutions#restaurants">Restaurants & takeaway ${icon('arrow-right')}</a><a href="/solutions#catering">Catering & events ${icon('arrow-right')}</a><a href="/solutions#food-brands">Food brands & retail ${icon('arrow-right')}</a></div></section>
  <section class="home-purchasing" aria-labelledby="purchasing-title"><div class="container"><div class="home-section-head"><div><p class="eyebrow">Before you order</p><h2 id="purchasing-title">Know what you are approving.</h2></div><a class="text-link" href="/resources">Purchasing resources</a></div><div class="home-purchasing-grid"><article>${icon('boxes')}<h3>Quantity by format</h3><p>Check the MOQ for every size and artwork version, with setup and delivery clearly scoped.</p><a class="text-link" href="/moq-pricing-guide">MOQ & pricing</a></article><article>${icon('layers-3')}<h3>Materials for actual use</h3><p>Review the food, temperature and contact time alongside your destination-market requirements.</p><a class="text-link" href="/materials-food-safety">Materials & food safety</a></article><article>${icon('clipboard-list')}<h3>A packed sample</h3><p>Check fit, closing, carrying and the service journey with your actual food or product.</p><a class="text-link" href="/packaging-buying-guide">Packaging buying guide</a></article></div></div></section>
  <section class="home-company-faq"><div class="container home-company-grid"><div class="home-company-copy"><p class="eyebrow">Meet MXPACKPRO</p><h2>Your packaging partner in Foshan, China.</h2><p>MXPACKPRO is the packaging brand of Foshan Xumelo Technology Co., Ltd. We coordinate packaging structures, printing, samples and export delivery for overseas buyers.</p><p>Compare the formats, then confirm the exact specification for your food, brand and destination.</p><a class="text-link" href="/about-us">About our approach</a><div class="home-direct-contact"><a href="mailto:sales@mxpackpro.com" data-track="email_click">${icon('mail')}<span>sales@mxpackpro.com</span></a><a href="tel:+8615521163050" data-track="phone_click">${icon('phone')}<span>+86 155 2116 3050</span></a></div></div><div class="home-faq"><div class="home-faq-heading"><h2>Ordering questions</h2><a class="text-link" href="/faq">All FAQs</a></div><div class="home-questions">${faqHtml}</div></div></div></section>
  <section class="home-final-cta"><div class="container"><div><p class="eyebrow">Start your packaging project</p><h2>Tell us what you are packing.</h2><p>Share the format, quantity and destination. We will help define the next step.</p></div><a class="button" href="/get-a-quote" data-track="quote_home_final_click">Request a quote ${icon('arrow-right')}</a></div></section>
</main>`;
html=html.replace(/<main\b[\s\S]*?<\/main>/,main);
html=html.replace(/<body(?:\s+[^>]*)?>/,'<body class="home-premium" data-contact-prompt-mode="off">');
html=html.replace(/\s*<link rel="preload" as="image"[^>]*>/g,'');
html=html.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/home-premium\.css[^>]*>/g,'');
const assets=`  <link rel="preload" as="image" href="/assets/img/home/packaging-family-desktop-1280.webp" imagesrcset="/assets/img/home/packaging-family-desktop-1280.webp 1280w, /assets/img/home/packaging-family-desktop-1860.webp 1860w" imagesizes="100vw" media="(min-width:1241px)" fetchpriority="high">
  <link rel="preload" as="image" href="/assets/img/home/packaging-family-mobile-480.webp" imagesrcset="/assets/img/home/packaging-family-mobile-480.webp 480w, /assets/img/home/packaging-family-mobile-800.webp 800w, /assets/img/home/packaging-family-mobile-1200.webp 1200w" imagesizes="(max-width:600px) 100vw, 600px" media="(max-width:1240px)" fetchpriority="high">
  <link rel="stylesheet" href="/assets/css/home-premium.css?v=20261021-1">`;
html=html.replace(/<link rel="stylesheet" href="\/assets\/css\/v4\.min\.css\?v=[^"]+">/,`<link rel="stylesheet" href="/assets/css/v4.min.css?v=20261021-5">\n${assets}`);
const title='Custom Food Packaging Supplier | Boxes, Cups & Bags | MXPACKPRO';
const description='Explore custom food boxes, paper cups and paper bags from MXPACKPRO in Foshan, China. Compare formats, MOQ, printing and samples. Request a quote.';
html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(title)}</title>`)
 .replace(/(<meta name="description" content=")[^"]*/,`$1${esc(description)}`)
 .replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(title)}`)
 .replace(/(<meta property="og:description" content=")[^"]*/,`$1${esc(description)}`)
 .replace(/(<meta property="og:image" content=")[^"]*/,`$1${base}/assets/img/home/packaging-family-desktop-1860.webp`)
 .replace(/v4\.js\?v=[^"]+/,'v4.js?v=20261021-9')
 .replace(/inquiry-analytics\.js\?v=[^"]+/,'inquiry-analytics.js?v=20261021-4');
html=html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
const graph=[
 {'@type':'Organization','@id':`${base}/#organization`,name:'MXPACKPRO',legalName:'Foshan Xumelo Technology Co., Ltd.',url:base,email:'sales@mxpackpro.com',telephone:'+86 155 2116 3050',logo:{'@type':'ImageObject',url:`${base}/assets/img/brand/mxpack-logo.svg`},address:{'@type':'PostalAddress',addressLocality:'Foshan',addressRegion:'Guangdong',addressCountry:'CN'},contactPoint:[{'@type':'ContactPoint',telephone:'+86 155 2116 3050',contactType:'sales',availableLanguage:['English','Chinese']}]},
 {'@type':'WebSite','@id':`${base}/#website`,name:'MXPACKPRO',url:`${base}/`,publisher:{'@id':`${base}/#organization`},inLanguage:'en'},
 {'@type':'WebPage','@id':`${base}/#webpage`,name:title,description,url:`${base}/`,isPartOf:{'@id':`${base}/#website`},about:{'@id':`${base}/#organization`},inLanguage:'en',primaryImageOfPage:{'@type':'ImageObject',url:`${base}/assets/img/home/packaging-family-desktop-1860.webp`,caption:'Custom food packaging print concept'},mainEntity:{'@type':'ItemList',name:'Food packaging categories',numberOfItems:families.length,itemListElement:families.map(([name,slug],i)=>({'@type':'ListItem',position:i+1,name,url:`${base}/${slug}`}))}}
];
html=html.replace('</head>',`  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph})}</script>\n</head>`);
fs.writeFileSync(file,html);
console.log('Rebuilt homepage: six real product categories, procurement content, seven ordering answers, connected entity markup and responsive concept media.');
