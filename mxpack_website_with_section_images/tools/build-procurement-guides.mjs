import fs from 'node:fs';
import {compactInteractionHtml} from './url-state-html.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://mxpackpro.com';
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const guides = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/procurement-guides.json'), 'utf8'));
const products = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-products.json'), 'utf8'));
const sources = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-provenance.json'), 'utf8')).products;
const publish = process.argv.find(arg => arg.startsWith('--publish='))?.slice('--publish='.length);
if (publish && !guides.some(guide => guide.slug === publish)) throw Error('Unknown guide');
if (process.argv.includes('--check-schedule')) {
  console.log(JSON.stringify(guides.map(guide=>({slug:guide.slug,plannedPublishOn:guide.plannedPublishOn,canPublish:today>=guide.plannedPublishOn}))));
  process.exit(0);
}
const preview = process.argv.find(arg => arg.startsWith('--preview-dir='))?.slice('--preview-dir='.length)
  || `D:/mxpack-audits/${today}/procurement-drafts`;
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const schema = data => `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org', ...data}).replaceAll('<', '\\u003c')}</script>`;
const product = slug => {
  const item = products.find(item => item.slug === slug);
  if (!item) throw Error(`Unknown product ${slug}`);
  const source = sources.find(source => source.id === item.sourceId);
  if (!source) throw Error(`Missing image source for ${slug}`);
  return {...item, source};
};
const template = fs.readFileSync(path.join(root, 'packaging-buying-guide.html'), 'utf8');
const renderSection = section => `<section class="buyer-guide-section"><h2 class="section-title">${esc(section.heading)}</h2>${(section.paragraphs||[]).map(text=>`<p>${esc(text)}</p>`).join('')}${section.table?`<div class="buyer-table-wrap" role="region" aria-label="${esc(section.heading)}" tabindex="0"><table class="buyer-table"><thead><tr>${section.table.headings.map(text=>`<th scope="col">${esc(text)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map(row=>`<tr>${row.map((text,index)=>index?`<td>${esc(text)}</td>`:`<th scope="row">${esc(text)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${section.steps?`<ol class="buyer-guide-checks">${section.steps.map(([title,text])=>`<li><strong>${esc(title)}</strong><p>${esc(text)}</p></li>`).join('')}</ol>`:''}</section>`;

for (const guide of guides.filter(guide=>!publish || guide.slug===publish)) {
  const destination = path.join(root, `${guide.slug}.html`);
  if (publish && today < guide.plannedPublishOn) throw Error(`Not due: ${guide.plannedPublishOn}; preview only today.`);
  if (publish && fs.existsSync(destination)) throw Error('Guide already exists; review it before any update.');
  const date = publish ? today : guide.plannedPublishOn;
  const primary = product(guide.product);
  const quote = `/get-a-quote?product=${guide.product}&amp;source=guide`;
  const cta = `<a class="button button-dark" href="${quote}" data-track="quote_guide_click" data-product-id="${guide.product}">Discuss this packaging <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a>`;
  const related = guide.related.map(slug=>{
    const item = product(slug);
    return `<a class="solution-product" href="/products/${slug}"><img src="${item.source.thumbnailPath}" alt="${esc(item.name)}" width="480" height="480" loading="lazy"><span>${esc(item.name)}</span></a>`;
  }).join('');
  const article = `<article class="section section-white buyer-guide"><div class="container"><p class="eyebrow">MXPACKPRO team &middot; ${publish?'Published':'Planned publication'} <time datetime="${date}">${date}</time></p><p class="section-copy buyer-guide-intro">${esc(guide.intro)}</p><figure class="buyer-guide-section" style="max-width:640px;margin-inline:auto"><img src="${primary.source.imagePath}" alt="${esc(primary.name)} product reference" width="${primary.source.width}" height="${primary.source.height}" loading="lazy" style="width:100%;height:auto"><figcaption>Product reference. Final dimensions, components and printing require project confirmation.</figcaption></figure>${guide.sections.map(renderSection).join('')}<section class="buyer-guide-section"><h2 class="section-title">Compare the formats</h2><div class="solution-products buyer-guide-products">${related}</div><p><a class="text-link" href="/moq-pricing-guide">Prepare a like-for-like quotation</a></p></section><section class="buyer-guide-section"><h2 class="section-title">Purchasing questions</h2><div class="accordion">${guide.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section><section class="buyer-guide-section"><h2 class="section-title">Reference</h2>${guide.sources.map(source=>`<p><a class="text-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></p><p>${esc(source.note)} Checked October 22, 2026.</p>`).join('')}</section><section class="buyer-guide-section"><h2 class="section-title">Start with a complete brief</h2><p>Send your dimensions, quantity per artwork version, intended contents, destination and required arrival date. Include your sample questions and undecided details.</p><div class="hero-actions">${cta}<a class="text-link" href="mailto:sales@mxpackpro.com">Email your brief</a></div></section></div></article>`;
  let page = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(guide.title)} | MXPACKPRO</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(guide.description)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${base}/${guide.slug}`)
    .replace(/(<meta property="og:type" content=")[^"]*/, '$1article')
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(guide.title)} | MXPACKPRO`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(guide.description)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/${guide.slug}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${base}${primary.source.imagePath}`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace('<body>', `<body data-guide-id="${guide.slug}">`)
    .replace(/<section class="page-hero hero-image">[\s\S]*?<\/section>/, `<section class="resource-hero"><div class="container"><div class="resource-hero-copy"><p class="eyebrow">Buying guide</p><h1 class="display-title">${esc(guide.title)}</h1><p class="section-copy">${esc(guide.description)}</p></div></div></section>`)
    .replace(/<article class="section section-white buyer-guide">[\s\S]*?<\/article>/, article)
    .replace('<a class="button button-dark" href="get-a-quote">Ask a packaging question <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a>', cta)
    .replaceAll(' aria-current="page"', '');
  const organization = {'@type':'Organization', name:'MXPACKPRO', url:base, email:'sales@mxpackpro.com'};
  const schemas = [organization,
    {'@type':'Article', headline:guide.title, description:guide.description, image:`${base}${primary.source.imagePath}`, datePublished:date, dateModified:date, mainEntityOfPage:`${base}/${guide.slug}`, author:organization, publisher:organization},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${base}/`},{'@type':'ListItem',position:2,name:'Guides',item:`${base}/resources`},{'@type':'ListItem',position:3,name:guide.title,item:`${base}/${guide.slug}`}]},
    {'@type':'FAQPage',mainEntity:guide.faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}];
  page = page.replace('</head>', `${schemas.map(schema).join('\n')}</head>`);
  page = compactInteractionHtml(page, '/' + guide.slug);
  if (!publish) {
    fs.mkdirSync(preview,{recursive:true});
    fs.writeFileSync(path.join(preview,`${guide.slug}.html`),page);
    console.log(`Draft only: ${path.join(preview,guide.slug+'.html')}`);
    continue;
  }
  fs.writeFileSync(destination,page);
  const resourcesFile=path.join(root,'resources.html');
  let resources=fs.readFileSync(resourcesFile,'utf8');
  if (!resources.includes(`href="/${guide.slug}"`)) resources=resources.replace('<div class="article-grid">',`<div class="article-grid"><article class="article-card"><a href="/${guide.slug}"><div class="article-card-media"><img src="${primary.source.thumbnailPath}" alt="${esc(primary.name)}" width="480" height="480" loading="lazy"></div><div class="article-card-body"><p class="eyebrow">Buying guide</p><h2>${esc(guide.title)}</h2><p>${esc(guide.description)}</p><span class="text-link">Read guide</span></div></a></article>`);
  fs.writeFileSync(resourcesFile,resources);
  const updated=['resources'];
  for (const slug of guide.related) {
    const filename=path.join(root,'products',slug+'.html');
    let html=fs.readFileSync(filename,'utf8');
    if (!html.includes(`href="/${guide.slug}"`)) html=html.replace('</main>',`<section class="section section-white" data-procurement-guide="${guide.slug}"><div class="container"><p class="eyebrow">Before you order</p><h2 class="section-title">${esc(guide.title)}</h2><p class="section-copy">${esc(guide.description)}</p><p><a class="text-link" href="/${guide.slug}">Read the buying guide</a></p></div></section></main>`);
    fs.writeFileSync(filename,html); updated.push(`products/${slug}`);
  }
  const sitemapFile=path.join(root,'sitemap.xml');
  let sitemap=fs.readFileSync(sitemapFile,'utf8');
  for (const slug of updated) sitemap=sitemap.replace(new RegExp(`(<loc>${base}/${slug}</loc><lastmod>)[^<]+`), `$1${today}`);
  if (!sitemap.includes(`<loc>${base}/${guide.slug}</loc>`)) sitemap=sitemap.replace('</urlset>',`  <url><loc>${base}/${guide.slug}</loc><lastmod>${today}</lastmod></url>\n</urlset>`);
  fs.writeFileSync(sitemapFile,sitemap);
  console.log(`Published source for ${guide.slug}; run validation, desktop/mobile QA and deployment verification before claiming it is live.`);
}
