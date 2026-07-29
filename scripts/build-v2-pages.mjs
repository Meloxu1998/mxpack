import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(repoRoot, "site-v2-preview");
const imageRoot = "../mxpack_website_with_section_images/assets/img/";

const groups = [
  {
    slug: "products",
    title: "Products",
    label: "Food packaging catalogue",
    intro: "Browse custom food packaging by structure and use. Every product page is prepared for future specifications, product photography and quote details.",
    image: "mx-fast-food-box.jpg",
    items: [
      { slug: "takeaway-food-boxes", title: "Takeaway Food Boxes", short: "Grease-resistant structures for hot meals, noodles, snacks and takeaway service.", image: "mx-fast-food-box.jpg" },
      { slug: "burger-boxes", title: "Burger Boxes", short: "Compact clamshell and folding boxes designed for burgers, fries and meal combinations.", image: "popular-burger-box.webp" },
      { slug: "pizza-boxes", title: "Pizza Boxes", short: "Printed corrugated boxes for pizza, flat meals and delivery applications.", image: "popular-pizza-box.jpg" },
      { slug: "bakery-cake-boxes", title: "Bakery & Cake Boxes", short: "Window, handle and presentation boxes for cakes, pastries and desserts.", image: "mx-cake-box.jpg" },
      { slug: "sushi-boxes", title: "Sushi Boxes", short: "Clean display packaging for sushi, cold food and premium takeaway sets.", image: "popular-sushi-box.jpg" },
      { slug: "grazing-catering-boxes", title: "Grazing & Catering Boxes", short: "Presentation-ready boxes for catering, platters, fruit and event food.", image: "mx-grazing-box.jpg" },
      { slug: "custom-paper-bags", title: "Custom Paper Bags", short: "Branded paper bags with multiple handle, paper and size options.", image: "paper-bag.svg" },
      { slug: "mailer-shipping-boxes", title: "Mailer & Shipping Boxes", short: "Protective corrugated packaging for food products, kits and global delivery.", image: "popular-shipping-box.jpg" }
    ]
  },
  {
    slug: "solutions",
    title: "Solutions",
    label: "Packaging by business need",
    intro: "Start from your business stage or sales channel, then connect the right packaging mix, order quantity and project support.",
    image: "popular-gable-box.webp",
    items: [
      { slug: "low-moq-startups", title: "Low MOQ for Startups", short: "A practical 200-piece entry point for new brands testing products and markets.", image: "popular-gable-box.webp" },
      { slug: "enterprise-packaging", title: "Enterprise Packaging", short: "Structured project management, quality control and repeat-order support.", image: "popular-shipping-box.jpg" },
      { slug: "restaurant-takeaway-packaging", title: "Restaurants & Takeaway", short: "Coordinated food boxes, bags and accessories for daily takeaway service.", image: "mx-fast-food-box.jpg" },
      { slug: "bakery-dessert-packaging", title: "Bakeries & Dessert Brands", short: "Presentation-led packaging systems for cakes, pastries and gifting.", image: "mx-cake-box.jpg" },
      { slug: "catering-event-packaging", title: "Catering & Events", short: "Flexible box combinations for platters, events and seasonal campaigns.", image: "mx-grazing-box.jpg" },
      { slug: "food-brand-retail-packaging", title: "Food Brands & Retail", short: "Shelf-ready printed packaging for branded food products and retail launches.", image: "popular-mailer-box.jpg" }
    ]
  },
  {
    slug: "customization",
    title: "Customization",
    label: "Build the right packaging",
    intro: "A clear route through structure, material, printing, artwork and sampling decisions before production.",
    image: "feature-printing.svg",
    items: [
      { slug: "box-styles-structures", title: "Box Styles & Structures", short: "Compare folding, locking, window, handle and corrugated structures.", image: "food-box.svg" },
      { slug: "materials-food-safety", title: "Materials & Food Safety", short: "Review paperboard, kraft, corrugated and grease-resistant options.", image: "feature-greaseproof.svg" },
      { slug: "printing-finishes", title: "Printing & Finishes", short: "Plan colors, coverage, lamination, foil, UV and surface effects.", image: "feature-printing.svg" },
      { slug: "dielines-artwork", title: "Dielines & Artwork", short: "Prepare dimensions, dielines, bleed and production-ready artwork.", image: "hero-packaging.svg" },
      { slug: "samples-prototyping", title: "Samples & Prototyping", short: "Choose the right blank, printed or production sample route.", image: "popular-gable-box.webp" }
    ]
  },
  {
    slug: "why-mxpack",
    title: "Why MX PACK",
    label: "Manufacturing confidence",
    intro: "The evidence buyers need before placing a custom packaging order: company, factory, quality, sustainability and delivery capability.",
    image: "factory.svg",
    items: [
      { slug: "about-us", title: "About Us", short: "Meet MX PACK and the team supporting overseas packaging projects.", image: "logo-mxpack-official.svg" },
      { slug: "factory-equipment", title: "Factory & Equipment", short: "Present printing, converting, finishing and packing capabilities.", image: "factory.svg" },
      { slug: "quality-control", title: "Quality Control", short: "Show prepress checks, production inspection and final quality assurance.", image: "factory-qc.svg" },
      { slug: "sustainability", title: "Sustainability", short: "Explain responsible material, production and packaging-size choices.", image: "feature-eco.svg" },
      { slug: "global-shipping", title: "Global Shipping", short: "Clarify export packing, delivery planning and shipping support.", image: "popular-shipping-box.jpg" }
    ]
  },
  {
    slug: "resources",
    title: "Resources",
    label: "Packaging knowledge",
    intro: "Useful answers and practical preparation tools for overseas buyers planning custom food packaging.",
    image: "hero-packaging.svg",
    items: [
      { slug: "faq", title: "Frequently Asked Questions", short: "Answers covering pricing, artwork, production, dielines and sustainability.", image: "hero-packaging.svg" },
      { slug: "packaging-buying-guide", title: "Packaging Buying Guide", short: "A structured route from product requirements to final production.", image: "food-box.svg" },
      { slug: "moq-pricing-guide", title: "MOQ & Pricing Guide", short: "Understand how size, style, print, material and quantity affect cost.", image: "popular-gable-box.webp" },
      { slug: "artwork-checklist", title: "Artwork Checklist", short: "Prepare resolution, bleed, color and dieline files before proofing.", image: "feature-printing.svg" },
      { slug: "case-studies", title: "Case Studies", short: "A future library for real packaging briefs, decisions and finished results.", image: "popular-mailer-box.jpg" }
    ]
  }
];

const navLinks = groups.map((group) => {
  const children = group.items.map((item) => "<a href='" + item.slug + ".html'>" + item.title + "</a>").join("");
  return "<div class='nav-group'><a class='nav-trigger' href='" + group.slug + ".html'>" + group.title + "</a><div class='mega-menu'>" + children + "</div></div>";
}).join("");

const mobileLinks = groups.map((group) => {
  const children = group.items.map((item) => "<a href='" + item.slug + ".html'>" + item.title + "</a>").join("");
  return "<details><summary>" + group.title + "</summary><a href='" + group.slug + ".html'>View all " + group.title + "</a>" + children + "</details>";
}).join("");

function header() {
  return [
    "<a class='skip-link' href='#main'>Skip to content</a>",
    "<div class='utility-bar'><div class='container utility-inner'><p>Factory-direct custom food packaging from Foshan, China</p><div class='utility-contact'><a href='tel:+8615521163050'>+86 155 2116 3050</a><a href='mailto:meloxu98@gmail.com'>meloxu98@gmail.com</a></div></div></div>",
    "<header class='site-header'>",
    "<div class='container nav-shell'>",
    "<a class='brand' href='index.html'><img src='" + imageRoot + "logo-mxpack-official.svg' alt='MX PACK'><span>MX PACK</span></a>",
    "<nav class='desktop-nav' aria-label='Main navigation'>" + navLinks + "<a class='nav-link' href='get-a-quote.html'>Get a Quote</a></nav>",
    "<a class='nav-cta' href='get-a-quote.html'>Get a Quote</a>",
    "<button class='menu-toggle' type='button' aria-expanded='false' aria-controls='mobile-navigation' data-menu-toggle>Menu</button>",
    "</div>",
    "<nav class='mobile-nav' id='mobile-navigation' aria-label='Mobile navigation' data-mobile-nav>" + mobileLinks + "<a class='btn' href='get-a-quote.html'>Get a Quote</a></nav>",
    "</header>"
  ].join("");
}

function footer() {
  const footerGroups = groups.slice(0, 4).map((group) => {
    const links = group.items.slice(0, 4).map((item) => "<li><a href='" + item.slug + ".html'>" + item.title + "</a></li>").join("");
    return "<div><h3>" + group.title + "</h3><ul>" + links + "</ul></div>";
  }).join("");
  return [
    "<footer class='site-footer'><div class='container'>",
    "<div class='footer-grid'><div class='footer-about'><a class='brand' href='index.html'><img src='" + imageRoot + "logo-mxpack-official.svg' alt='MX PACK'><span>MX PACK</span></a><p>Custom food packaging, low-MOQ project support and global export service from Foshan, China.</p></div>",
    footerGroups,
    "</div><div class='footer-bottom'>© 2026 MX PACK / Foshan Xumelo Technology Co., Ltd.</div></div></footer>",
    "<a class='floating-whatsapp' href='https://wa.me/447704644465' target='_blank' rel='noopener' aria-label='Chat with MX PACK on WhatsApp'>WA</a>"
  ].join("");
}

function breadcrumb(group, pageTitle) {
  const groupPart = group ? "<li><a href='" + group.slug + ".html'>" + group.title + "</a></li>" : "";
  const pagePart = pageTitle ? "<li aria-current='page'>" + pageTitle + "</li>" : "";
  return "<nav class='breadcrumb' aria-label='Breadcrumb'><div class='container'><ol><li><a href='index.html'>Home</a></li>" + groupPart + pagePart + "</ol></div></nav>";
}

function base(title, description, content) {
  return [
    "<!doctype html><html lang='en'><head>",
    "<meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
    "<meta name='robots' content='noindex,nofollow'>",
    "<title>" + title + " | MX PACK V2 Preview</title>",
    "<meta name='description' content='" + description.replaceAll("'", "&#39;") + "'>",
    "<link rel='preconnect' href='https://fonts.googleapis.com'><link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>",
    "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap' rel='stylesheet'>",
    "<link rel='stylesheet' href='assets/css/site.css'>",
    "</head><body>",
    header(),
    content,
    footer(),
    "<script src='assets/js/site.js'></script></body></html>"
  ].join("");
}

function facts() {
  return "<div class='fact-strip'><div class='container facts'><div class='fact'><strong>200 PCS</strong><span>Low minimum order available</span></div><div class='fact'><strong>OEM / ODM</strong><span>Structure, size and print support</span></div><div class='fact'><strong>Food-grade</strong><span>Material options by project</span></div><div class='fact'><strong>Global export</strong><span>Production and shipping support</span></div></div></div>";
}

function card(item) {
  return "<a class='link-card' href='" + item.slug + ".html'><div class='card-media'><img src='" + imageRoot + item.image + "' alt=''></div><div class='card-body'><h3>" + item.title + "</h3><p>" + item.short + "</p><span class='text-link'>View framework</span></div></a>";
}

function quoteBand() {
  return "<section class='quote-band'><div class='container quote-inner'><div><p class='section-kicker'>Start a packaging project</p><h2>Share the food, box style, size and quantity you need.</h2><p>MX PACK will use these details to prepare the next quote, dieline and sample steps.</p></div><a class='btn' href='get-a-quote.html'>Get a Custom Quote</a></div></section>";
}

function homepageNavigation() {
  const desktopGroups = groups.map((group) => {
    const children = group.items.map((item) => "<a href=\"" + item.slug + ".html\">" + item.title + "</a>").join("");
    return "<div class=\"v2-nav-item\"><a href=\"" + group.slug + ".html\">" + group.title + "</a><div class=\"v2-dropdown\"><a class=\"v2-view-all\" href=\"" + group.slug + ".html\">View all " + group.title + "</a>" + children + "</div></div>";
  }).join("");
  const mobileGroups = groups.map((group) => {
    const children = group.items.map((item) => "<a href=\"" + item.slug + ".html\">" + item.title + "</a>").join("");
    return "<details><summary>" + group.title + "</summary><a class=\"v2-view-all\" href=\"" + group.slug + ".html\">View all " + group.title + "</a>" + children + "</details>";
  }).join("");
  return [
    "<nav class=\"nav\"><div class=\"container nav-inner\">",
    "<a class=\"brand\" href=\"#top\"><img src=\"" + imageRoot + "logo-mxpack-official.svg\" alt=\"MX PACK logo\"><span>MX PACK</span></a>",
    "<div class=\"nav-links v2-nav-links\">" + desktopGroups + "</div>",
    "<details class=\"v2-mobile-menu\"><summary>Menu</summary><div class=\"v2-mobile-panel\">" + mobileGroups + "<a class=\"v2-mobile-quote\" href=\"get-a-quote.html\">Get a Quote</a></div></details>",
    "<a class=\"btn\" href=\"https://wa.me/447704644465\" target=\"_blank\" rel=\"noopener\">Get Quote</a>",
    "</div></nav>"
  ].join("");
}

function homepageNavigationStyles() {
  return [
    ".v2-nav-links { gap: 8px; }",
    ".v2-nav-item { position: relative; }",
    ".v2-nav-item > a { display: inline-flex; align-items: center; min-height: 46px; padding: 0 8px; }",
    ".v2-nav-item > a::after { content: '+'; margin-left: 6px; color: var(--muted); }",
    ".v2-dropdown { display: none; position: absolute; left: 0; top: calc(100% - 2px); width: 300px; padding: 10px; background: white; border: var(--line); border-radius: 8px; box-shadow: 10px 12px 0 rgba(16,16,16,.16); }",
    ".v2-nav-item:hover .v2-dropdown, .v2-nav-item:focus-within .v2-dropdown { display: grid; }",
    ".v2-dropdown a { padding: 9px 10px; border-radius: 5px; font-size: 12px; text-transform: none; }",
    ".v2-dropdown a:hover { background: var(--soft-orange); color: var(--ink); }",
    ".v2-dropdown .v2-view-all { margin-bottom: 5px; border-bottom: 1px solid #ded7d0; border-radius: 0; font-weight: 900; text-transform: uppercase; }",
    ".v2-mobile-menu { display: none; position: relative; margin-left: auto; }",
    ".v2-mobile-menu > summary { min-height: 44px; display: inline-flex; align-items: center; padding: 0 15px; border: var(--line); border-radius: 999px; background: white; font-weight: 900; text-transform: uppercase; cursor: pointer; list-style: none; }",
    ".v2-mobile-menu > summary::-webkit-details-marker { display: none; }",
    ".v2-mobile-panel { position: fixed; left: 12px; right: 12px; top: 112px; max-height: calc(100vh - 130px); overflow: auto; padding: 12px 18px 20px; background: white; border: var(--line); border-radius: 8px; box-shadow: 10px 12px 0 rgba(16,16,16,.18); }",
    ".v2-mobile-panel details { border-bottom: 1px solid #ded7d0; }",
    ".v2-mobile-panel details summary { padding: 14px 0; font-weight: 900; text-transform: uppercase; cursor: pointer; }",
    ".v2-mobile-panel details a { display: block; padding: 8px 0 8px 14px; font-size: 14px; }",
    ".v2-mobile-panel .v2-view-all { color: #b94129; font-weight: 900; }",
    ".v2-mobile-quote { display: block; margin-top: 16px; padding: 13px; border: var(--line); border-radius: 999px; background: var(--orange); text-align: center; font-weight: 900; text-transform: uppercase; }",
    "@media (max-width: 1180px) { .v2-nav-links { gap: 0; font-size: 12px; } .v2-nav-item > a { padding: 0 5px; } .nav-inner { gap: 14px; } }",
    "@media (max-width: 980px) { .v2-mobile-menu { display: block; } }",
    "@media (max-width: 640px) { .v2-mobile-panel { top: 124px; } }"
  ].join("");
}

function homePage() {
  const homepagePath = path.join(repoRoot, "mxpack_website_with_section_images", "index.html");
  return fs.readFileSync(homepagePath, "utf8")
    .replace("</style>", homepageNavigationStyles() + "</style>")
    .replace("</head>", "  <meta name=\"robots\" content=\"noindex,nofollow\">\n</head>")
    .replaceAll("src=\"assets/", "src=\"../mxpack_website_with_section_images/assets/")
    .replace(/<nav class=\"nav\">[\s\S]*?<\/nav>/, homepageNavigation())
    .replaceAll("href=\"/custom-food-packaging\"", "href=\"products.html\"")
    .replaceAll("href=\"custom-food-packaging.html\"", "href=\"products.html\"")
    .replaceAll("href=\"/faq\"", "href=\"faq.html\"");
}

function hubPage(group) {
  const cards = group.items.map(card).join("");
  const content = [
    breadcrumb(null, group.title),
    "<main id='main'>",
    "<section class='hero'><div class='container hero-grid'><div><p class='eyebrow'>" + group.label + "</p><h1>" + group.title + "</h1><p class='hero-copy'>" + group.intro + "</p><div class='actions'><a class='btn' href='get-a-quote.html'>Discuss Your Project</a><a class='btn secondary' href='#page-options'>View All Options</a></div></div><div class='hero-media'><span class='hero-mark'>SECOND-LEVEL PAGE</span><img src='" + imageRoot + group.image + "' alt=''></div></div></section>",
    facts(),
    "<section class='section' id='page-options'><div class='container'><div class='section-head'><div><p class='section-kicker'>Page collection</p><h2>Explore " + group.title.toLowerCase() + ".</h2></div><p>Every entry below is an independent third-level page prepared for its own content, images, search intent and quote path.</p></div><div class='grid'>" + cards + "</div></div></section>",
    "<section class='split-band'><div class='split-copy'><p class='section-kicker'>Shared page system</p><h2>Consistent structure without repetitive content.</h2><p>All pages share navigation and conversion components, while the central information area changes according to the buyer's question.</p><div class='actions'><a class='btn secondary' href='get-a-quote.html'>Plan a Quote</a></div></div><div class='split-visual'><img src='" + imageRoot + group.image + "' alt=''></div></section>",
    quoteBand(),
    "</main>"
  ].join("");
  return base(group.title, group.intro, content);
}

function productDetail(group, item) {
  const siblings = group.items.filter((entry) => entry.slug !== item.slug).slice(0, 3).map(card).join("");
  const content = [
    breadcrumb(group, item.title),
    "<main id='main'>",
    "<section class='hero'><div class='container hero-grid'><div><p class='eyebrow'>Custom food packaging</p><h1>" + item.title + "</h1><p class='hero-copy'>" + item.short + "</p><div class='actions'><a class='btn' href='get-a-quote.html'>Request Pricing</a><a class='btn secondary' href='dielines-artwork.html'>Request a Dieline</a></div></div><div class='hero-media'><span class='hero-mark'>PRODUCT PAGE FRAMEWORK</span><img src='" + imageRoot + item.image + "' alt=''></div></div></section>",
    facts(),
    "<section class='section'><div class='container detail-layout'><div class='detail-visual'><img src='" + imageRoot + item.image + "' alt=''></div><div class='detail-copy'><p class='section-kicker'>Product overview</p><h2>A clear specification area for packaging buyers.</h2><p>This framework is ready for the final product description, real photography, dimensions, material data and manufacturing notes.</p><div class='spec-list'><div class='spec-row'><strong>Best for</strong><span>Food applications and customer scenarios will be confirmed.</span></div><div class='spec-row'><strong>Structure</strong><span>Available formats, closures and inserts will be added.</span></div><div class='spec-row'><strong>Materials</strong><span>Paperboard, kraft, corrugated and barrier options by project.</span></div><div class='spec-row'><strong>Customization</strong><span>Size, print coverage, finishes and branded artwork.</span></div><div class='spec-row'><strong>Order details</strong><span>MOQ, sampling, lead time and export packing information.</span></div></div><ul class='feature-list'><li>Custom dimensions</li><li>Branded printing</li><li>Food-grade options</li><li>Sample support</li><li>Quality inspection</li><li>Global delivery</li></ul></div></div></section>",
    "<section class='section alt'><div class='container'><div class='section-head'><div><p class='section-kicker'>Page modules</p><h2>Prepared for the details customers compare.</h2></div><p>Real content will replace these framework headings as product information becomes available.</p></div><div class='process'><div class='process-step'><span>1</span><h3>Uses and formats</h3><p>Product suitability, capacity and food applications.</p></div><div class='process-step'><span>2</span><h3>Material options</h3><p>Board grade, barrier, thickness and sustainability.</p></div><div class='process-step'><span>3</span><h3>Printing and finish</h3><p>Color, coverage, lamination and premium effects.</p></div><div class='process-step'><span>4</span><h3>Ordering FAQ</h3><p>MOQ, samples, production, packing and shipping.</p></div></div></div></section>",
    "<section class='section'><div class='container'><div class='section-head'><div><p class='section-kicker'>Related products</p><h2>Continue comparing packaging.</h2></div></div><div class='grid'>" + siblings + "</div></div></section>",
    quoteBand(),
    "</main>"
  ].join("");
  return base(item.title, item.short, content);
}

function contentDetail(group, item) {
  const siblingCards = group.items.filter((entry) => entry.slug !== item.slug).slice(0, 3).map(card).join("");
  const isSolution = group.slug === "solutions";
  const isTrust = group.slug === "why-mxpack";
  const labels = isSolution
    ? ["Who this is for", "Recommended packaging mix", "Project support", "Next step"]
    : isTrust
      ? ["Verified company facts", "Real production evidence", "Buyer reassurance", "Supporting documents"]
      : ["Core explanation", "Available choices", "Preparation checklist", "Related questions"];
  const content = [
    breadcrumb(group, item.title),
    "<main id='main'>",
    "<section class='hero'><div class='container hero-grid'><div><p class='eyebrow'>" + group.label + "</p><h1>" + item.title + "</h1><p class='hero-copy'>" + item.short + "</p><div class='actions'><a class='btn' href='get-a-quote.html'>Talk to MX PACK</a><a class='btn secondary' href='#content-framework'>View Page Structure</a></div></div><div class='hero-media'><span class='hero-mark'>THIRD-LEVEL PAGE</span><img src='" + imageRoot + item.image + "' alt=''></div></div></section>",
    "<section class='section' id='content-framework'><div class='container'><div class='section-head'><div><p class='section-kicker'>Content framework</p><h2>One focused question per page.</h2></div><p>The final page will use real MX PACK facts, photography and documentation rather than repeated generic claims.</p></div><div class='process'>" + labels.map((label, index) => "<div class='process-step'><span>" + (index + 1) + "</span><h3>" + label + "</h3><p>This area is prepared for verified information and supporting visuals.</p></div>").join("") + "</div></div></section>",
    "<section class='section alt'><div class='container detail-layout'><div class='detail-visual'><img src='" + imageRoot + item.image + "' alt=''></div><div class='detail-copy'><p class='section-kicker'>Evidence-led layout</p><h2>Designed to be scanned, compared and trusted.</h2><p>The finished page will pair concise copy with specifications, production evidence, examples and clear actions instead of long uninterrupted paragraphs.</p><div class='spec-list'><div class='spec-row'><strong>Primary answer</strong><span>The most important buyer question appears first.</span></div><div class='spec-row'><strong>Supporting proof</strong><span>Real images, data, documents or examples support each claim.</span></div><div class='spec-row'><strong>Related route</strong><span>Relevant products and quote actions remain easy to reach.</span></div></div></div></div></section>",
    "<section class='section'><div class='container'><div class='section-head'><div><p class='section-kicker'>Explore next</p><h2>Related pages in " + group.title + ".</h2></div></div><div class='grid'>" + siblingCards + "</div></div></section>",
    quoteBand(),
    "</main>"
  ].join("");
  return base(item.title, item.short, content);
}

function quotePage() {
  const content = [
    breadcrumb(null, "Get a Quote"),
    "<main id='main'><section class='hero'><div class='container hero-grid'><div><p class='eyebrow'>Custom packaging enquiry</p><h1>Tell us what you need to package.</h1><p class='hero-copy'>This framework collects the details required for a useful packaging recommendation and quote.</p></div><div class='hero-media'><img src='" + imageRoot + "hero-packaging.svg' alt=''></div></div></section>",
    "<section class='section'><div class='container quote-layout'><div><p class='section-kicker'>Direct contact</p><h2>Start with the easiest channel.</h2><div class='contact-stack'><div class='contact-line'><span>WhatsApp</span><strong>+44 7704 644465</strong></div><div class='contact-line'><span>Phone</span><strong>+86 155 2116 3050</strong></div><div class='contact-line'><span>Email</span><strong>meloxu98@gmail.com</strong></div></div></div><form class='quote-form'><div class='field'><label for='name'>Name</label><input id='name' name='name' autocomplete='name'></div><div class='field'><label for='email'>Business email</label><input id='email' name='email' type='email' autocomplete='email'></div><div class='field'><label for='company'>Company</label><input id='company' name='company' autocomplete='organization'></div><div class='field'><label for='country'>Country / region</label><input id='country' name='country' autocomplete='country-name'></div><div class='field'><label for='product'>Packaging type</label><select id='product' name='product'><option>Choose a category</option><option>Takeaway food boxes</option><option>Bakery and cake boxes</option><option>Paper bags</option><option>Other custom packaging</option></select></div><div class='field'><label for='quantity'>Estimated quantity</label><input id='quantity' name='quantity' inputmode='numeric'></div><div class='field full'><label for='details'>Size, food type, artwork and project details</label><textarea id='details' name='details'></textarea></div><div class='field full'><button class='btn' type='button'>Submit Enquiry</button></div></form></div></section></main>"
  ].join("");
  return base("Get a Quote", "Share custom food packaging requirements with MX PACK.", content);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "index.html"), homePage());

for (const group of groups) {
  fs.writeFileSync(path.join(outputDir, group.slug + ".html"), hubPage(group));
  for (const item of group.items) {
    const html = group.slug === "products" ? productDetail(group, item) : contentDetail(group, item);
    fs.writeFileSync(path.join(outputDir, item.slug + ".html"), html);
  }
}

fs.writeFileSync(path.join(outputDir, "get-a-quote.html"), quotePage());

const pageCount = 2 + groups.length + groups.reduce((total, group) => total + group.items.length, 0);
console.log("Generated " + pageCount + " V2 preview pages in " + outputDir);
