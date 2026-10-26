import fs from 'node:fs';
const [manifestFile,reviewFile,out]=process.argv.slice(2);
if(!manifestFile||!reviewFile||!out)throw Error('Pass the addition manifest, reviewed mapping and private evidence directory.');
const additions=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const review=JSON.parse(fs.readFileSync(reviewFile,'utf8'));
const sources=JSON.parse(fs.readFileSync(review.sourceFile,'utf8'));
const products=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
const file='seo-system/data/supplier-publication-ledger.json';
const ledger=JSON.parse(fs.readFileSync(file,'utf8'));
const now=new Date().toISOString();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(new Date());
const verify=process.argv.includes('--verify-live');
const records=[];
for(const [pageNumber,mapping] of Object.entries(review.pages)){
 const group=sources.find(g=>g.group===review.group&&g.page===Number(pageNumber));
 if(!group||mapping.length!==group.products.length)throw Error('Reviewed source page mismatch '+pageNumber);
 group.products.forEach((p,i)=>{
  const slug=mapping[i],selected=additions.find(a=>a.sourceId===p.id);
  const product=slug?products.find(q=>q.slug===slug):null;
  if(slug&&!product)throw Error('Unknown consolidation target '+slug);
  if(selected&&selected.slug!==slug)throw Error('Selected product mapping mismatch '+p.id);
  if(!slug&&!review.heldReasons[p.id])throw Error('Missing specific hold reason '+p.id);
  const exact=products.some(q=>q.sourceId===p.id||(q.views||[]).some(v=>v.sourceId===p.id));
  records.push({group:review.group,page:Number(pageNumber),position:i+1,sourceId:p.id,sourceUrl:p.url,sourceGroupUrl:group.url,sourceTitle:p.title,reviewedAt:now,status:selected?'ready-for-publication':slug?'consolidated-existing':'needs-detail-verification',canonicalSlug:slug,dedupGroup:product?.dedupGroup||slug,reason:selected?selected.distinct:!slug?review.heldReasons[p.id]:exact?'Exact source ID or existing reference view is already mapped.':'Visual construction and use reviewed; consolidate this menu, capacity or artwork variant into the mapped structure rather than create a competing URL.'});
 });
}
if(verify){
 const qa=JSON.parse(fs.readFileSync(out+'/live-qa.json','utf8'));
 if(!qa.passed||qa.additions!==additions.length||qa.outgoing!==0)throw Error('Successful live QA without sent messages is required.');
 const commit=process.argv.find(a=>a.startsWith('--commit='))?.slice(9);
 const deployment=process.argv.find(a=>a.startsWith('--deployment='))?.slice(13);
 if(!commit||!deployment)throw Error('Supply the verified production commit and deployment.');
 for(const p of additions){
  const url='https://mxpackpro.com/products/'+p.slug;
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)}),html=await r.text();
  if(r.status!==200||!html.includes(`rel="canonical" href="${url}"`)||/name="robots" content="[^"]*noindex/.test(html))throw Error('Live verification failed '+url);
  const existing=ledger.publications.find(x=>x.slug===p.slug);
  if(existing?.status==='verified-live')continue;
  const publication={slug:p.slug,sourceId:p.sourceId,publishedDate:today,status:'verified-live',commit,deployment,verifiedAt:now,evidence:out+'/live-qa.json'};
  if(existing)Object.assign(existing,publication);else ledger.publications.push(publication);
 }
}
for(const r of records)if(ledger.publications.some(p=>p.sourceId===r.sourceId&&p.status==='verified-live'))r.status='published-verified';
const key=r=>`${r.group}|${r.page}|${r.sourceId}`;
const priorRecords=new Map(ledger.reviews.map(r=>[key(r),r]));
for(const r of records){const previous=priorRecords.get(key(r));if(previous?.status==='published-verified'&&r.status!=='published-verified')throw Error('Do not downgrade an already published review');priorRecords.set(key(r),r);}
ledger.reviews=[...priorRecords.values()];
ledger.cursor={...ledger.cursor,...review.nextCursor,completedGroupReviews:[...new Set([...ledger.cursor.completedGroupReviews,review.group])],heldSources:[...new Set([...ledger.cursor.heldSources,...records.filter(r=>r.status==='needs-detail-verification').map(r=>r.sourceId)])]};
ledger.updatedAt=now;
const count=ledger.publications.filter(p=>p.publishedDate===today&&p.status==='verified-live').length;
if(count>ledger.dailyTarget)throw Error('Daily publication quota exceeded');
ledger.daily[today]={verifiedNewCount:count,remaining:Math.max(0,ledger.dailyTarget-count)};
fs.writeFileSync(file,JSON.stringify(ledger,null,2)+'\n');
fs.writeFileSync(out+'/review-decision.json',JSON.stringify({reviewedAt:now,group:review.group,reviewed:records.length,selected:additions.length,consolidated:records.filter(r=>r.status==='consolidated-existing').length,held:records.filter(r=>r.status==='needs-detail-verification').length,records},null,2));
console.log(JSON.stringify({reviewed:records.length,selected:additions.length,verifiedToday:count,cursor:ledger.cursor.nextGroup}));
