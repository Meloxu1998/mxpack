import fs from 'node:fs';
import {compactInteractionHtml} from './url-state-html.mjs';
import {taxonomy,aliases} from './catalog-taxonomy.mjs';
const additions=JSON.parse(fs.readFileSync(process.argv[2]||'seo-system/data/catalog-expansion-20261023.json','utf8'));
const assetVersion=process.argv[3]||'20261023-batch1';
if(!/^[a-zA-Z0-9-]+$/.test(assetVersion))throw Error('Invalid asset version');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const products=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
const previousCount=products.length-additions.length;
const countPattern=new RegExp('\\b'+previousCount+' (products|distinct formats|packaging formats|selected packaging formats)\\b','g');
const provenance=JSON.parse(fs.readFileSync('seo-system/data/catalog-provenance.json','utf8'));
const sources=provenance.products;
for(const p of additions){
 const source=sources.find(s=>s.id===p.sourceId);
 for(const key of ['imagePath','thumbnailPath'])source[key]=source[key].split('?')[0]+'?v='+assetVersion;
}
fs.writeFileSync('seo-system/data/catalog-provenance.json',JSON.stringify(provenance,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const currentMoqCopy=text=>text
 .replaceAll('The current catalog lists starting quantities of 250 or 300 or 500 pieces by format.','Starting quantities differ by product; review the selected product page or request a project quotation.')
 .replaceAll('The current product catalog shows starting quantities of 250 or 300 pieces, depending on the format.','Starting quantities differ by product and are shown on the individual product pages.')
 .replaceAll('The listed products start at 250 or 300 pieces depending on format.','Starting quantities vary by product and the approved specification.');
const labels={cosmetics:'Cosmetic cartons','beverage-packaging':'Beverage outer packaging',bags:'Bags & wraps',retail:'Mailers & gifts',catering:'Catering',bbq:'BBQ packaging','food-boxes':'Food boxes',bakery:'Bakery',drinkware:'Cups & carriers',gifts:'Custom gift boxes'};
let catalog=fs.readFileSync('products.html','utf8');
for(const p of additions){
 const source=sources.find(s=>s.id===p.sourceId),cats=taxonomy.filter(c=>c.members.includes(p.slug)).map(c=>c.id).join(' ');
 if(!source||!cats)throw Error('Source or category missing '+p.slug);
 const page=fs.readFileSync(`products/${p.slug}.html`,'utf8');
 const image=page.match(/<div class="detail-hero-media supplier-product-media">(<img[^>]+>)/)?.[1].replace('fetchpriority="high"','loading="lazy"');
 if(!image)throw Error('Product image missing '+p.slug);
 const href='/products/'+p.slug;
 const card=`<article data-catalog-categories="${cats}" class="catalog-card" data-catalog-category="${p.category}" data-product-id="${p.slug}" data-product-moq="${source.minimumOrder}" data-catalog-search="${esc([p.name,p.keyword,...p.uses].join(' ').toLowerCase())}"><a class="catalog-card-media supplier-product-media" href="${href}" data-track="catalog_product_click" data-product-id="${p.slug}">${image}</a><div class="catalog-card-body"><p class="catalog-card-kicker">${labels[p.category]}</p><h2><a href="${href}" data-track="catalog_product_click" data-product-id="${p.slug}">${esc(p.name)}</a></h2><dl class="catalog-specs"><div><dt>Starting MOQ</dt><dd>${source.minimumOrder} pieces*</dd></div><div><dt>Best for</dt><dd>${esc(p.uses[0])}</dd></div></dl><div class="catalog-card-actions"><a class="text-link" href="${href}" data-track="catalog_product_click" data-product-id="${p.slug}">View product</a><a class="button button-dark" href="/get-a-quote?product=${p.slug}&source=catalog" data-track="quote_product_click" data-product-id="${p.slug}">Get pricing</a></div></div></article>`;
 const re=new RegExp('<article\\b[^>]*data-product-id="'+p.slug+'"[\\s\\S]*?<\\/article>','g');
 catalog=catalog.replace(re,'');
 catalog=catalog.replace('</div><p class="catalog-note">',`${card}</div><p class="catalog-note">`);
}
for(const c of [{id:'all',members:products},...taxonomy]){
 const re=new RegExp('(<button[^>]*data-catalog-filter="'+c.id+'"[^>]*>[\\s\\S]*?<span class="taxonomy-count">)\\d+(<\\/span>)');
 catalog=catalog.replace(re,`$1${c.members.length}$2`);
 const option=new RegExp('(<option value="'+c.id+'">[^<]*?)\\(\\d+\\)(<\\/option>)');
 catalog=catalog.replace(option,`$1(${c.members.length})$2`);
}
catalog=catalog.replace(/(<p data-catalog-result-count[^>]*>)\d+ products/,`$1${products.length} products`)
 .replace(countPattern,`${products.length} $1`)
 .replace(/<script type="application\/json" data-catalog-taxonomy>[\s\S]*?<\/script>/,`<script type="application/json" data-catalog-taxonomy>${JSON.stringify({categories:taxonomy.map(({id,label,description})=>({id,label,description})),aliases})}</script>`)
 .replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,raw)=>{const s=JSON.parse(raw);if(s['@type']==='CollectionPage'&&s.mainEntity?.['@type']==='ItemList'){s.dateModified=today;s.mainEntity={...s.mainEntity,numberOfItems:products.length,itemListElement:products.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:'https://mxpackpro.com/products/'+p.slug}))};return `<script type="application/ld+json">${JSON.stringify(s)}</script>`}return all});
if((catalog.match(/class="catalog-card"/g)||[]).length!==products.length)throw Error('Catalog card mismatch');
fs.writeFileSync('products.html',compactInteractionHtml(catalog, '/products'));
fs.writeFileSync('seo-system/data/catalog-taxonomy.json',JSON.stringify({categories:taxonomy,aliases},null,2)+'\n');
const data=Object.fromEntries(products.map(p=>[p.slug,{name:p.name,category:p.category,...(p.views?{views:Object.fromEntries(p.views.map(v=>[v.id,v.label]))}:{})}]));
fs.writeFileSync('assets/js/catalog-data.js','window.mxpackProducts='+JSON.stringify(data)+';\n');
fs.writeFileSync('seo-system/data/catalog-keyword-map.csv',`product_id,primary_keyword,landing_page,category,starting_moq,source_id\n${products.map(p=>[p.slug,p.keyword,'https://mxpackpro.com/products/'+p.slug,p.category,sources.find(s=>s.id===p.sourceId).minimumOrder??'',p.sourceId].map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')}\n`);
const backlinks={};
for(const p of additions){
 const old=p.relatedSlugs?.find(slug=>!additions.some(q=>q.slug===slug));
 if(!old)throw Error('A related published product is required for '+p.slug);
 (backlinks[old]||=[]).push(p.slug);
}
for(const [old,slugs] of Object.entries(backlinks)){
 const file=`products/${old}.html`;let html=fs.readFileSync(file,'utf8');
 html=html.replace(new RegExp('<section[^>]*data-supplier-batch="'+assetVersion+'"[\\s\\S]*?<\\/section>','g'),'');
 const links=slugs.map(slug=>{const p=products.find(p=>p.slug===slug);return `<p><a class="text-link" href="/products/${slug}">${esc(p.name)}</a></p><p class="section-copy">${esc(p.distinct)}</p>`}).join('');
 html=html.replace('</main>',`<section class="section section-white" data-supplier-batch="${assetVersion}"><div class="container"><p class="eyebrow">Compare another construction</p><h2 class="section-title">A different format for your brief.</h2>${links}</div></section></main>`);
 fs.writeFileSync(file,compactInteractionHtml(html, '/' + file.replace(/\.html$/, '')));
}
for(const family of new Set(additions.filter(p=>p.family!=='products').map(p=>p.family))){
 const file=family+'.html';let html=fs.readFileSync(file,'utf8');
 html=html.replace(new RegExp('<section[^>]*data-family-batch="'+assetVersion+'"[\\s\\S]*?<\\/section>','g'),'');
 const links=additions.filter(p=>p.family===family).map(p=>`<p><a class="text-link" href="/products/${p.slug}">${esc(p.name)}</a></p><p class="section-copy">${esc(p.structure)}</p>`).join('');
 html=html.replace('<section class="cta-band">',`<section class="section section-white" data-family-batch="${assetVersion}"><div class="container"><p class="eyebrow">Compare constructions</p><h2 class="section-title">More formats for your brief.</h2>${links}</div></section><section class="cta-band">`);
 fs.writeFileSync(file,compactInteractionHtml(html, '/' + file.replace(/\.html$/, '')));
}
let sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const p of additions)if(!sitemap.includes(`<loc>https://mxpackpro.com/products/${p.slug}</loc>`))sitemap=sitemap.replace('</urlset>',`  <url><loc>https://mxpackpro.com/products/${p.slug}</loc><lastmod>${today}</lastmod></url>\n</urlset>`);
for(const pathname of ['/products',...additions.filter(p=>p.family!=='products').map(p=>'/'+p.family),...Object.keys(backlinks).map(s=>'/products/'+s)]){
 const old=`<loc>https://mxpackpro.com${pathname}</loc><lastmod>`;
 sitemap=sitemap.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^<]+'),old+today);
}
fs.writeFileSync('sitemap.xml',sitemap);
const files=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...fs.readdirSync('products').filter(f=>f.endsWith('.html')).map(f=>'products/'+f)];
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 const revisedMoq=currentMoqCopy(html);
 if(revisedMoq!==html){
  html=revisedMoq;
  const pathname=file==='index.html'?'/':'/'+file.replace(/\.html$/,'');
  const loc=`<loc>https://mxpackpro.com${pathname}</loc><lastmod>`;
  sitemap=sitemap.replace(new RegExp(loc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^<]+'),loc+today);
 }
 html=html.replace(/catalog-data\.js\?v=[^"\s]+/g,'catalog-data.js?v='+assetVersion).replace(countPattern,`${products.length} $1`);
 for(const p of additions)html=html.replace(new RegExp(p.sourceId+'-(480|960)\\.webp(?:\\?v=[a-zA-Z0-9-]+)?','g'),`${p.sourceId}-$1.webp?v=${assetVersion}`);
 fs.writeFileSync(file,compactInteractionHtml(html, file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '')));
}
fs.writeFileSync('sitemap.xml',sitemap);
for(const file of ['tools/update-procurement-faq.mjs','tools/update-buyer-journey.mjs'])fs.writeFileSync(file,currentMoqCopy(fs.readFileSync(file,'utf8')));
for(const file of ['tools/sync-gift-navigation.mjs','tools/update-site-shell.mjs','tools/update-inquiry-integration.mjs']){
 const source=fs.readFileSync(file,'utf8');
 fs.writeFileSync(file,source.replace(/catalog-data\.js\?v=[a-zA-Z0-9-]+/g,'catalog-data.js?v='+assetVersion));
}
console.log(`Integrated ${additions.length} distinct products, ${products.length} catalog cards, group filters, existing-page backlinks and sitemap. Existing product bodies and approved homepage layout preserved.`);
