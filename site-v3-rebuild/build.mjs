import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, nav, products, solutions, articles } from './src/data.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
const sourceAssets = path.resolve(root, '..', 'site-v2-preview', 'assets', 'img');
const generatedAssets = path.join(root, 'assets', 'img', 'v4');

const icon = (name) => `<i class="icon" data-lucide="${name}" aria-hidden="true"></i>`;
const arrow = () => icon('arrow-right');
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

function analytics() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=G-9VZK4M6KDS"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-9VZK4M6KDS');</script>`;
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    legalName: site.company,
    url: site.domain,
    email: site.email,
    telephone: site.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Foshan', addressCountry: 'CN' },
    contactPoint: [{ '@type': 'ContactPoint', telephone: site.phone, contactType: 'sales', availableLanguage: ['English', 'Chinese'] }]
  };
}

function head({ title, description, slug = '', image = 'assets/img/home/hero-restaurant-packaging.webp', schema = [], noindex = false }) {
  const canonical = `${site.domain}/${slug.replace(/\.html$/, '')}`;
  const pageName = title.split('|')[0].trim();
  const breadcrumb = slug ? { '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    { '@type':'ListItem',position:1,name:'Home',item:`${site.domain}/` },
    { '@type':'ListItem',position:2,name:pageName,item:canonical }
  ] } : null;
  const website = !slug ? { '@context':'https://schema.org','@type':'WebSite',name:site.name,url:`${site.domain}/`,inLanguage:'en' } : null;
  const schemas = [organizationSchema(), website, breadcrumb, ...schema].filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.domain}/${image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" href="assets/img/brand/mxpack-logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/css/v4.css?v=20260825-1">
  ${analytics()}
  ${schemas.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('\n  ')}
</head>`;
}

function brand() {
  return `<span class="brand-mark"><img src="assets/img/brand/mxpack-logo.svg" alt=""></span><span class="brand-word">MX<span class="accent">PACK</span>PRO</span>`;
}

function header(active = '') {
  const desktop = nav.map((group) => `<div class="nav-group">
    <a class="nav-trigger" href="${group.href}"${active === group.label ? ' aria-current="page"' : ''}>${group.label}${icon('chevron-down')}</a>
    <div class="mega-menu">${group.items.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</div>
  </div>`).join('');
  const mobile = nav.map((group) => `<details><summary>${group.label}</summary>${group.items.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</details>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="index.html" aria-label="MXPACKPRO home">${brand()}</a>
    <nav class="nav-links" aria-label="Main navigation">${desktop}</nav>
    <a class="button nav-quote" href="get-a-quote.html">Request a quote ${arrow()}</a>
    <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-label="Open navigation">${icon('menu')}</button>
  </div>
  <nav class="mobile-menu" data-mobile-menu aria-label="Mobile navigation">${mobile}<a href="about-us.html">About MX PACK</a><a class="button" href="get-a-quote.html">Request a quote ${arrow()}</a></nav>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a class="brand" href="index.html">${brand()}</a><p>Factory-direct custom food packaging with low-MOQ project support and global export service from Foshan, China.</p><p><a href="tel:${site.phoneHref}" data-track="phone_click">${site.phone}</a><br><a href="mailto:${site.email}" data-track="email_click">${site.email}</a></p></div>
      <div><h3>Products</h3><ul><li><a href="takeaway-food-boxes.html">Takeout Boxes</a></li><li><a href="burger-boxes.html">Burger Boxes</a></li><li><a href="pizza-boxes.html">Pizza Boxes</a></li><li><a href="custom-paper-bags.html">Paper Bags</a></li><li><a href="products.html">View all products</a></li></ul></div>
      <div><h3>Solutions</h3><ul><li><a href="solutions.html#restaurants">Restaurants</a></li><li><a href="solutions.html#catering">Catering</a></li><li><a href="solutions.html#food-brands">Food brands</a></li><li><a href="solutions.html#startups">Startups</a></li><li><a href="solutions.html#enterprise">Enterprise</a></li></ul></div>
      <div><h3>Resources</h3><ul><li><a href="resources.html">Resource center</a></li><li><a href="packaging-buying-guide.html">Buying guide</a></li><li><a href="materials-food-safety.html">Materials guide</a></li><li><a href="moq-pricing-guide.html">MOQ & pricing</a></li><li><a href="faq.html">FAQ</a></li></ul></div>
      <div><h3>Company</h3><ul><li><a href="about-us.html">About MXPACKPRO</a></li><li><a href="about-us.html#process">Our process</a></li><li><a href="about-us.html#quality">Quality approach</a></li><li><a href="get-a-quote.html">Contact us</a></li><li><a href="get-a-quote.html">Request a quote</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© 2026 ${site.company}. All rights reserved.</span><span class="footer-legal"><a href="privacy-policy.html">Privacy</a><a href="terms.html">Terms</a><a href="sitemap.xml">Sitemap</a></span></div>
  </div>
</footer>
<div class="floating-contact">
  <a class="wa" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with MXPACKPRO on WhatsApp" data-track="whatsapp_click">${icon('message-circle')}</a>
  <a class="mail" href="mailto:${site.email}" aria-label="Email MXPACKPRO" data-track="email_click">${icon('mail')}</a>
</div>
<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>
<script src="assets/js/v4.js?v=20260825-1"></script>`;
}

function layout(meta, body, active = '') {
  return `${head(meta)}<body>${header(active)}<main id="main">${body}</main>${footer()}</body></html>`;
}

function trustStrip() {
  const logos = [
    ['collection-sweet-bites.png', 'Sweet Bites', ''],
    ['collection-texas-womans-university.png', "Texas Woman's University", ''],
    ['collection-cowboys.png', 'Cowboys', ''],
    ['collection-ltk.png', 'LTK', ''],
    ['collection-sugoi-mart.png', 'Sugoi Mart', ''],
    ['collection-peter-fell.png', 'Peter Fell', ''],
    ['collection-pro-supra.png', 'Pro Supra', ''],
    ['collection-three-hills.png', 'Three Hills', ''],
    ['color-3-transparent.svg', 'Customer logo', 'color3'],
    ['duc.svg', 'DUC', 'duc']
  ];
  const group = logos.map(([src, alt, cls]) => `<span class="logo-item ${cls}"><img src="assets/img/client-logos/${src}" alt="${alt}"></span>`).join('');
  return `<section class="trust-strip" aria-label="Selected customer brands"><p class="trust-label">Packaging projects delivered for brands and organizations worldwide</p><div class="logo-viewport"><div class="logo-track"><div class="logo-group">${group}</div><div class="logo-group" aria-hidden="true">${group}</div></div></div></section>`;
}

function ctaBand(title = 'Ready to build better food packaging?', copy = 'Tell us what you need and our team will help shape the right solution.') {
  return `<section class="cta-band"><div class="container cta-inner"><span class="cta-icon">${icon('package-open')}</span><div><h2>${title}</h2><p>${copy}</p></div><a class="button" href="get-a-quote.html">Request a quote ${arrow()}</a></div></section>`;
}

function homePage() {
  const categoryCards = [
    ['Takeout Boxes', 'Durable, leak-resistant formats for hot meals, burgers and sides.', 'home/category-takeout-boxes.webp', 'takeaway-food-boxes.html', 'green'],
    ['Paper Cups', 'Printed hot and cold cups that carry your brand beyond the counter.', 'home/category-paper-cup.webp', 'paper-cups.html', 'coral'],
    ['Paper Bags', 'Strong, practical bags for takeaway, delivery and retail.', 'home/category-paper-bag.webp', 'custom-paper-bags.html', 'gold'],
    ['Custom Packaging', 'Packaging developed around your product, budget and brand goals.', 'home/category-custom-packaging.webp', 'custom-packaging.html', 'sage']
  ].map(([title, copy, img, href, cls]) => `<a class="category-card ${cls}" href="${href}"><div class="category-copy"><h2>${title}</h2><p>${copy}</p></div><img src="assets/img/${img}" alt="${title}" loading="lazy"><span class="category-link">Explore ${title.toLowerCase()} →</span></a>`).join('');
  const solutionCards = [
    ['sandwich', 'Restaurants', 'Reliable packaging for dine-out, takeaway and delivery.', 'solutions.html#restaurants'],
    ['coffee', 'Cafes & Coffee Shops', 'Cups, bags and accessories for everyday service.', 'solutions.html#restaurants'],
    ['shopping-bag', 'QSR & Fast Casual', 'Speed, consistency and practical high-volume formats.', 'solutions.html#enterprise'],
    ['soup', 'Food Trucks', 'Compact packaging built for food on the go.', 'solutions.html#restaurants'],
    ['briefcase-business', 'Caterers', 'Professional packaging for events of every size.', 'solutions.html#catering'],
    ['store', 'Grocery & Retail', 'Attractive packaging for retail-ready foods.', 'solutions.html#food-brands']
  ].map(([ic, title, copy, href]) => `<article class="solution-card">${icon(ic)}<h3>${title}</h3><p>${copy}</p><a href="${href}">Learn more →</a></article>`).join('');

  const body = `<section class="home-hero">
    <div class="home-hero-copy-wrap"><div class="home-hero-copy"><p class="eyebrow lime">Foodservice packaging, made for your brand</p><h1 class="display-title">Packaging that makes your food look as good as it tastes.</h1><p>Custom food packaging for restaurants, cafes and food brands, with low-MOQ support, food-grade material options and export-ready production.</p><div class="hero-actions"><a class="button" href="get-a-quote.html">Start a packaging project ${arrow()}</a><a class="button button-outline" href="products.html">Explore products</a></div><div class="hero-benefits"><span class="hero-benefit">${icon('leaf')}Sustainable options</span><span class="hero-benefit">${icon('shield-check')}Reliable project support</span><span class="hero-benefit">${icon('truck')}Global export service</span></div></div></div>
    <div class="home-hero-media"><img src="assets/img/home/hero-restaurant-packaging.webp" alt="Custom food packaging for restaurant takeaway service" fetchpriority="high"></div>
  </section>
  ${trustStrip()}
  <section class="section section-white"><div class="container"><div class="section-head"><div><p class="eyebrow">Find your packaging</p><h2 class="section-title">Start with the format your food needs.</h2></div><p>Compare practical foodservice packaging, then customize the structure, size and print around your operation.</p></div><div class="category-grid">${categoryCards}</div></div></section>
  <section class="partner-band"><div class="partner-media"><img src="assets/img/home/packaging-group.webp" alt="A coordinated range of food boxes, cups and paper bags" loading="lazy"></div><div class="partner-copy"><p class="eyebrow lime">One source. More possibilities.</p><h2 class="section-title">All your packaging needs, from one reliable partner.</h2><p class="section-copy">MXPACKPRO helps you source coordinated packaging so your team can spend less time managing suppliers and more time serving customers.</p><ul class="check-list"><li>Broad selection of food boxes, cups and bags</li><li>Custom structure, size and printing support</li><li>Low-MOQ options for testing new concepts</li><li>Production coordination and global delivery support</li></ul><a class="button" href="custom-packaging.html">See how custom packaging works ${arrow()}</a></div></section>
  <section class="section section-dark"><div class="container"><div class="section-head"><div><p class="eyebrow lime">Solutions for every business</p><h2 class="section-title">Packaging for every kind of food business.</h2></div></div><div class="solution-grid">${solutionCards}</div></div></section>
  ${ctaBand()}`;
  return layout({ title: 'Custom Food Packaging for Restaurants & Food Brands | MXPACKPRO', description: 'Custom food boxes, paper cups, paper bags and branded food packaging with low-MOQ support and global export service from MXPACKPRO.', slug: '' }, body, '');
}

function productsPage() {
  const cards = products.slice(0, 3).map((product) => productCard(product)).join('');
  const body = `<section class="page-hero hero-image"><img class="page-hero-bg" src="assets/img/products/products-hero-packaging-range.webp" alt="Foodservice packaging range including paper bags, takeout boxes and cups"><div class="page-hero-overlay"></div><div class="container page-hero-inner"><div class="page-hero-copy"><p class="eyebrow">Products</p><h1 class="display-title">Foodservice packaging that works from kitchen to customer.</h1><div class="rule"></div><p>Explore practical paper-based formats for takeaway, delivery, catering and retail food.</p></div></div></section>
  <nav class="category-tabs" aria-label="Product categories"><div class="container category-tabs-inner"><a class="tab-link active" href="products.html">${icon('layout-grid')}All packaging</a><a class="tab-link" href="takeaway-food-boxes.html">${icon('package-open')}Takeout boxes</a><a class="tab-link" href="#cups">${icon('cup-soda')}Paper cups</a><a class="tab-link" href="custom-paper-bags.html">${icon('shopping-bag')}Paper bags</a><a class="tab-link" href="bakery-cake-boxes.html">${icon('cake-slice')}Bakery & deli</a></div></nav>
  <section class="product-list-section"><div class="container"><div class="section-head"><div><p class="eyebrow">Takeout boxes</p><h2 class="section-title">Packaging made for food that travels.</h2></div><p>Choose a proven format, then tell us the size, food type, quantity and artwork you need.</p></div><div class="product-grid">${cards}</div></div></section>
  <section class="section section-sage" id="cups"><div class="container"><div class="section-head"><div><p class="eyebrow">More product families</p><h2 class="section-title">Complete the full takeaway experience.</h2></div></div><div class="category-grid">${[
    ['Paper Cups','Hot and cold cup formats with branded printing options.','home/category-paper-cup.webp','paper-cups.html','coral'],
    ['Paper Bags','Kraft and white bags with twisted or flat handles.','home/category-paper-bag.webp','custom-paper-bags.html','gold'],
    ['Bakery Boxes','Window, handle and insert options for desserts.','v4/bakery-cake-box.webp','bakery-cake-boxes.html','green'],
    ['Custom Projects','Develop a coordinated packaging family around your brand.','home/category-custom-packaging.webp','custom-packaging.html','sage']
  ].map(([t,c,i,h,cl])=>`<a class="category-card ${cl}" href="${h}"><div class="category-copy"><h2>${t}</h2><p>${c}</p></div><img src="assets/img/${i}" alt="${t}" loading="lazy"><span class="category-link">View options →</span></a>`).join('')}</div></div></section>
  ${ctaBand('Let’s build the right packaging together.', 'Share your food, size, quantity and timeline to get a tailored recommendation.')}`;
  return layout({ title: 'Foodservice Packaging Products | MXPACKPRO', description: 'Explore custom takeout boxes, burger boxes, pizza boxes, paper cups, paper bags and bakery packaging from MXPACKPRO.', slug: 'products.html', image: 'assets/img/products/products-hero-packaging-range.webp' }, body, 'Products');
}

function productCard(product) {
  return `<a class="product-card" href="${product.slug}.html"><div class="product-card-media"><img src="assets/img/${product.image}" alt="${product.name}" loading="lazy"></div><div class="product-card-body"><h3>${product.name}</h3><p>${product.description}</p><span class="text-link">View product</span></div></a>`;
}

function productDetailPage(product) {
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3).map(productCard).join('');
  const useIcons = ['sandwich', 'utensils', 'drumstick', 'salad'];
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: `${site.domain}/assets/img/${product.image}`,
    description: product.description,
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.company },
    url: `${site.domain}/${product.slug}`
  };
  const faq = [
    [`What is the minimum order quantity for ${product.shortName.toLowerCase()}?`, 'MOQ depends on structure, material, size and print method. Selected projects can start from 200 pieces; send us the specification for an accurate recommendation.'],
    ['Can I print my own logo and artwork?', 'Yes. We support custom size, structure and branded printing. Our prepress team checks supplied artwork before proofing.'],
    ['Can I request a sample before production?', 'Yes. Stock samples and custom prototypes are available depending on the project stage and specification.'],
    ['How long does production take?', 'Lead time depends on structure, quantity, finishing and artwork approval. Your quotation will include the current sampling and production schedule.']
  ];
  const body = `<section class="detail-hero"><div class="detail-hero-media"><img src="assets/img/${product.image}" alt="${product.name}" fetchpriority="high"></div><div class="detail-hero-copy"><p class="eyebrow">Custom food packaging</p><h1 class="display-title">${product.name}</h1><div class="rule"></div><p>${product.description} Built for dependable takeaway performance and a consistent brand presentation.</p><div class="hero-actions"><a class="button" href="get-a-quote.html?product=${product.slug}">Request a quote ${arrow()}</a></div><div class="feature-row"><div class="feature">${icon('leaf')}<strong>Material options</strong><span>${product.material}</span></div><div class="feature">${icon('droplets')}<strong>Food performance</strong><span>${product.coating}</span></div><div class="feature">${icon('printer')}<strong>Custom print</strong><span>Logo, artwork and finish options</span></div></div></div></section>
  <section class="section section-white"><div class="container spec-layout"><div><p class="eyebrow">Specifications</p><h2 class="section-title">A clear starting specification.</h2><table class="spec-table"><tbody><tr><th>Material</th><td>${product.material}</td></tr><tr><th>Construction</th><td>${product.structure}</td></tr><tr><th>Barrier</th><td>${product.coating}</td></tr><tr><th>Food contact</th><td>Food-grade material options by project</td></tr><tr><th>Custom printing</th><td>Available; artwork and print process confirmed by specification</td></tr><tr><th>Minimum order</th><td>From 200 pieces for selected projects</td></tr><tr><th>Sampling</th><td>Stock sample or custom prototype options</td></tr><tr><th>Production</th><td>Confirmed after artwork, quantity and finish approval</td></tr><tr><th>Made in</th><td>Foshan, China</td></tr></tbody></table></div><div><p class="eyebrow">Suitable for</p><h2 class="section-title">Made around the way you serve.</h2><div class="use-grid">${product.use.map((use, index) => `<div class="use-card">${icon(useIcons[index])}<strong>${use}</strong></div>`).join('')}</div></div></div></section>
  <section class="section section-cream"><div class="container"><div class="section-head"><div><p class="eyebrow">Make it yours</p><h2 class="section-title">Choose the finish, print and size.</h2></div><p>These options are a starting point. We will match the final construction to your food, operations and budget.</p></div><div class="option-groups"><div class="option-group"><h3>1. Choose your board</h3><div class="swatches"><div class="swatch-wrap"><div class="swatch" style="background:#b98b5e"></div>Kraft</div><div class="swatch-wrap"><div class="swatch" style="background:#fff"></div>White</div><div class="swatch-wrap"><div class="swatch" style="background:#17201d"></div>Black</div></div></div><div class="option-group"><h3>2. Add your print</h3><div class="choice-grid"><div class="choice active">No print</div><div class="choice">Spot colors</div><div class="choice">Full-color artwork</div></div></div><div class="option-group"><h3>3. Select your size</h3><div class="choice-grid"><div class="choice">Small</div><div class="choice active">Medium</div><div class="choice">Large</div></div></div></div></div></section>
  <section class="section section-white"><div class="container"><div class="section-head"><div><p class="eyebrow">Frequently asked questions</p><h2 class="section-title">Ordering ${product.shortName.toLowerCase()}.</h2></div></div><div class="accordion">${faq.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
  <section class="section section-sage"><div class="container"><div class="section-head"><div><p class="eyebrow">Continue comparing</p><h2 class="section-title">You may also be interested in.</h2></div></div><div class="product-grid">${related}</div></div></section>
  ${ctaBand('Need a custom size or print plan?', 'Share a reference, dieline or food application and we will help define the next step.')}`;
  const faqSchema = { '@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})) };
  return layout({ title: `${product.name} | Custom Food Packaging | MXPACKPRO`, description: `Explore ${product.shortName.toLowerCase()} with custom sizes, food-grade material options, branded printing, samples and low-MOQ project support from MXPACKPRO.`, slug: `${product.slug}.html`, image: `assets/img/${product.image}`, schema: [productSchema, faqSchema] }, body, 'Products');
}

function customPackagingPage() {
  const body = `<section class="custom-hero"><div class="container custom-hero-grid"><div class="custom-hero-copy"><p class="eyebrow lime">Custom packaging for foodservice</p><h1 class="display-title">Make every order feel like your brand.</h1><p>Custom printed packaging developed around your food, dimensions, artwork, budget and delivery plan.</p><a class="button button-lime" href="#quote-form">Start your project ${arrow()}</a></div><div class="custom-hero-media"><img src="assets/img/v4/custom-packaging-hero.webp" alt="Custom printed food box and paper cup" fetchpriority="high"></div></div></section>
  <section class="section section-white"><div class="container narrow-head"><p class="eyebrow">Our simple process</p><h2 class="section-title">From idea to everyday service.</h2><p class="section-copy">A clear route from packaging brief to approved production.</p></div><div class="container process-grid"><article class="process-step"><span class="process-number">01</span>${icon('search')}<h3>Discover</h3><strong>Tell us your food and goals</strong><p>Share the product, dimensions, quantity, destination, artwork and priorities.</p></article><article class="process-step"><span class="process-number">02</span>${icon('package-open')}<h3>Develop</h3><strong>Choose the right format</strong><p>We align structure, material, barrier, printing and sampling with the application.</p></article><article class="process-step"><span class="process-number">03</span>${icon('truck')}<h3>Deliver</h3><strong>Launch with confidence</strong><p>Approved specifications move into production, quality checks and export packing.</p></article></div></section>
  <section class="section section-cream" id="printing"><div class="container"><div class="section-head"><div><p class="eyebrow">Built around your project</p><h2 class="section-title">One packaging system, four decisions.</h2></div><p>Each decision is confirmed before production, so artwork and structure stay aligned.</p></div><div class="capability-grid"><article>${icon('ruler')}<h3>Structure & size</h3><p>Adapt a proven format or define dimensions around your food and serving workflow.</p></article><article>${icon('layers-3')}<h3>Material & barrier</h3><p>Select board and food-contact performance for grease, moisture and temperature.</p></article><article>${icon('palette')}<h3>Printing & finish</h3><p>Prepare spot-color or full-color artwork with finishes suited to the chosen board.</p></article><article id="samples">${icon('boxes')}<h3>Samples & approval</h3><p>Review stock samples, structural prototypes or printed samples before production.</p></article></div></div></section>
  <section class="section section-sage"><div class="container buyer-split"><article><p class="eyebrow">For startups</p><h2 class="section-title">Test the market without overcommitting.</h2><ul class="check-list"><li>Selected projects from 200 pieces</li><li>Coordinated boxes, cups and bags</li><li>Custom size and artwork support</li><li>A packaging plan matched to budget</li></ul></article><article><p class="eyebrow">For established teams</p><h2 class="section-title">Keep complex projects organized.</h2><ul class="check-list"><li>Dedicated project coordination</li><li>Specification and artwork control</li><li>Production quality checkpoints</li><li>Repeat-order and export support</li></ul></article></div></section>
  <section class="section section-white" id="quote-form"><div class="container">${quoteForm('Tell us the basics. We’ll take it from there.', 'A packaging specialist will review the brief and respond with the most relevant next step.')}</div></section>`;
  return layout({ title: 'Custom Food Packaging Design & Printing | MXPACKPRO', description: 'Develop custom food boxes, paper cups and bags with structure, size, printing, sampling and low-MOQ project support from MXPACKPRO.', slug: 'custom-packaging.html', image: 'assets/img/v4/custom-packaging-hero.webp' }, body, 'Custom Packaging');
}

function quoteForm(title, copy) {
  return `<div class="form-layout"><div class="form-intro"><p class="eyebrow">Ready to get started?</p><h2 class="section-title">${title}</h2><p class="section-copy">${copy}</p><div class="form-benefits"><div class="form-benefit"><span class="icon-wrap">${icon('message-square-text')}</span>Expert guidance</div><div class="form-benefit"><span class="icon-wrap">${icon('layers-3')}</span>Custom solutions</div><div class="form-benefit"><span class="icon-wrap">${icon('circle-check-big')}</span>Clear next steps</div></div></div><form class="quote-form" action="https://formsubmit.co/${site.email}" method="POST" data-quote-form><input type="hidden" name="_subject" value="New MXPACKPRO website inquiry"><input type="hidden" name="_next" value="${site.domain}/thank-you"><input type="hidden" name="_template" value="table"><input type="text" name="_honey" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="field"><label for="name">Full name *</label><input id="name" name="name" required autocomplete="name"></div><div class="field"><label for="email">Business email *</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="field full"><label for="company">Company name *</label><input id="company" name="company" required autocomplete="organization"></div><div class="field"><label for="phone">Phone / WhatsApp</label><input id="phone" name="phone" autocomplete="tel"></div><div class="field"><label for="quantity">Estimated quantity</label><input id="quantity" name="quantity" placeholder="e.g. 2,000 pieces"></div><div class="field"><label for="packaging">Packaging interest *</label><select id="packaging" name="packaging" required><option value="">Select a category</option><option>Takeout boxes</option><option>Paper cups</option><option>Paper bags</option><option>Bakery packaging</option><option>Custom packaging family</option></select></div><div class="field"><label for="date">Target delivery date</label><input id="date" name="target_delivery_date" type="date"></div><div class="field full"><label for="message">Tell us about your project *</label><textarea id="message" name="message" required placeholder="Food type, size, artwork, material, delivery country and any challenges..."></textarea></div><div class="field full"><button class="button button-dark" type="submit">Submit inquiry ${arrow()}</button><p class="form-note">Your information is used only to respond to this packaging inquiry. The first submission may require a one-time inbox confirmation for form delivery.</p></div></form></div>`;
}

function resourcesPage() {
  const cards = articles.map((article) => `<article class="article-card"><a href="${article.slug}.html"><div class="article-card-media"><img src="assets/img/${article.image}" alt="" loading="lazy"></div><div class="article-card-body"><p class="eyebrow">${article.type}</p><h2>${article.title}</h2><p>${article.description}</p><span class="text-link">Read guide</span></div></a></article>`).join('');
  const body = `<section class="resource-hero"><div class="container"><div class="resource-hero-copy"><p class="eyebrow">Resources</p><h1 class="display-title">Better packaging decisions, made easier.</h1><p class="section-copy" style="color:var(--forest-950)">Practical guidance for foodservice buyers comparing structures, materials, printing, MOQ and project timelines.</p></div></div></section>
  <section class="section section-white"><div class="container"><article class="featured-guide"><div class="featured-guide-copy"><p class="eyebrow">Featured guide</p><h2 class="section-title">How to choose the right takeout box for your menu.</h2><p class="section-copy">A step-by-step guide to balancing food performance, structure, sustainability, branding and cost.</p><div class="hero-actions" style="margin-top:28px"><a class="button" href="packaging-buying-guide.html">Read the guide ${arrow()}</a></div></div><div class="featured-guide-media"><img src="assets/img/products/products-hero-packaging-range.webp" alt="A range of takeout packaging formats" loading="lazy"></div></article></div></section>
  <section class="section section-cream"><div class="container"><div class="section-head"><div><p class="eyebrow">Browse by topic</p><h2 class="section-title">Insights that support better buying decisions.</h2></div></div><div class="article-grid">${cards}</div></div></section>
  <section class="section section-dark"><div class="container resource-actions"><div><p class="eyebrow lime">Packaging insights</p><h2 class="section-title">Build a clearer purchasing brief.</h2><p>Use the guides to compare options before requesting samples or pricing.</p><a class="button button-outline" href="faq.html">Browse common questions ${arrow()}</a></div><div><p class="eyebrow lime">Need a direct answer?</p><h2 class="section-title">Ask a packaging specialist.</h2><p>Send your menu, reference or purchasing question and we will suggest a starting route.</p><a class="button" href="get-a-quote.html">Request a recommendation ${arrow()}</a></div></div></section>`;
  return layout({ title: 'Food Packaging Guides & Resources | MXPACKPRO', description: 'Explore food packaging buying guides covering materials, MOQ, pricing, custom printing and takeout box selection.', slug: 'resources.html', image: 'assets/img/products/products-hero-packaging-range.webp' }, body, 'Resources');
}

function aboutPage() {
  const body = `<section class="about-hero"><div class="about-copy"><p class="eyebrow">Why MXPACKPRO</p><h1 class="display-title">Packaging is what we do. Partnership is how we work.</h1><div class="rule"></div><p class="section-copy">From Foshan, China, we coordinate food packaging structure, materials, printing, sampling, production and export delivery for overseas buyers.</p></div><div class="about-media"><img src="assets/img/v4/about-warehouse-hero.webp" alt="Food packaging warehouse with organized paper boxes, cups and containers" fetchpriority="high"></div></section>
  <section class="value-strip"><div class="container value-grid"><article class="value-card">${icon('package-check')}<h3>Custom solutions</h3><p>Structure, size and print built around your food and brand.</p></article><article class="value-card">${icon('utensils')}<h3>Foodservice focused</h3><p>Formats selected for takeaway, delivery, catering and retail use.</p></article><article class="value-card">${icon('truck')}<h3>Reliable coordination</h3><p>Clear milestones for samples, production, packing and export.</p></article></div></section>
  <section class="partner-band" id="quality"><div class="partner-copy"><p class="eyebrow">Built to support your business</p><h2 class="section-title">We help food businesses move from brief to repeat order.</h2><p class="section-copy">Our job is to reduce uncertainty while keeping the specification practical.</p><ul class="check-list"><li><strong>We listen first.</strong> Food, menu, operations and purchasing goals shape the recommendation.</li><li><strong>We move clearly.</strong> Samples, artwork and approvals are organized before production.</li><li><strong>We support repeat orders.</strong> Approved details stay consistent as projects grow.</li></ul><a class="button button-dark" href="get-a-quote.html">Our approach ${arrow()}</a></div><div class="partner-media"><img src="assets/img/v4/about-packaging-workspace.webp" alt="Food packaging project workspace with boxes, cups and paper bags" loading="lazy"></div></section>
  <section class="section section-cream" id="process"><div class="container narrow-head"><p class="eyebrow">Our process</p><h2 class="section-title">Quality and consistency, every step of the way.</h2></div><div class="container timeline">${[['1','Consult','Food, menu, size and goals'],['2','Recommend','Structure, material and sample'],['3','Confirm','Artwork and specifications'],['4','Deliver','Quality checks and export packing'],['5','Support','Arrival and repeat orders']].map(([n,t,c])=>`<article class="timeline-step"><span class="timeline-dot">${n}</span><h3>${t}</h3><p>${c}</p></article>`).join('')}</div></section>
  <section class="partner-band sustainability-band"><div class="partner-media"><img src="assets/img/v4/about-sustainability.webp" alt="Kraft paper food packaging arranged with green leaves" loading="lazy"></div><div class="partner-copy"><p class="eyebrow">Responsible by choice</p><h2 class="section-title">Better packaging for today and tomorrow.</h2><p class="section-copy">Sustainability depends on food performance, material choice, right-sizing and the disposal system in the destination market.</p><ul class="check-list"><li>Recyclable and recycled-content board options where suitable</li><li>Right-sized structures that avoid unnecessary material</li><li>Food-performance requirements confirmed before claims are made</li></ul><a class="text-link" href="materials-food-safety.html">Read the materials guide</a></div></section>
  ${ctaBand('Let’s build the right solution for your business.', 'Tell us what you serve, what you need and where the order is going.')}`;
  return layout({ title: 'About MXPACKPRO | Food Packaging Partner in China', description: 'Learn how MXPACKPRO supports custom food packaging with structure, materials, printing, sampling, production coordination and global export service.', slug: 'about-us.html', image: 'assets/img/v4/about-warehouse-hero.webp' }, body, 'About');
}

function contactPage() {
  const body = `<section class="quote-hero"><div class="container quote-hero-grid"><div><p class="eyebrow lime">Contact MXPACKPRO</p><h1 class="display-title">Let’s talk packaging.</h1><div class="rule" style="background:var(--lime)"></div><p>Share what you serve, what you need, your estimated quantity and where the order is going.</p></div><img src="assets/img/v4/quote-hero.webp" alt="Kraft takeout containers, paper cup and paper bag for a packaging project" fetchpriority="high"></div></section>
  <section class="section section-white"><div class="container">${quoteForm('Start with the project essentials.', 'We typically respond within one business day with questions, recommendations or the next quotation step.')}</div></section>
  <section class="section section-cream"><div class="container"><div class="section-head"><div><p class="eyebrow">Direct contact</p><h2 class="section-title">Already know what you need?</h2></div></div><div class="value-grid"><a class="value-card" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener" data-track="whatsapp_click">${icon('message-circle')}<h3>WhatsApp</h3><p>+44 7704 644465</p></a><a class="value-card" href="mailto:${site.email}" data-track="email_click">${icon('mail')}<h3>Email</h3><p>${site.email}</p></a><a class="value-card" href="tel:${site.phoneHref}" data-track="phone_click">${icon('phone')}<h3>Phone</h3><p>${site.phone}</p></a></div></div></section>`;
  return layout({ title: 'Request a Custom Food Packaging Quote | MXPACKPRO', description: 'Tell MXPACKPRO about your food packaging project, including product, size, quantity, artwork and delivery country.', slug: 'get-a-quote.html', image: 'assets/img/v4/quote-hero.webp' }, body);
}

function faqPage() {
  const faqs = [
    ['What affects the price of custom packaging?', 'Price is mainly influenced by size, box style, material, print coverage, finishing and quantity. Higher quantities generally reduce the unit price.'],
    ['What is your minimum order quantity?', 'MOQ depends on product structure and printing. Selected projects can start from 200 pieces, while more complex custom production may require a higher quantity.'],
    ['How do I know whether my artwork is printable?', 'Our prepress team checks technical items such as resolution, bleed, fine lines and print setup. Any issues are highlighted during proofing.'],
    ['Where is your packaging produced?', 'MX PACK coordinates production in Foshan, China. Project schedules, packing and export delivery are confirmed for each order.'],
    ['Can you send a dieline template?', 'Yes. Once the box style and dimensions are confirmed, we can provide a dieline for artwork preparation.'],
    ['Can I request samples?', 'Yes. Stock samples and custom prototype options are available depending on the project and the stage of development.'],
    ['What sustainable options are available?', 'Options depend on the required food performance and local disposal system. We can discuss recyclable paperboard, recycled-content board and right-sized structures.'],
    ['How long does production take?', 'Timing depends on structure, printing, finishing, quantity and artwork approval. The quotation will include the current sample and production schedule.']
  ];
  const faqSchema = { '@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})) };
  const body = `<section class="faq-hero"><div class="container"><p class="eyebrow lime">FAQ</p><h1 class="display-title">Answers for better packaging decisions.</h1><p>Everything buyers need to know about ordering, customization, materials and delivery.</p></div></section>
  <section class="section section-cream"><div class="container"><div class="faq-categories"><span class="faq-category active">${icon('clipboard-list')}Ordering & MOQ</span><span class="faq-category">${icon('palette')}Custom printing</span><span class="faq-category">${icon('leaf')}Materials</span><span class="faq-category">${icon('truck')}Shipping & supply</span></div><div class="faq-layout"><div class="accordion">${faqs.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div><aside class="faq-aside"><img src="assets/img/v4/faq-packaging.webp" alt="Kraft food boxes, bowl and paper bag" loading="lazy"><div class="faq-aside-copy"><p class="eyebrow">Need a quick answer?</p><h2 class="section-title compact-title">Talk to a packaging specialist.</h2><p class="section-copy">Send the product, quantity, size and delivery country for a specific answer.</p><ul class="mini-list"><li>Tailored recommendations</li><li>Fit and material guidance</li><li>Clear next steps</li></ul><a class="button button-dark" href="get-a-quote.html">Request a quote ${arrow()}</a></div></aside></div></div></section>
  ${ctaBand('Still have a question?', 'Talk to our team about a specific food, material, size or print requirement.')}`;
  return layout({ title: 'Custom Food Packaging FAQ | MOQ, Printing & Materials | MXPACKPRO', description: 'Answers about MXPACKPRO custom food packaging MOQ, price factors, artwork, dielines, samples, materials, production and shipping.', slug: 'faq.html', schema: [faqSchema] }, body, 'Resources');
}

function solutionsPage() {
  const details = [
    ['restaurants','sandwich','Restaurants & takeaway','Protect food quality from kitchen to customer.','Fast-closing boxes, grease-resistant barriers and coordinated cups and bags for dine-out, takeaway and delivery.',['Burger and clamshell boxes','Fold-top takeaway cartons','Paper cups and carry bags']],
    ['catering','briefcase-business','Catering & events','Package portions, platters and prepared meals professionally.','Practical formats for events, meal programs and multi-item orders, with clear labeling and carrying options.',['Handled catering boxes','Window and presentation cartons','Coordinated bags and meal containers']],
    ['food-brands','store','Food brands & retail','Turn packaging into a consistent brand asset.','Build a coordinated product family for shelf, delivery and repeat purchase with controlled artwork and specifications.',['Retail-ready printed cartons','Branded paper bags','Custom inserts and structures']],
    ['startups','rocket','Startups & new brands','Test the market with a focused packaging plan.','Selected projects can begin from 200 pieces, helping new brands validate size, structure and artwork before scaling.',['Low-MOQ starting options','One-stop packaging family','Sampling and artwork support']],
    ['enterprise','building-2','Enterprise projects','Keep complex, repeat-order programs under control.','Project coordination aligns stakeholders, approvals, quality checkpoints and production schedules across a wider packaging range.',['Dedicated project coordination','Specification and artwork control','Quality and repeat-order support']]
  ];
  const body = `<section class="page-hero hero-image"><img class="page-hero-bg" src="assets/img/home/hero-restaurant-packaging.webp" alt="Foodservice packaging in a restaurant setting"><div class="page-hero-overlay"></div><div class="container page-hero-inner"><div class="page-hero-copy"><p class="eyebrow">Solutions</p><h1 class="display-title">Packaging planned around the way your business serves food.</h1><div class="rule"></div><p>Choose your business type to compare the packaging priorities, formats and project support most relevant to your operation.</p></div></div></section><nav class="solution-jump" aria-label="Solution types"><div class="container">${details.map(([id,ic,name])=>`<a href="#${id}">${icon(ic)}${name}</a>`).join('')}</div></nav><section class="section section-white"><div class="container solution-rows">${details.map(([id,ic,name,title,copy,list],index)=>`<article class="solution-row" id="${id}"><div class="solution-row-index">0${index+1}</div><div class="solution-row-copy"><p class="eyebrow">${name}</p><h2 class="section-title">${title}</h2><p class="section-copy">${copy}</p><ul class="check-list">${list.map(item=>`<li>${item}</li>`).join('')}</ul><div class="hero-actions"><a class="button button-dark" href="get-a-quote.html?solution=${id}">Discuss this solution ${arrow()}</a><a class="text-link" href="products.html">Explore products</a></div></div><div class="solution-row-icon">${icon(ic)}</div></article>`).join('')}</div></section>${ctaBand()}`;
  return layout({ title: 'Food Packaging Solutions by Business Type | MXPACKPRO', description: 'Packaging solutions for restaurants, takeaway, caterers, food brands, retail, startups and enterprise projects.', slug: 'solutions.html', image: 'assets/img/home/hero-restaurant-packaging.webp' }, body, 'Solutions');
}

function articlePage(article) {
  const sections = article.slug === 'packaging-buying-guide' ? [
    ['Start with the food, not the box', 'Consider temperature, moisture, grease, portion size and how long the meal will travel. The best structure protects the food without adding unnecessary material or assembly steps.'],
    ['Choose a structure that supports service', 'Clamshells are quick to close, fold-top cartons save storage space, pizza boxes stack well, and handled cartons can improve carrying and presentation.'],
    ['Match material and barrier to performance', 'Kraft, white paperboard and corrugated board each offer different print, strength and presentation characteristics. Barrier choices should follow the food application.'],
    ['Confirm size before artwork', 'A sample or dieline check helps prevent poor fit, excess movement and artwork changes after design work has started.'],
    ['Compare total project requirements', 'Unit price matters, but buyers should also compare MOQ, sampling, print setup, lead time, export packing and repeat-order consistency.']
  ] : article.slug === 'moq-pricing-guide' ? [
    ['Size and structure', 'Larger boxes use more board. Complex structures can require additional tooling, converting and assembly.'],
    ['Material and barrier', 'Board grade, thickness, corrugation and food-contact barriers affect both performance and cost.'],
    ['Printing and finish', 'Print method, color count, coverage, lamination and premium finishes influence setup and unit price.'],
    ['Order quantity', 'Higher quantities usually spread setup cost across more units. Selected simple projects may start from 200 pieces.'],
    ['Sampling and delivery', 'Prototypes, packing method and shipping route should be included when comparing the full project cost.']
  ] : [
    ['Kraft paperboard', 'A natural appearance suited to many takeaway formats. Strength, thickness and barrier must be chosen for the food application.'],
    ['White paperboard', 'A clean print surface for bright branding and premium presentation. Available in different grades and food-contact specifications.'],
    ['Corrugated board', 'Adds rigidity and stacking strength for pizza, larger meals, shipping and heavier product formats.'],
    ['Food-contact barriers', 'Grease and moisture performance may require PE, water-based or other barrier solutions depending on the product and disposal market.'],
    ['Right-sized packaging', 'Reducing excess volume can lower material use, filler and transport inefficiency while improving product presentation.']
  ];
  const body = `<section class="page-hero hero-image"><img class="page-hero-bg" src="assets/img/${article.image}" alt=""><div class="page-hero-overlay"></div><div class="container page-hero-inner"><div class="page-hero-copy"><p class="eyebrow">${article.type}</p><h1 class="display-title">${article.title}</h1><div class="rule"></div><p>${article.description}</p></div></div></section><article class="section section-white"><div class="container" style="max-width:900px"><p class="eyebrow">Practical purchasing guidance</p><p class="section-copy" style="font-size:20px">Use this guide as a starting point, then confirm the final structure, material, food-contact requirement and production specification for your project.</p>${sections.map(([title,copy],index)=>`<section style="padding:34px 0;border-bottom:1px solid var(--line)"><p class="eyebrow">0${index+1}</p><h2 class="section-title" style="font-size:38px">${title}</h2><p class="section-copy">${copy}</p></section>`).join('')}</div></article><section class="section section-sage"><div class="container spec-layout"><div><p class="eyebrow">Next step</p><h2 class="section-title">Turn the guide into a project specification.</h2><p class="section-copy">Share the food, size, quantity, artwork and destination to receive a more specific recommendation.</p></div><div style="display:grid;place-items:center"><a class="button button-dark" href="get-a-quote.html">Ask a packaging question ${arrow()}</a></div></div></section>`;
  const schema = { '@context':'https://schema.org','@type':'Article',headline:article.title,description:article.description,image:`${site.domain}/assets/img/${article.image}`,author:{'@type':'Organization',name:site.name},publisher:{'@type':'Organization',name:site.name},datePublished:'2026-08-25',dateModified:'2026-08-25' };
  return layout({ title: `${article.title.replace('Food Packaging Materials: ', '')} | MXPACKPRO`, description: `${article.description} Use this MXPACKPRO guide to prepare a clearer project specification.`, slug: `${article.slug}.html`, image: `assets/img/${article.image}`, schema:[schema] }, body, 'Resources');
}

function policyPage(type) {
  const privacy = type === 'privacy';
  const title = privacy ? 'Privacy Policy' : 'Website Terms of Use';
  const sections = privacy ? [
    ['Information we collect', 'When you submit an inquiry, we receive the contact and project information you provide. Basic analytics may also record device, page and interaction data.'],
    ['How we use information', 'We use information to answer inquiries, prepare recommendations or quotations, improve the website and understand which content helps buyers.'],
    ['Form and analytics services', 'Inquiry forms are processed through FormSubmit and website analytics are provided by Google Analytics. These providers may process data under their own policies.'],
    ['Retention and sharing', 'We keep inquiry information only as needed for business communication and project records. We do not sell personal information.'],
    ['Your choices', `You may request access, correction or deletion by emailing ${site.email}. You can also use browser controls to limit analytics cookies.`]
  ] : [
    ['Website information', 'Website content is general purchasing information and does not replace a final quotation, approved specification, food-contact assessment or written agreement.'],
    ['Product specifications', 'Materials, dimensions, MOQ, production time and printing options vary by project and are confirmed in the quotation and approval documents.'],
    ['Intellectual property', 'MXPACKPRO website copy, design and original assets may not be republished without permission. Customer logos and trademarks remain the property of their owners.'],
    ['External services', 'Links and third-party services are provided for convenience. Their availability and policies are controlled by their respective providers.'],
    ['Contact', `Questions about these terms can be sent to ${site.email}.`]
  ];
  const body = `<section class="legal-hero"><div class="container"><p class="eyebrow">Company information</p><h1 class="display-title">${title}</h1><p>Last updated August 25, 2026</p></div></section><article class="section section-white"><div class="container legal-copy">${sections.map(([h,c])=>`<section><h2>${h}</h2><p>${c}</p></section>`).join('')}</div></article>`;
  return layout({ title: `${title} | MXPACKPRO`, description: `${title} for the MXPACKPRO website, including inquiry data, analytics, product information and website use.`, slug: `${privacy ? 'privacy-policy' : 'terms'}.html` }, body);
}

function thankYouPage() {
  const body = `<section class="thanks-page"><div class="container thanks-card">${icon('circle-check-big')}<p class="eyebrow">Inquiry received</p><h1 class="display-title">Thank you. Your packaging brief is on its way.</h1><p>We will review the information and normally respond within one business day. If the project is urgent, contact us on WhatsApp.</p><div class="hero-actions"><a class="button button-dark" href="products.html">Continue exploring products ${arrow()}</a><a class="button" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">Open WhatsApp ${arrow()}</a></div></div></section>`;
  return layout({ title: 'Packaging Inquiry Received | MXPACKPRO', description: 'Your MXPACKPRO custom food packaging inquiry has been received. Continue exploring products or contact our team on WhatsApp.', slug: 'thank-you.html', noindex: true }, body);
}

const pages = new Map([
  ['index.html', homePage()],
  ['products.html', productsPage()],
  ['custom-packaging.html', customPackagingPage()],
  ['resources.html', resourcesPage()],
  ['about-us.html', aboutPage()],
  ['get-a-quote.html', contactPage()],
  ['faq.html', faqPage()],
  ['solutions.html', solutionsPage()],
  ['privacy-policy.html', policyPage('privacy')],
  ['terms.html', policyPage('terms')],
  ['thank-you.html', thankYouPage()]
]);

for (const product of products) pages.set(`${product.slug}.html`, productDetailPage(product));
for (const article of articles) pages.set(`${article.slug}.html`, articlePage(article));

async function build() {
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'assets', 'css'), { recursive: true });
  await mkdir(path.join(out, 'assets', 'js'), { recursive: true });
  await cp(sourceAssets, path.join(out, 'assets', 'img'), { recursive: true });
  await cp(generatedAssets, path.join(out, 'assets', 'img', 'v4'), { recursive: true, filter: (source) => !source.endsWith('.png') });
  await cp(path.join(root, 'src', 'styles.css'), path.join(out, 'assets', 'css', 'v4.css'));
  await cp(path.join(root, 'src', 'site.js'), path.join(out, 'assets', 'js', 'v4.js'));
  for (const [file, content] of pages) {
    const productionHtml = content
      .replace(/href="index\.html([?#][^"]*)?"/g, 'href="/$1"')
      .replace(/href="([^":#]+)\.html([?#][^"]*)?"/g, 'href="$1$2"');
    await writeFile(path.join(out, file), productionHtml, 'utf8');
  }

  const indexableFiles = [...pages.keys()].filter((file) => file !== 'thank-you.html');
  const urls = indexableFiles.map((file) => `<url><loc>${site.domain}/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}</loc><lastmod>2026-08-25</lastmod><changefreq>${file === 'index.html' ? 'weekly' : 'monthly'}</changefreq><priority>${file === 'index.html' ? '1.0' : file === 'products.html' || file === 'custom-packaging.html' ? '0.9' : '0.7'}</priority></url>`).join('');
  await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, 'utf8');
  await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`, 'utf8');
  await writeFile(path.join(out, 'llms.txt'), `# MXPACKPRO\n\nMXPACKPRO is the international website of Foshan Xumelo Technology Co., Ltd., a custom food packaging supplier based in Foshan, China.\n\n## Core pages\n- ${site.domain}/products — food packaging product categories\n- ${site.domain}/custom-packaging — custom structure, printing and sampling process\n- ${site.domain}/solutions — packaging by food business type\n- ${site.domain}/resources — packaging buying guides\n- ${site.domain}/about-us — company and project support\n- ${site.domain}/faq — MOQ, artwork, materials, samples and production answers\n- ${site.domain}/get-a-quote — contact and quotation request\n\n## Verified contact\n- Email: ${site.email}\n- Phone: ${site.phone}\n- WhatsApp: +44 7704 644465\n- Location: ${site.location}\n`, 'utf8');
  await writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=86400\n`, 'utf8');
  const redirects = [
    ['/customization.html','/custom-packaging'], ['/custom-food-packaging.html','/custom-packaging'], ['/dielines-artwork.html','/custom-packaging#printing'], ['/printing-finishes.html','/custom-packaging#printing'], ['/samples-prototyping.html','/custom-packaging#samples'], ['/artwork-checklist.html','/custom-packaging#printing'], ['/box-styles-structures.html','/custom-packaging'],
    ['/why-mxpack.html','/about-us'], ['/factory-equipment.html','/about-us'], ['/quality-control.html','/about-us#quality'], ['/sustainability.html','/about-us'], ['/global-shipping.html','/about-us#process'], ['/contact.html','/get-a-quote'],
    ['/restaurant-takeaway-packaging.html','/solutions#restaurants'], ['/catering-event-packaging.html','/solutions#catering'], ['/food-brand-retail-packaging.html','/solutions#food-brands'], ['/low-moq-startups.html','/solutions#startups'], ['/enterprise-packaging.html','/solutions#enterprise'], ['/catering-event-packaging','/solutions#catering'],
    ['/custom-food-packaging','/custom-packaging'], ['/customization','/custom-packaging'], ['/case-studies.html','/resources'], ['/grazing-catering-boxes.html','/solutions#catering'], ['/mailer-shipping-boxes.html','/products'], ['/sushi-boxes.html','/takeaway-food-boxes']
  ];
  await writeFile(path.join(out, '_redirects'), `${redirects.map(([from,to])=>`${from} ${to} 301`).join('\n')}\n`, 'utf8');
  console.log(`Built ${pages.size} pages in ${out}`);
}

await build();
