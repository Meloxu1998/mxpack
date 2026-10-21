import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {taxonomy,aliases} from './catalog-taxonomy.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const write=(file,text)=>fs.writeFileSync(path.join(root,file),text);
const products=JSON.parse(read('seo-system/data/catalog-products.json'));
const sources=JSON.parse(read('seo-system/data/catalog-provenance.json')).products;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const href=c=>`/products?category=${c.id}`;
const links=taxonomy.map(c=>`<a href="${href(c)}">${esc(c.label)}</a>`).join('');
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>`products/${f}`)];
for(const file of files){
 let html=read(file);
 html=html.replace(/(<div class="mega-menu mega-menu-products" id="nav-products">[\s\S]*?<div class="mega-menu-grid">)[\s\S]*?(<\/div><\/div>)/,`$1${links}$2`)
  .replace(/(<details><summary>Products<\/summary><a href="\/products"[^>]*>All products<\/a>)[\s\S]*?<\/details>/,`$1${links}</details>`)
  .replace(/products-catalog-v2\.js\?v=[^"\s]+/g,'products-catalog-v2.js?v=20261021-3');
 html=html.replace(/inquiry-analytics\.js\?v=[^"\s]+/g,'inquiry-analytics.js?v=20261021-6');
 write(file,html);
}
const navigation=JSON.parse(read('seo-system/data/site-navigation.json'));
navigation.find(n=>n.id==='products').children=taxonomy.map(c=>({label:c.label,url:href(c)}));
write('seo-system/data/site-navigation.json',JSON.stringify(navigation,null,2)+'\n');
write('seo-system/data/catalog-taxonomy.json',JSON.stringify({categories:taxonomy,aliases},null,2)+'\n');

let home=read('index.html');
const cards=taxonomy.map(c=>{
 const p=products.find(p=>p.slug===c.image),s=sources.find(s=>s.id===p.sourceId);
 const disclosure=s.kind==='design-concept'?'<span class="home-family-disclosure">Design visualization</span>':'';
 return `<a class="home-family" href="${href(c)}" data-home-family="${c.id}" data-track="home_category_click"><div class="home-family-media"><img src="${s.thumbnailPath}" srcset="${s.thumbnailPath} 480w, ${s.imagePath} 960w" sizes="(max-width:600px) calc((100vw - 56px) / 2), (max-width:1000px) 29vw, 300px" alt="${esc(p.name)}" width="480" height="480" loading="lazy" decoding="async">${disclosure}</div><div class="home-family-title"><h3>${esc(c.label)}</h3><i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></div><p>${esc(c.description)}</p></a>`;
}).join('');
home=home.replace(/<section class="home-collections" id="packaging">[\s\S]*?<\/section>/,`<section class="home-collections" id="packaging"><div class="container"><div class="home-section-head"><div><p class="eyebrow">The packaging collection</p><h2>Find your format.</h2></div><div><p>Choose by product, occasion or packaging structure. Compare food, retail and gift formats for your next order.</p><a class="text-link" href="/products">Browse all ${products.length} products</a></div></div><div class="home-families">${cards}</div></div></section>`)
 .replaceAll('41 products',`${products.length} products`).replaceAll('41 distinct',`${products.length} distinct`).replaceAll('View all 41 formats',`View all ${products.length} formats`)
 .replace(/home-premium\.css\?v=[^"\s]+/g,'home-premium.css?v=20261021-2');
home=home.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(original,json)=>{
 const schema=JSON.parse(json);
 for(const node of schema['@graph']||[]){
  if(node['@type']==='WebPage'&&node.mainEntity?.['@type']==='ItemList')node.mainEntity={
   '@type':'ItemList',name:'Packaging categories',numberOfItems:taxonomy.length,itemListElement:taxonomy.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.label,url:`https://mxpackpro.com${href(c)}`}))};
 }
 return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
});
write('index.html',home);

let catalog=read('products.html');
const oldSection=catalog.match(/<section class="catalog-section(?: catalog-taxonomy)?" id="catalog">[\s\S]*?<\/section>/)?.[0];
if(!oldSection)throw new Error('Catalog section missing');
const productCards=[...oldSection.matchAll(/<article\b[^>]*class="catalog-card"[\s\S]*?<\/article>/g)].map(m=>{
 const slug=m[0].match(/data-product-id="([^"]+)"/)?.[1];
 if(!products.some(p=>p.slug===slug))throw new Error(`Unknown card ${slug}`);
 return m[0].replace(/ data-catalog-categories="[^"]*"/g,'').replace('<article ',`<article data-catalog-categories="${taxonomy.filter(c=>c.members.includes(slug)).map(c=>c.id).join(' ')}" `);
});
if(productCards.length!==products.length)throw new Error('Wrong catalog card count');
const search=oldSection.match(/<div class="catalog-search-row">[\s\S]*?<\/div>/)?.[0];
if(!search)throw new Error('Catalog search controls missing');
const note=oldSection.match(/<p class="catalog-note">[\s\S]*?<\/p>/)?.[0]||'';
const button=(id,label,count)=>`<button type="button" class="catalog-filter" data-catalog-filter="${id}" aria-pressed="${id==='all'}"><span>${esc(label)}</span><span class="taxonomy-count">${count}</span></button>`;
const section=`<section class="catalog-section catalog-taxonomy" id="catalog"><div class="container"><div class="catalog-heading"><div><p class="eyebrow">${products.length} selected packaging formats</p><h2 class="section-title">Find your packaging format.</h2></div><p>Choose a category, then compare construction, sizing and print options. Each format has one product page, even when it suits more than one use.</p></div><div class="taxonomy-layout"><aside class="taxonomy-sidebar" aria-label="Packaging categories"><h2>Product categories</h2><label class="taxonomy-mobile-label" for="catalog-category">Category</label><select id="catalog-category" data-catalog-select><option value="all">All products (${products.length})</option>${taxonomy.map(c=>`<option value="${c.id}">${esc(c.label)} (${c.members.length})</option>`).join('')}</select><div class="taxonomy-buttons" role="group" aria-label="Filter packaging products">${button('all','All products',products.length)}${taxonomy.map(c=>button(c.id,c.label,c.members.length)).join('')}</div><a class="taxonomy-seasonal" href="/christmas-packaging">Christmas planning &amp; timing <span aria-hidden="true">&#8594;</span></a></aside><div class="taxonomy-results">${search}<p class="taxonomy-context" data-catalog-context aria-live="polite">Choose a category or search all packaging formats.</p><div class="catalog-grid">${productCards.join('')}</div>${note}<p class="catalog-empty" data-catalog-empty hidden>No matching formats. Try another category or a shorter search.</p></div></div></div><script type="application/json" data-catalog-taxonomy>${JSON.stringify({categories:taxonomy.map(({id,label,description})=>({id,label,description})),aliases})}</script></section>`;
catalog=catalog.replace(oldSection,section);
if(!catalog.includes('/assets/css/catalog-taxonomy.css'))catalog=catalog.replace('</head>','<link rel="stylesheet" href="/assets/css/catalog-taxonomy.css?v=20261021-2">\n</head>');
catalog=catalog.replace(/catalog-taxonomy\.css\?v=[^"\s]+/g,'catalog-taxonomy.css?v=20261021-2');
write('products.html',catalog);
console.log(`Unified ${taxonomy.length} categories across homepage, catalog and ${files.length} document menus. Preserved ${productCards.length} product cards.`);
