import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='custom-packaging.html',base='https://mxpackpro.com';
let html=fs.readFileSync(file,'utf8');
const formSection=html.indexOf('<section class="section quote-contact-section"');
const main=html.indexOf('<main id="main">');
assert(main>=0&&formSection>main,'Existing custom inquiry section not found');
const originalForm=html.match(/<form class="contact-form"[\s\S]*?<\/form>/)?.[0];
assert(originalForm,'Existing form not found');
const icon=name=>`<i class="icon" data-lucide="${name}" aria-hidden="true"></i>`;
const faq=[
 ['What can I customize?','Discuss the structure, internal dimensions, inserts, material and artwork for your selected format. The available construction and print options are confirmed against your packed product, quantity and intended use.'],
 ['Is the same minimum quantity available for every format?','No. MOQ is confirmed per structure, size, material and artwork version. Share quantities for each format separately so the quotation does not assume one combined minimum for an entire packaging range.'],
 ['Can I check a sample before approving production?','Ask which stock, structural or printed sample is appropriate for your project. Sample availability, charges and timing require confirmation. Evaluate fit, closure, carrying and artwork against the agreed specification before approval.'],
 ['What if my artwork or dimensions are not ready?','Send the product dimensions or a reference, the intended use, approximate quantity and destination. Mark undecided details clearly. The structure and artwork requirements can then be reviewed before a final quotation.'],
 ['How are food-contact requirements and delivery timing confirmed?','For food packaging, specify the food type, packing temperature, contact time and destination market, then request documents for that exact specification. Production and delivery timing are reviewed after the specification, approval steps, quantity and destination are known.']
];
const capabilities=[
 ['1601597702648','Dimensions & fit','Size the pack around your product, insert and carrying weight.','Internal size / clearance / packed weight','/products?category=cake-boxes','Explore fitted formats'],
 ['1601645125177','Structure & inserts','Review the opening, closure and product support together.','Box style / closure / product separation','/products?category=gift-boxes','Explore gift structures'],
 ['1601583986975','Material & intended use','Confirm the complete construction for the actual handling conditions.','Board / lining / use requirements','/materials-food-safety','Review material requirements'],
 ['1601587149215','Artwork & print','Check the dieline, artwork placement and finish before approval.','Print areas / artwork version / finish','/custom-packaging#printing','Prepare your artwork']
];
const steps=[
 ['01','Share the brief','Packed product, use, quantities, artwork status and destination.','Output: a defined starting brief'],
 ['02','Review the specification','Structure, dimensions, material, inserts and print requirements.','Output: a specification to quote'],
 ['03','Evaluate a sample','Confirm sample scope; check fit, closing and presentation.','Output: recorded approval details'],
 ['04','Plan production & delivery','Confirm the approved version, outer packing and shipping terms.','Output: agreed order requirements']
];
const checklist=[['Product & use','What is packed, its weight and how the packaging will be handled.'],['Dimensions','Product footprint and height, including inserts or a cake board.'],['Quantity per version','Pieces for each size, structure and artwork, not just a combined total.'],['Artwork status','Ready artwork, an existing design or a reference to discuss.'],['Destination & arrival date','Country, postal code and required arrival date for a timing review.']];
const content=`<main id="main">
<section class="service-hero" aria-labelledby="service-title"><picture class="service-hero-image"><source media="(max-width:760px)" srcset="/assets/img/home/diverse-packaging-range-mobile-20261023-640.webp 640w, /assets/img/home/diverse-packaging-range-mobile-20261023-960.webp 960w" sizes="100vw" width="1570" height="725"><img src="/assets/img/home/diverse-packaging-range-20261023-2048.webp" srcset="/assets/img/home/diverse-packaging-range-20261023-1280.webp 1280w, /assets/img/home/diverse-packaging-range-20261023-2048.webp 2048w" sizes="100vw" width="2170" height="725" alt="Design visualization of custom food, retail and gift packaging in a sample workspace" fetchpriority="high"></picture><div class="container service-hero-inner"><div class="service-hero-copy"><p class="eyebrow">MXPACKPRO / Structure, materials &amp; print</p><h1 id="service-title">Custom packaging.</h1><p class="service-strap">Specified for your product.</p><p class="service-intro">Foodservice, retail or gifting: develop the box, insert, cup or bag around your product and brand. Confirm the details before you commit to production.</p><div class="service-actions"><a class="button button-dark" href="#quote-form" data-track="quote_custom_service_click">Build your brief ${icon('arrow-right')}</a><a class="service-text-link" href="#capabilities">Explore customization ${icon('arrow-down')}</a></div></div></div><span class="service-image-note">Product range &amp; sample workspace visualization</span></section>
<nav class="service-jump" aria-label="Custom packaging sections"><div class="container"><a href="#capabilities">Customization</a><a href="#approval-process">Approval process</a><a href="#printing">Artwork &amp; brief</a><a href="#samples">Samples &amp; FAQ</a></div></nav>
<section class="service-section" id="capabilities"><div class="container"><div class="service-heading"><div><p class="eyebrow">Define the complete pack</p><h2>More than a logo on a box.</h2></div><p>Four decisions shape the packaging specification. Review them together for a food, retail or gift range.</p></div><div class="service-capabilities">${capabilities.map(([id,title,description,scope,url,label])=>`<article><img src="/assets/img/catalog/${id}-480.webp" srcset="/assets/img/catalog/${id}-480.webp 480w, /assets/img/catalog/${id}-960.webp 960w" sizes="(max-width:600px) 44vw, 290px" alt="${title} packaging example" width="480" height="480" loading="lazy"><h3>${title}</h3><p>${description}</p><p class="service-scope">${scope}</p><a class="service-text-link" href="${url}">${label} ${icon('arrow-right')}</a></article>`).join('')}</div></div></section>
<section class="service-section service-process" id="approval-process"><div class="container"><div class="service-heading"><div><p class="eyebrow">From brief to order</p><h2>Clear steps. Defined approvals.</h2></div><p>Confirm the specification and sample expectations first, then agree production and delivery requirements.</p></div><ol>${steps.map(([n,title,text,output])=>`<li><span>${n}</span><h3>${title}</h3><p>${text}</p><small>${output}</small></li>`).join('')}</ol></div></section>
<section class="service-section" id="printing"><div class="container service-brief"><div><p class="eyebrow">Artwork &amp; quotation brief</p><h2>A better brief.<br>A more useful quotation.</h2><p>Send what you already know and flag what needs advice. Artwork can be reviewed against the agreed structure and dieline.</p><a class="service-text-link" href="#quote-form">Send your project details ${icon('arrow-right')}</a><a class="service-text-link" href="/moq-pricing-guide">Understand MOQ &amp; pricing ${icon('arrow-right')}</a></div><dl>${checklist.map(([name,value])=>`<div><dt>${name}</dt><dd>${value}</dd></div>`).join('')}</dl></div></section>
<section class="service-section service-faq" id="samples"><div class="container service-faq-grid"><div><p class="eyebrow">Before you approve</p><h2>Questions worth asking.</h2><p>Sample scope, costs and timing depend on the proposed specification. Check the details for your project rather than assuming a standard promise applies.</p><a class="service-text-link" href="/packaging-buying-guide">Packaging buying guide ${icon('arrow-right')}</a></div><div>${faq.map(([q,a])=>`<details><summary>${q}${icon('chevron-down')}</summary><p>${a}</p></details>`).join('')}</div></div></section>
`;
html=html.slice(0,main)+content+html.slice(formSection);
assert.equal(html.match(/<form class="contact-form"[\s\S]*?<\/form>/)?.[0],originalForm,'Inquiry form changed');
const title='Custom Packaging Design, Printing & Samples | MXPACKPRO';
const description='Plan custom food, retail and gift packaging with MXPACKPRO. Review structures, inserts, materials, artwork, samples and your quotation brief before production.';
html=html.replace(/<title>.*?<\/title>/,`<title>${title.replaceAll('&','&amp;')}</title>`).replace(/(<meta name="description" content=")[^"]+/,`$1${description}`).replace(/(<meta property="og:title" content=")[^"]+/,`$1${title.replaceAll('&','&amp;')}`).replace(/(<meta property="og:description" content=")[^"]+/,`$1${description}`).replace(/(<meta property="og:image" content=")[^"]+/,`$1${base}/assets/img/home/diverse-packaging-range-20261023-2048.webp`);
html=html.replace(/<script type="application\/ld\+json" data-custom-service-schema>[\s\S]*?<\/script>/g,'');
html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,json)=>{
 const data=JSON.parse(json);if(data['@type']==='FAQPage'||data['@type']==='Service')return '';
 if(data['@type']==='BreadcrumbList')data.itemListElement[1].name='Custom Packaging';
 return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
});
const schema={'@context':'https://schema.org','@graph':[{'@type':'Service',name:'Custom packaging specification, printing and sampling',url:base+'/custom-packaging',description,provider:{'@type':'Organization',name:'MXPACKPRO',url:base}}, {'@type':'FAQPage',mainEntity:faq.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))}]};
html=html.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/custom-service.css[^>]+>/g,'').replace('</head>',`<link rel="stylesheet" href="/assets/css/custom-service.css?v=20261023-1">\n<script type="application/ld+json" data-custom-service-schema>${JSON.stringify(schema)}</script>\n</head>`).replace(/<body(?: class="[^"]*")?>/,'<body class="custom-service-page">');
html=html.replace(/inquiry-analytics\.js\?v=[\w-]+/g,'inquiry-analytics.js?v=20261023-modal-2');
html=html.replace(/<script src="\/assets\/js\/custom-service.js[^>]+><\/script>/g,'').replace('</body>','<script src="/assets/js/custom-service.js?v=20261023-1"></script></body>');
fs.writeFileSync(file,html);
let sitemap=fs.readFileSync('sitemap.xml','utf8');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
sitemap=sitemap.replace(/(<loc>https:\/\/mxpackpro.com\/custom-packaging<\/loc><lastmod>)[^<]+/,`$1${today}`);
fs.writeFileSync('sitemap.xml',sitemap);
console.log('Built custom service page; existing inquiry form preserved.');
