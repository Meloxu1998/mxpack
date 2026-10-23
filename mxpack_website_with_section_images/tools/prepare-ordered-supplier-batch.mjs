import fs from 'node:fs';
const [manifest,sourceFile,out]=process.argv.slice(2);
if(!manifest||!sourceFile||!out)throw Error('Pass addition manifest, captured source groups and private evidence folder.');
const additions=JSON.parse(fs.readFileSync(manifest,'utf8'));
const captures=JSON.parse(fs.readFileSync(sourceFile,'utf8'));
const existing=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
const provenance=JSON.parse(fs.readFileSync('seo-system/data/catalog-provenance.json','utf8'));
const withdrawn=JSON.parse(fs.readFileSync('seo-system/data/withdrawn-products.json','utf8'));
const references=new Set(existing.flatMap(p=>[p.sourceId,...(p.views||[]).map(v=>v.sourceId)]));
const sources=new Map(captures.flatMap(g=>g.products.map(p=>({...p,sourceGroup:g.group,sourcePage:g.page||1,sourceGroupUrl:g.url,verifiedAt:new Date().toISOString()}))).map(p=>[p.id,p]));
for(const p of additions){
 if(withdrawn.some(w=>w.slug===p.slug)||!sources.has(p.sourceId))throw Error('Missing source or withdrawn product '+p.slug);
 const old=existing.find(q=>q.slug===p.slug);
 if(!old&&(references.has(p.sourceId)||existing.some(q=>q.dedupGroup&&q.dedupGroup===p.dedupGroup)))throw Error('Already published or a reference variation '+p.slug);
 const src=sources.get(p.sourceId);if(!/^Min\. Order: \d+ pieces$/.test(src.moq))throw Error('Verify individual MOQ '+p.slug);
 if(provenance.products.some(s=>s.id===p.sourceId)&&!old)throw Error('Previously documented reference requires manual review '+p.sourceId);
}
const fresh=additions.filter(p=>!existing.some(q=>q.slug===p.slug));
const result=[...existing,...fresh];
if(new Set(result.map(p=>p.slug)).size!==result.length||new Set(result.map(p=>p.sourceId)).size!==result.length)throw Error('Duplicate catalog');
fs.writeFileSync('seo-system/data/catalog-products.json','[\n  '+result.map(p=>JSON.stringify(p)).join(',\n  ')+'\n]\n');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/selected-products.json',JSON.stringify(additions.map(p=>sources.get(p.sourceId)),null,2));
console.log(`Prepared ${fresh.length} additions; ${result.length} unique catalog products.`);
