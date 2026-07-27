import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const products = {
  'takeaway-food-boxes': {
    name: 'Takeaway Food Boxes',
    h1: 'Custom Takeaway Food Boxes',
    title: 'Custom Takeaway Food Boxes from 200 Pieces | MX PACK',
    description: 'Order custom printed takeaway food boxes for hot meals, noodles, snacks and delivery. Food-grade material options, flexible sizes and 200-piece MOQ.',
    intro: 'Build takeaway packaging around the food you serve, the journey it needs to make and the way customers handle it. MX PACK supports custom structures, dimensions and branded printing from 200 pieces.',
    image: 'assets/img/mx-fast-food-box.jpg',
    alt: 'Custom printed takeaway food box by MX PACK',
    bestFor: 'Burgers, noodles, rice meals, fries, snacks, combo meals and delivery orders.',
    structure: 'Tuck-top, clamshell, auto-lock, handle and divided formats can be developed around your portions.',
    materials: 'Kraft, white paperboard and corrugated options with grease- or moisture-resistant barriers by application.',
    customization: 'Custom size, CMYK or spot-color printing, windows, ventilation, dividers and branded closures.',
    order: 'MOQ starts from 200 pieces. Final MOQ, sample route and production plan depend on size, material and print method.',
    highlights: [
      ['Food fit comes first', 'We review heat, grease, moisture, portion size and delivery time before recommending board and structure.'],
      ['Designed for service speed', 'Easy-open tabs, secure closures and flat-packed structures help kitchen and takeaway teams work efficiently.'],
      ['Brand-ready surfaces', 'Use the lid, side panels and inner print areas to carry product names, instructions and campaign artwork.'],
      ['Prepared for delivery', 'Ventilation, locking tabs and inserts can be added when the food or delivery route requires them.'],
    ],
    faq: [
      ['Can I order only 200 takeaway boxes?', 'Yes. Selected custom structures can start from 200 pieces. The practical MOQ depends on dimensions, material, printing and finishing.'],
      ['Can the boxes handle greasy or hot food?', 'We can recommend grease-resistant barriers, ventilation and suitable paper grades after reviewing the food type and expected holding time.'],
      ['Can you create the box from a reference photo?', 'Yes. Send the reference, approximate dimensions, food weight and quantity. We can recommend a structure and prepare a dieline for approval.'],
      ['Do you provide samples before production?', 'Sample options are available. Depending on the project, this may be a plain structural sample, digitally printed sample or production-grade sample.'],
    ],
  },
  'burger-boxes': {
    name: 'Burger Boxes',
    h1: 'Custom Burger Boxes',
    title: 'Custom Burger Boxes from 200 Pieces | MX PACK',
    description: 'Create custom printed burger boxes for burgers, fries and meal combinations. Choose grease-resistant papers, branded printing and flexible sizes.',
    intro: 'Create a burger box that closes securely, protects presentation and gives your brand a clear place to speak. Choose compact clamshells, folding cartons or meal-box formats from 200 pieces.',
    image: 'assets/img/popular-burger-box.webp',
    alt: 'Custom printed paper burger box by MX PACK',
    bestFor: 'Single burgers, sliders, fries, burger-and-side combinations, takeaway and delivery.',
    structure: 'Clamshell, crash-lock, tuck-top and divided meal boxes with locking tabs and optional ventilation.',
    materials: 'Kraft or white paperboard, corrugated board and grease-resistant barrier options selected for the food.',
    customization: 'Exact dimensions, full-color or spot-color print, inside printing, cut-outs, dividers and branded seals.',
    order: 'MOQ starts from 200 pieces. Share burger diameter, height, sides and delivery requirements for accurate pricing.',
    highlights: [
      ['Sized around the burger', 'A close fit limits movement and keeps the pack compact without pressing the bun or toppings.'],
      ['Grease considered early', 'Board grade and barrier recommendations are based on oil level, serving temperature and holding time.'],
      ['Secure for takeaway', 'Locking tabs and lid geometry can be adjusted to improve closure during handoff and delivery.'],
      ['Built for repeat orders', 'Approved dimensions and artwork are retained so future production can stay consistent.'],
    ],
    faq: [
      ['What dimensions do you need for a burger box quote?', 'Send the burger diameter, total height, whether fries or sides share the box, quantity and destination country.'],
      ['Can you add ventilation holes?', 'Yes. Vent locations and sizes can be incorporated when steam release is important for product quality.'],
      ['Can the inside of the burger box be printed?', 'Inside printing is available for suitable materials and print processes. We will confirm food-contact positioning during artwork review.'],
      ['Can I get a structural sample first?', 'Yes. A plain structural sample is a useful way to check burger fit and closure before printed production.'],
    ],
  },
  'pizza-boxes': {
    name: 'Pizza Boxes',
    h1: 'Custom Printed Pizza Boxes',
    title: 'Custom Printed Pizza Boxes for Delivery | MX PACK',
    description: 'Custom printed corrugated pizza boxes for delivery, takeaway and flat meals. Choose sizes, materials and branded finishes with factory-direct support.',
    intro: 'Match pizza diameter, delivery time and print requirements with a corrugated box built for stacking and service. MX PACK supports custom dimensions, ventilation and branded printing.',
    image: 'assets/img/popular-pizza-box.jpg',
    alt: 'Custom printed corrugated pizza box by MX PACK',
    bestFor: 'Whole pizzas, flatbreads, baked snacks, meal sets and takeaway delivery.',
    structure: 'Standard one-piece pizza cartons, tuck-front formats and custom locking structures with ventilation.',
    materials: 'Food-packaging corrugated board in kraft or white surfaces, with grade selected for size and stacking needs.',
    customization: 'Custom diameter and depth, one- or multi-color print, full-color artwork, vent holes and branded closures.',
    order: 'MOQ and printing route depend on size, board grade, print coverage and quantity. Low-volume projects can be reviewed from 200 pieces.',
    highlights: [
      ['Built around pizza diameter', 'Correct internal size reduces sliding while leaving practical space for loading and removal.'],
      ['Delivery conditions considered', 'Board strength, ventilation and closure are reviewed against steam, grease, stacking and journey time.'],
      ['Print that works at scale', 'Artwork can be adapted for lid impact, side identification, reheating notes and social contact details.'],
      ['Flat-packed for operations', 'Structures are supplied flat to reduce storage volume and are designed for efficient assembly.'],
    ],
    faq: [
      ['Which measurements are needed for a pizza box?', 'Provide pizza diameter, crust height, required internal depth, quantity and whether boxes will be stacked during delivery.'],
      ['Can pizza boxes have ventilation holes?', 'Yes. Ventilation can be added to help release steam. The position is coordinated with structure and artwork.'],
      ['Can you print the entire lid?', 'Yes. Print coverage depends on the selected board and printing process. Send the artwork or reference for a recommendation.'],
      ['Do you make unusual pizza box sizes?', 'Yes. Custom dimensions are available for slices, flatbreads, mini pizzas and non-standard formats.'],
    ],
  },
  'bakery-cake-boxes': {
    name: 'Bakery & Cake Boxes',
    h1: 'Custom Bakery and Cake Boxes',
    title: 'Custom Bakery & Cake Boxes from 200 Pieces | MX PACK',
    description: 'Custom cake and bakery boxes with window, handle and display options for cakes, pastries, cookies and desserts. Printed from 200 pieces.',
    intro: 'Present cakes and pastries with structures designed around product height, board support and customer handling. Add windows, handles, inserts and branded print from 200 pieces.',
    image: 'assets/img/mx-cake-box.jpg',
    alt: 'Custom printed cake and bakery box by MX PACK',
    bestFor: 'Celebration cakes, pastries, cupcakes, cookies, macarons, desserts and bakery gift sets.',
    structure: 'Tuck-top, auto-lock, window, handle, two-piece and side-opening structures with optional inserts.',
    materials: 'White or kraft paperboard and corrugated options selected for product weight, window area and carrying method.',
    customization: 'Custom dimensions, windows, cake-board allowances, handles, inserts, foil details and branded printing.',
    order: 'MOQ starts from 200 pieces for selected formats. Share product size, weight, window preference and quantity.',
    highlights: [
      ['Presentation without pressure', 'Internal dimensions account for product height, decoration and safe removal.'],
      ['Window options by project', 'Window size, shape and film choice are reviewed alongside strength, destination and food-contact needs.'],
      ['Carry with confidence', 'Handles, base locks and reinforced structures can be developed for heavier or taller products.'],
      ['One look across the range', 'Coordinated colors and print can be applied across cake, cookie and pastry packaging.'],
    ],
    faq: [
      ['What size should my cake box be?', 'Send the cake-board width, cake height including decoration and expected weight. We will recommend internal clearance.'],
      ['Can you add a clear window?', 'Yes. Window size, shape and film options can be developed to suit the structure and destination requirements.'],
      ['Can cake boxes include handles?', 'Yes. Integrated handles and reinforced carrying structures are available when the product weight and box shape allow.'],
      ['Can I order matching boxes for several bakery products?', 'Yes. We can coordinate artwork across different dimensions and structures for a consistent bakery packaging range.'],
    ],
  },
  'sushi-boxes': {
    name: 'Sushi Boxes',
    h1: 'Custom Sushi Boxes',
    title: 'Custom Sushi Boxes & Takeaway Packaging | MX PACK',
    description: 'Custom sushi boxes for rolls, cold food and premium takeaway sets. Select food-grade materials, clean display structures and branded printing.',
    intro: 'Create sushi packaging that keeps the arrangement visible, secure and easy to carry. Choose paperboard sleeves, window cartons, trays and inserts with custom branding.',
    image: 'assets/img/popular-sushi-box.jpg',
    alt: 'Custom sushi takeaway box with branded paper packaging',
    bestFor: 'Sushi rolls, nigiri, sashimi sets, cold appetizers, bento-style combinations and premium takeaway.',
    structure: 'Window cartons, paperboard sleeves, tray-and-sleeve formats and divided sets developed around portion layout.',
    materials: 'Kraft or white paperboard with moisture-resistant options and tray or window components by project.',
    customization: 'Custom footprint, compartments, window shape, sleeves, labels and full branded printing.',
    order: 'MOQ starts from 200 pieces for selected paper structures. Provide food layout, dimensions, quantity and destination.',
    highlights: [
      ['Layout-led dimensions', 'The structure starts with roll count, garnish space, sauce placement and how the set is carried.'],
      ['Clear product presentation', 'Windows and sleeves can frame the food while reserving strong surfaces for branding.'],
      ['Cold-food conditions reviewed', 'Moisture, condensation and holding time guide material and barrier recommendations.'],
      ['Range consistency', 'Single portions, sharing sets and catering formats can use one coordinated visual system.'],
    ],
    faq: [
      ['Can you make sushi boxes with windows?', 'Yes. Window cartons and sleeve-and-tray formats are available. Window material is confirmed by project and destination.'],
      ['Can compartments or sauce spaces be added?', 'Yes. Share the food arrangement or a reference tray so we can review dividers, inserts or dedicated sauce areas.'],
      ['Are moisture-resistant options available?', 'Yes. We can recommend barrier and material options after reviewing cold storage, condensation and expected holding time.'],
      ['Can the box be printed in multiple colors?', 'Yes. Full-color and spot-color branding are available depending on material, quantity and printing route.'],
    ],
  },
  'grazing-catering-boxes': {
    name: 'Grazing & Catering Boxes',
    h1: 'Custom Grazing and Catering Boxes',
    title: 'Custom Grazing & Catering Boxes | MX PACK',
    description: 'Presentation-ready custom grazing and catering boxes for platters, fruit, desserts and event food. Request branded sizes and window options.',
    intro: 'Turn platters, tasting sets and event food into a presentation customers can carry and share. Develop large windows, dividers, handles and branded sleeves around your menu.',
    image: 'assets/img/mx-grazing-box.jpg',
    alt: 'Custom grazing and catering presentation box by MX PACK',
    bestFor: 'Grazing platters, fruit, desserts, afternoon tea, canapes, tasting sets and event catering.',
    structure: 'Large-window cartons, platter sleeves, handled boxes, divided trays and rigid-support formats.',
    materials: 'Paperboard or corrugated structures selected for span, product weight, window area and transport conditions.',
    customization: 'Custom footprint, height, windows, dividers, handles, sleeves, inserts and event-specific artwork.',
    order: 'MOQ starts from 200 pieces for selected structures. Share loaded weight, layout, dimensions and delivery method.',
    highlights: [
      ['Designed from the loaded platter', 'Span, weight and food arrangement determine board strength, supports and carrying method.'],
      ['Presentation stays visible', 'Large windows and sleeves can showcase the food while keeping key brand information clear.'],
      ['Dividers where needed', 'Partitions and inserts help separate portions, cups, cutlery or different food types.'],
      ['Event-ready customization', 'Artwork can be adapted for seasonal menus, corporate events and hospitality campaigns.'],
    ],
    faq: [
      ['How do I measure a grazing box?', 'Provide the loaded platter length, width, height and total weight, plus any cups, dividers or utensils that must fit.'],
      ['Can you make a large clear window?', 'Yes. Window size is balanced against box strength, board grade and the way the package is carried.'],
      ['Can the box include dividers?', 'Yes. Paperboard partitions and custom inserts can be developed around the food layout.'],
      ['Are handles available for catering boxes?', 'Integrated or separate handle solutions can be considered after reviewing the loaded weight and structure.'],
    ],
  },
  'custom-paper-bags': {
    name: 'Custom Paper Bags',
    h1: 'Custom Printed Paper Bags',
    title: 'Custom Printed Paper Bags for Food Brands | MX PACK',
    description: 'Custom printed paper bags for restaurants, bakeries and retail food brands. Choose kraft or white paper, handle styles, sizes and branded finishes.',
    intro: 'Carry takeaway orders and retail products in paper bags sized for the actual contents. Choose kraft or white paper, handle types and print coverage from a coordinated packaging supplier.',
    image: 'assets/img/paper-bag.svg',
    alt: 'Custom printed paper takeaway bag by MX PACK',
    bestFor: 'Restaurant takeaway, bakery orders, coffee shops, retail food, gift sets and event merchandise.',
    structure: 'Flat-handle, twisted-handle, SOS and handle-free bag formats in custom widths, gussets and heights.',
    materials: 'Brown kraft, white kraft and other paper grades selected for loaded weight and desired appearance.',
    customization: 'Custom dimensions, handle color, one- or multi-color print, full coverage and coordinated box-and-bag artwork.',
    order: 'MOQ depends on bag format, dimensions, paper and printing. Send loaded weight, size, quantity and artwork for confirmation.',
    highlights: [
      ['Dimensions that match the order', 'Bag width, gusset and height are planned around containers, boxes and how staff load them.'],
      ['Handles selected for weight', 'Flat, twisted and other handle options are reviewed against carrying comfort and loaded weight.'],
      ['Brand from every angle', 'Front, back and side gussets can carry logos, store details, campaign graphics and handling notes.'],
      ['Coordinate the full set', 'Paper bags can share colors and artwork with food boxes for a more consistent customer experience.'],
    ],
    faq: [
      ['Which dimensions are needed for a custom paper bag?', 'Provide the width, side gusset, height, loaded weight and the largest box or container that must fit.'],
      ['What handle options are available?', 'Common options include flat paper and twisted paper handles. Availability and MOQ depend on bag size and project details.'],
      ['Can you print both sides and the gussets?', 'Yes. Print coverage can include front, back and side gussets depending on artwork and production method.'],
      ['Can paper bags match my food box colors?', 'Yes. We can coordinate artwork and color targets across bags and boxes, allowing for differences between materials and print processes.'],
    ],
  },
  'mailer-shipping-boxes': {
    name: 'Mailer & Shipping Boxes',
    h1: 'Custom Mailer and Shipping Boxes',
    title: 'Custom Mailer & Shipping Boxes | MX PACK',
    description: 'Custom corrugated mailer and shipping boxes for food products, subscription kits and global delivery. Built for protection and branded unboxing.',
    intro: 'Protect packaged food products, kits and retail orders with corrugated structures developed around product dimensions, weight and the delivery journey.',
    image: 'assets/img/popular-shipping-box.jpg',
    alt: 'Custom corrugated mailer and shipping box by MX PACK',
    bestFor: 'Subscription kits, packaged snacks, bakery gifts, retail food products, ecommerce and export shipments.',
    structure: 'Roll-end mailers, regular shipping cartons, self-locking boxes and insert-supported kits.',
    materials: 'Corrugated board grades selected for product weight, stacking, delivery route and required print surface.',
    customization: 'Custom dimensions, internal inserts, tear strips, branded outer or inner print and shipping labels.',
    order: 'MOQ starts from 200 pieces for selected mailer formats. Provide product size, packed weight, quantity and shipping method.',
    highlights: [
      ['Protection starts with fit', 'Right-sized cartons reduce movement, excess filler and avoidable shipping volume.'],
      ['Strength matched to the route', 'Board grade is reviewed against weight, stacking, handling and whether the shipment is domestic or international.'],
      ['Unboxing with a purpose', 'Inside printing, inserts and organized product placement can turn delivery packaging into a brand moment.'],
      ['Export packing support', 'Master-carton configuration and packing quantities can be planned alongside the individual mailer.'],
    ],
    faq: [
      ['What information is needed for a mailer box quote?', 'Send product dimensions, packed weight, quantity, shipping method and whether an insert or filler is required.'],
      ['Can you create custom inserts?', 'Yes. Paperboard and corrugated inserts can be developed to organize and protect products inside the mailer.'],
      ['Can both the inside and outside be printed?', 'Yes. Inside and outside print options depend on board surface, artwork, quantity and production method.'],
      ['Can you help reduce shipping volume?', 'We can review product arrangement and box dimensions to reduce unnecessary space while preserving protection.'],
    ],
  },
};

const relatedMap = {
  'takeaway-food-boxes': ['burger-boxes', 'pizza-boxes', 'custom-paper-bags'],
  'burger-boxes': ['takeaway-food-boxes', 'pizza-boxes', 'custom-paper-bags'],
  'pizza-boxes': ['takeaway-food-boxes', 'burger-boxes', 'mailer-shipping-boxes'],
  'bakery-cake-boxes': ['custom-paper-bags', 'grazing-catering-boxes', 'mailer-shipping-boxes'],
  'sushi-boxes': ['takeaway-food-boxes', 'grazing-catering-boxes', 'custom-paper-bags'],
  'grazing-catering-boxes': ['bakery-cake-boxes', 'sushi-boxes', 'custom-paper-bags'],
  'custom-paper-bags': ['takeaway-food-boxes', 'bakery-cake-boxes', 'mailer-shipping-boxes'],
  'mailer-shipping-boxes': ['custom-paper-bags', 'bakery-cake-boxes', 'takeaway-food-boxes'],
};

const productLinks = Object.entries(products)
  .map(([slug, product]) => `<a href='/${slug}'>${product.name}</a>`)
  .join('');

const desktopNavigation = `<nav class='desktop-nav' aria-label='Main navigation'>
<div class='nav-group'><a class='nav-trigger' href='/products'>Products</a><div class='mega-menu'>${productLinks}</div></div>
<a class='nav-link' href='/#how'>How It Works</a>
<a class='nav-link' href='/custom-food-packaging'>Capabilities</a>
<a class='nav-link' href='/faq'>FAQ</a>
<a class='nav-link' href='/get-a-quote'>Get a Quote</a>
</nav>`;

const mobileNavigation = `<nav class='mobile-nav' id='mobile-navigation' aria-label='Mobile navigation' data-mobile-nav>
<details><summary>Products</summary><a href='/products'>View All Products</a>${productLinks}</details>
<a href='/#how'>How It Works</a>
<a href='/custom-food-packaging'>Capabilities</a>
<a href='/faq'>FAQ</a>
<a class='btn' href='/get-a-quote'>Get a Quote</a>
</nav>`;

const simpleFooter = `<footer class='site-footer'>
<div class='container'>
<div class='footer-grid'>
<div class='footer-about'><a class='brand' href='/'><img src='assets/img/logo-mxpack-official.svg' alt='MX PACK'><span>MX PACK</span></a>
<p>Custom food packaging, low-MOQ project support and global export service from Foshan, China.</p></div>
<div><h3>Food Boxes</h3><ul>
<li><a href='/takeaway-food-boxes'>Takeaway Food Boxes</a></li>
<li><a href='/burger-boxes'>Burger Boxes</a></li>
<li><a href='/pizza-boxes'>Pizza Boxes</a></li>
<li><a href='/bakery-cake-boxes'>Bakery & Cake Boxes</a></li>
</ul></div>
<div><h3>More Packaging</h3><ul>
<li><a href='/sushi-boxes'>Sushi Boxes</a></li>
<li><a href='/grazing-catering-boxes'>Grazing & Catering Boxes</a></li>
<li><a href='/custom-paper-bags'>Custom Paper Bags</a></li>
<li><a href='/mailer-shipping-boxes'>Mailer & Shipping Boxes</a></li>
</ul></div>
<div><h3>Support</h3><ul>
<li><a href='/custom-food-packaging'>Capabilities</a></li>
<li><a href='/faq'>FAQ</a></li>
<li><a href='/get-a-quote'>Get a Quote</a></li>
<li><a href='mailto:meloxu98@gmail.com'>meloxu98@gmail.com</a></li>
</ul></div>
</div>
<div class='footer-bottom'>&copy; 2026 MX PACK / Foshan Xumelo Technology Co., Ltd.</div>
</div>
</footer>`;

function simplifyNavigation(html) {
  return html
    .replace(/<nav class='desktop-nav'.*?<\/nav>/s, desktopNavigation)
    .replace(/<nav class='mobile-nav'.*?<\/nav>/s, mobileNavigation)
    .replace(/<footer class='site-footer'>.*?<\/footer>/s, simpleFooter);
}

function addSocialMetadata(html, slug, product) {
  const pageUrl = `https://mxpackpro.com/${slug}`;
  const imageUrl = `https://mxpackpro.com/${product.image}`;
  const metadata = `<meta data-seo-social property='og:type' content='product'>
<meta data-seo-social property='og:title' content='${product.title.replace(' | MX PACK', '')}'>
<meta data-seo-social property='og:description' content='${product.description}'>
<meta data-seo-social property='og:url' content='${pageUrl}'>
<meta data-seo-social property='og:image' content='${imageUrl}'>
<meta data-seo-social name='twitter:card' content='summary_large_image'>
<meta data-seo-social name='twitter:title' content='${product.title.replace(' | MX PACK', '')}'>
<meta data-seo-social name='twitter:description' content='${product.description}'>
<meta data-seo-social name='twitter:image' content='${imageUrl}'>
<link data-seo-social rel='alternate' hreflang='en' href='${pageUrl}'>
<link data-seo-social rel='alternate' hreflang='x-default' href='${pageUrl}'>`;
  return html
    .replace(/\n?<meta data-seo-social .*?>/g, '')
    .replace(/\n?<link data-seo-social .*?>/g, '')
    .replace('</head>', `${metadata}\n</head>`);
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderRelated(slug) {
  return relatedMap[slug].map((relatedSlug) => {
    const item = products[relatedSlug];
    return `<a class='link-card' href='/${relatedSlug}'>
<div class='card-media'><img src='${item.image}' alt='${item.alt}' loading='lazy'></div>
<div class='card-body'><h3>${item.name}</h3><p>${item.intro}</p><span class='text-link'>View product</span></div>
</a>`;
  }).join('\n');
}

function renderProductMain(slug, product) {
  const quoteUrl = `/get-a-quote?product=${encodeURIComponent(product.name)}`;
  const highlights = product.highlights.map(([title, copy], index) => `<div class='process-step'>
<span>${index + 1}</span><h3>${title}</h3><p>${copy}</p>
</div>`).join('\n');
  const faq = product.faq.map(([question, answer]) => `<details class='seo-faq-item'>
<summary>${question}</summary><p>${answer}</p>
</details>`).join('\n');

  return `<main id='main'>
<section class='hero product-hero'>
<div class='container hero-grid'>
<div>
<p class='eyebrow'>Factory-direct custom food packaging</p>
<h1>${product.h1}</h1>
<p class='hero-copy'>${product.intro}</p>
<div class='actions'>
<a class='btn' href='${quoteUrl}'>Request Pricing</a>
<a class='btn secondary' href='${quoteUrl}'>Ask About Dielines</a>
</div>
</div>
<div class='hero-media'>
<span class='hero-mark'>LOW MOQ FROM 200 PCS</span>
<img src='${product.image}' alt='${product.alt}'>
</div>
</div>
</section>
<div class='fact-strip'>
<div class='container facts'>
<div class='fact'><strong>200 PCS</strong><span>Selected custom formats</span></div>
<div class='fact'><strong>OEM / ODM</strong><span>Size, structure and print</span></div>
<div class='fact'><strong>Food-grade</strong><span>Options selected by use</span></div>
<div class='fact'><strong>Global export</strong><span>Shipment planning support</span></div>
</div>
</div>
<section class='section'>
<div class='container detail-layout'>
<div class='detail-visual'><img src='${product.image}' alt='${product.alt}' loading='lazy'></div>
<div class='detail-copy'>
<p class='section-kicker'>Product specifications</p>
<h2>Built around your food, brand and order.</h2>
<p>Pricing is based on the finished specification rather than a generic box. Share dimensions, quantity, food type, artwork and destination so the material and production route can be matched to the project.</p>
<div class='spec-list'>
<div class='spec-row'><strong>Best for</strong><span>${product.bestFor}</span></div>
<div class='spec-row'><strong>Structures</strong><span>${product.structure}</span></div>
<div class='spec-row'><strong>Materials</strong><span>${product.materials}</span></div>
<div class='spec-row'><strong>Customization</strong><span>${product.customization}</span></div>
<div class='spec-row'><strong>Order details</strong><span>${product.order}</span></div>
</div>
<ul class='feature-list'>
<li>Custom dimensions</li><li>Branded printing</li><li>Food-grade options</li>
<li>Dieline support</li><li>Pre-production samples</li><li>Export packing</li>
</ul>
</div>
</div>
</section>
<section class='section alt'>
<div class='container'>
<div class='section-head'>
<div><p class='section-kicker'>Buying considerations</p><h2>Details that make the packaging work.</h2></div>
<p>Good packaging is more than artwork. Structure, material, packing speed and delivery conditions need to work together.</p>
</div>
<div class='process'>${highlights}</div>
</div>
</section>
<section class='section'>
<div class='container'>
<div class='section-head'><div><p class='section-kicker'>Common questions</p><h2>${product.name} FAQ</h2></div></div>
<div class='seo-faq-list'>${faq}</div>
</div>
</section>
<section class='section alt'>
<div class='container'>
<div class='section-head'><div><p class='section-kicker'>Related products</p><h2>Compare other packaging formats.</h2></div></div>
<div class='grid'>${renderRelated(slug)}</div>
</div>
</section>
<section class='quote-band'>
<div class='container quote-inner'>
<div><p class='section-kicker'>Get an accurate quote</p><h2>Send the size, quantity, artwork and delivery country.</h2>
<p>These details help us recommend the structure, material, sample route and production plan for your project.</p></div>
<a class='btn' href='${quoteUrl}'>Get a Custom Quote</a>
</div>
</section>
</main>`;
}

function buildSchema(slug, product) {
  const pageUrl = `https://mxpackpro.com/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${pageUrl}#product`,
        name: product.h1,
        description: product.description,
        image: `https://mxpackpro.com/${product.image}`,
        brand: { '@type': 'Brand', name: 'MX PACK' },
        manufacturer: {
          '@type': 'Organization',
          name: 'Foshan Xumelo Technology Co., Ltd.',
          url: 'https://mxpackpro.com/',
        },
        category: 'Custom Food Packaging',
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: product.faq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mxpackpro.com/' },
          { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://mxpackpro.com/products' },
          { '@type': 'ListItem', position: 3, name: product.name, item: pageUrl },
        ],
      },
    ],
  };
}

for (const [slug, product] of Object.entries(products)) {
  const file = path.join(siteRoot, `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<title>.*?<\/title>/s, `<title>${product.title}</title>`);
  html = html.replace(/<meta name='description' content='[^']*'>/, `<meta name='description' content='${product.description}'>`);
  html = html.replace(/<main id='main'>.*?<\/main>/s, renderProductMain(slug, product));
  html = html.replace(/<script id='seo-schema' type='application\/ld\+json'>.*?<\/script>/s, '');
  html = html.replace('</head>', `<script id='seo-schema' type='application/ld+json'>${escapeJson(buildSchema(slug, product))}</script>\n</head>`);
  html = addSocialMetadata(html, slug, product);
  html = simplifyNavigation(html);
  fs.writeFileSync(file, html, 'utf8');
}

for (const slug of ['products', 'get-a-quote']) {
  const file = path.join(siteRoot, `${slug}.html`);
  const html = simplifyNavigation(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, html, 'utf8');
}

console.log(`Generated ${Object.keys(products).length} SEO product pages.`);
