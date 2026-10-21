import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='custom-christmas-cracker-favor-box';
const sourceId='mxp-design-christmas-cracker';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const write=(file,text)=>fs.writeFileSync(path.join(root,file),text);
const data='seo-system/data/';
const original=JSON.parse(read(data+'catalog-products.json'));
const products=original.filter(p=>p.slug!==slug);
if(products.length!==original.length-1)throw Error('Expected exactly one product withdrawal');
write(data+'catalog-products.json','[\n  '+products.map(p=>JSON.stringify(p)).join(',\n  ')+'\n]\n');
const additions=JSON.parse(read(data+'christmas-products-20261021.json')).filter(p=>p.slug!==slug);
write(data+'christmas-products-20261021.json',JSON.stringify(additions,null,2)+'\n');
const collection=JSON.parse(read(data+'christmas-collection.json'));
collection.products=collection.products.filter(p=>p.slug!==slug);
write(data+'christmas-collection.json',JSON.stringify(collection,null,2)+'\n');
const provenance=JSON.parse(read(data+'catalog-provenance.json'));
provenance.products=provenance.products.filter(p=>p.id!==sourceId);
write(data+'catalog-provenance.json',JSON.stringify(provenance,null,2)+'\n');
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>`products/${f}`)];
for(const file of files){
 let html=read(file);
 html=html.replace(/<article\b[^>]*class="catalog-card"[\s\S]*?<\/article>/g,card=>card.includes(`data-product-id="${slug}"`)?'':card)
  .replace(/<a class="product-card"[\s\S]*?<\/a>/g,card=>card.includes(`/products/${slug}`)?'':card)
  .replaceAll(`${original.length} products`,`${products.length} products`)
  .replaceAll(`${original.length} formats`,`${products.length} formats`)
  .replaceAll(`${original.length} distinct`,`${products.length} distinct`)
  .replaceAll(`${original.length} selected`,`${products.length} selected`);
 html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,json)=>{
  const schema=JSON.parse(json);
  const list=schema.mainEntity;
  if(list?.['@type']==='ItemList'&&list.itemListElement?.some(p=>p.url?.endsWith('/'+slug))){
   list.itemListElement=list.itemListElement.filter(p=>!p.url?.endsWith('/'+slug)).map((p,i)=>({...p,position:i+1}));
   list.numberOfItems=list.itemListElement.length;
   return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  }
  return tag;
 });
 write(file,html);
}
write('sitemap.xml',read('sitemap.xml').replace(new RegExp(`\\s*<url><loc>https://mxpackpro.com/products/${slug}</loc>[\\s\\S]*?</url>`),''));
const lines=read(data+'catalog-keyword-map.csv').split(/\r?\n/);
write(data+'catalog-keyword-map.csv',lines.filter(line=>!line.startsWith(`"${slug}",`)).join('\n'));
console.log(`Withdrew one unsupported product. ${products.length} remaining product records preserved.`);
