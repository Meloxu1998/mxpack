import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const products=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-products.json'),'utf8'));
fs.writeFileSync(path.join(root,'assets/js/catalog-data.js'),`window.mxpackProducts=${JSON.stringify(Object.fromEntries(products.map(p=>[p.slug,{name:p.name,category:p.category}])))};\n`);
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>`products/${f}`)];
for(const file of files){
 const target=path.join(root,file); let html=fs.readFileSync(target,'utf8');
 if(!html.includes('assets/js/v4.js'))continue;
 html=html.replace("gtag('config','G-9VZK4M6KDS');","gtag('config','G-9VZK4M6KDS',{page_location:location.origin+location.pathname,page_referrer:document.referrer.split('?')[0]});");
 html=html.replace("};['pointerdown','keydown','scroll']","};window.mxpackLoadAnalytics=load;['pointerdown','keydown','scroll']").replace('setTimeout(load,10000)','setTimeout(load,2000)');
 html=html.replace(/(<script src="[^"]*assets\/js\/v4.js)[^"]*("><\/script>)/,'$1?v=20261021-4$2');
 if(!html.includes('assets/js/inquiry-analytics.js'))html=html.replace(/<script src="[^"]*assets\/js\/v4.js[^>]*><\/script>/,'<script src="/assets/js/catalog-data.js?v=20261021-1"></script>\n<script src="/assets/js/inquiry-analytics.js?v=20261021-1"></script>\n$&');
 if(file.startsWith('products/'))html=html.replace(/<script[^>]*src="[^"]*products-catalog-v2.js[^>]*><\/script>/g,'');
 fs.writeFileSync(target,html);
}
console.log(`Integrated inquiry attribution and privacy-safe analytics across ${files.length} pages.`);
