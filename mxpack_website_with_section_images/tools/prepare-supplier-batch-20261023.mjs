import fs from 'node:fs';
const dir='D:/mxpack-audits/2026-10-23/product-upload';
const additions=JSON.parse(fs.readFileSync('seo-system/data/catalog-expansion-20261023.json','utf8'));
const existing=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
const withdrawn=JSON.parse(fs.readFileSync('seo-system/data/withdrawn-products.json','utf8'));
const groups=JSON.parse(fs.readFileSync(dir+'/supplier-groups.json','utf8'));
const sources=new Map(groups.flatMap(g=>g.products.map(p=>({...p,sourceGroup:g.group,sourceGroupUrl:g.url,verifiedAt:'2026-10-23'}))).map(p=>[p.id,p]));
for(const p of additions){
 if(!sources.has(p.sourceId)||withdrawn.some(w=>w.slug===p.slug))throw Error('Unverified/withdrawn product '+p.slug);
 const old=existing.find(q=>q.sourceId===p.sourceId||q.slug===p.slug||q.dedupGroup===p.dedupGroup);
 if(old&&old.slug!==p.slug)throw Error('Duplicate '+p.slug);
 if(!/250 pieces/.test(sources.get(p.sourceId).moq))throw Error('MOQ needs individual review '+p.slug);
}
const fresh=additions.filter(p=>!existing.some(q=>q.slug===p.slug));
const merged=[...existing.map(p=>additions.find(q=>q.slug===p.slug)||p),...fresh];
fs.writeFileSync('seo-system/data/catalog-products.json','[\n  '+merged.map(p=>JSON.stringify(p)).join(',\n  ')+'\n]\n');
fs.writeFileSync(dir+'/selected-products.json',JSON.stringify(additions.map(p=>sources.get(p.sourceId)),null,2));
fs.writeFileSync(dir+'/dedup-decision.json',JSON.stringify({checkedAt:new Date().toISOString(),previousProducts:merged.length-additions.length,selected:additions.map(p=>({sourceId:p.sourceId,slug:p.slug,group:sources.get(p.sourceId).sourceGroup,decision:p.distinct})),excluded:[{id:'1601522047646',reason:'Title mentions window soap box, image shows a closed gum carton; do not publish mismatched claim.'},{id:'1601591959373',reason:'Wine category/title but pictured product is a different toolkit carton; insufficient reference.'},{id:'1601645148051',reason:'Same wide-handle retail bag construction as selected 1601645106085.'},{id:'1601586264452',reason:'Consolidate with selected tear-open mailer; no proven independent closure/use.'}],sourceCounts:groups.map(g=>({group:g.group,count:g.products.length})),batchCount:additions.length,addedThisRun:fresh.length},null,2));
console.log(`Prepared ${fresh.length} source-verified distinct additions; ${existing.length+fresh.length} total.`);
