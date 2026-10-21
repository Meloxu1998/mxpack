import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=path.join(root,'seo-system/data');
const products=JSON.parse(fs.readFileSync(path.join(data,'catalog-products.json'),'utf8'));
const navigation=JSON.parse(fs.readFileSync(path.join(data,'site-navigation.json'),'utf8'));
const section=navigation.find(n=>n.id==='products');
if(!section.children.some(n=>n.url==='/products?category=gifts'))section.children.push({label:'Custom Gift Boxes',url:'/products?category=gifts'});
const seasonal=fs.existsSync(path.join(root,'christmas-packaging.html'));
if(seasonal&&!section.children.some(n=>n.url==='/christmas-packaging'))section.children.push({label:'Christmas Packaging',url:'/christmas-packaging'});
fs.writeFileSync(path.join(data,'site-navigation.json'),'[\n  '+navigation.map(n=>JSON.stringify(n)).join(',\n  ')+'\n]\n');
fs.writeFileSync(path.join(root,'assets/js/catalog-data.js'),`window.mxpackProducts=${JSON.stringify(Object.fromEntries(products.map(p=>[p.slug,{name:p.name,category:p.category,...(p.views?{views:Object.fromEntries(p.views.map(v=>[v.id,v.label]))}:{})}])))};\n`);
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>`products/${f}`)];
for(const file of files){
 const target=path.join(root,file);let html=fs.readFileSync(target,'utf8');
 html=html.replace(/<header class="site-header">[\s\S]*?<\/header>/,header=>{
   if(!header.includes('href="/products?category=gifts"'))header=header.replace(/(<a\b[^>]*href="\/bakery-cake-boxes"[^>]*>Bakery &amp; Cake Boxes<\/a>|<a\b[^>]*href="\/bakery-cake-boxes"[^>]*>Bakery & Cake Boxes<\/a>)/g,'$1<a href="/products?category=gifts">Custom Gift Boxes</a>');
   if(seasonal&&!header.includes('href="/christmas-packaging"'))header=header.replaceAll('<a href="/products?category=gifts">Custom Gift Boxes</a>','<a href="/products?category=gifts">Custom Gift Boxes</a><a href="/christmas-packaging">Christmas Packaging</a>');
   return header.replace(/Browse all \d+ products/g,`Browse all ${products.length} products`);
 }).replace(/catalog-data\.js\?v=[^"\s]+/g,'catalog-data.js?v=20261021-6')
 .replace(/inquiry-analytics\.js\?v=[^"\s]+/g,'inquiry-analytics.js?v=20261021-5')
 .replace(/products-catalog-v2\.js\?v=[^"\s]+/g,'products-catalog-v2.js?v=20261021-2');
 fs.writeFileSync(target,html);
}
console.log(`Synchronized gift navigation and product inquiry context across ${files.length} documents.`);
await import('./sync-catalog-taxonomy.mjs');
