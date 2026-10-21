import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const additions=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-expansion-20261021.json'),'utf8'));
const catalogPath=path.join(root,'seo-system/data/catalog-products.json');
const existing=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const snapshot=JSON.parse(fs.readFileSync('D:/mxpack-audits/2026-10-21/alibaba-catalog-source.json','utf8'));
const sources=new Map(snapshot.flatMap(page=>page.products).map(p=>[p.id,p]));
if(additions.length!==20||new Set(additions.map(p=>p.dedupGroup)).size!==20)throw Error('Expected 20 different construction/use combinations.');
for(const p of additions){
 if(!sources.has(p.sourceId))throw Error('Missing supplier reference '+p.sourceId);
 const original=existing.find(q=>q.sourceId===p.sourceId||q.slug===p.slug);
 if(original&&!additions.some(q=>q.slug===original.slug))throw Error('Duplicate existing product '+p.slug);
}
const fresh=additions.filter(p=>!existing.some(q=>q.slug===p.slug));
fs.writeFileSync(catalogPath,'[\n  '+[...existing,...fresh].map(p=>JSON.stringify(p)).join(',\n  ')+'\n]\n');
const output='D:/mxpack-audits/2026-10-21/catalog-expansion/selected-20.json';
fs.writeFileSync(output,JSON.stringify(additions.map(p=>({...sources.get(p.sourceId),verification:'Supplier catalog captured earlier on 2026-10-21; image reviewed against the published construction. Order terms require quotation.'})),null,2));
console.log(`Prepared ${fresh.length} additions; ${existing.length+fresh.length} total products. Source selection: ${output}`);
