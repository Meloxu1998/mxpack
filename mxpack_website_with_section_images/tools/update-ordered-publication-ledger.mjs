import fs from 'node:fs';
const dir='D:/mxpack-audits/2026-10-23/ordered-products';
const file='seo-system/data/supplier-publication-ledger.json';
const sources=JSON.parse(fs.readFileSync(dir+'/source-groups.json','utf8'));
const additions=JSON.parse(fs.readFileSync('seo-system/data/catalog-expansion-20261023-ordered.json','utf8'));
const earlier=JSON.parse(fs.readFileSync('seo-system/data/catalog-expansion-20261023.json','utf8'));
const existing=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
const prior=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const hot=['printed-donut-pastry-box','printed-donut-pastry-box','custom-printed-corrugated-mailer','custom-printed-corrugated-mailer','printed-donut-pastry-box','custom-sliding-hot-dog-box','custom-mini-burger-sharing-box','window-grazing-box-with-dividers','custom-pyramid-catering-box','custom-pyramid-catering-box',null,'custom-pyramid-catering-box'];
const grazing1=['double-door-catering-box','catering-tray-with-cup-slots','window-grazing-box-with-dividers','window-grazing-box-with-dividers','catering-tray-with-cup-slots','catering-tray-with-cup-slots','window-grazing-box-with-dividers','window-grazing-box-with-dividers','compartment-catering-meal-tray','printed-sushi-meal-box','printed-sushi-meal-box','custom-multi-tray-catering-carrier-box','custom-meal-and-drink-catering-box','handled-catering-tray','custom-mini-burger-sharing-box','catering-tray-with-cup-slots'];
const grazing2=['window-grazing-box-with-dividers','compartment-catering-meal-tray','custom-folding-pastry-carton','custom-upright-sandwich-catering-box','window-grazing-box-with-dividers','custom-upright-sandwich-catering-box','compartment-catering-meal-tray','double-door-catering-box','compartment-catering-meal-tray','custom-folding-pastry-carton','double-door-catering-box','dessert-skewer-display-box','triangular-portion-sharing-box','radial-taco-sharing-platter','radial-taco-sharing-platter','radial-taco-sharing-platter'];
const kit='bbq-grill-kit-packaging-box',meal='bbq-meal-tray-carry-box',lidded='custom-four-tray-bbq-packaging-carton';
const bbqPages={1:Array(16).fill(kit),2:[...Array(8).fill(kit),...Array(8).fill(meal)],3:[null,meal,kit,...Array(7).fill(meal),kit,meal,...Array(4).fill(kit)],4:[...Array(15).fill(kit),meal],5:[...Array(4).fill(meal),...Array(12).fill(lidded)],6:[lidded,lidded]};
const records=[];
for(const group of sources){
 const page=group.page||1;
 const mapping=group.group==='HOT SELLING'?hot:group.group==='Grazing box'?(page===1?grazing1:grazing2):group.group==='BBQ box'?bbqPages[page]:null;
 if(!mapping||mapping.length!==group.products.length)throw Error('Unreviewed group/page '+group.group+' '+page);
 for(let i=0;i<group.products.length;i++){
  const p=group.products[i],slug=mapping[i],selected=additions.find(a=>a.sourceId===p.id);
  if(slug&&!existing.some(q=>q.slug===slug))throw Error('Unknown duplicate mapping '+slug);
  const referenced=existing.some(q=>q.sourceId===p.id||(q.views||[]).some(v=>v.sourceId===p.id));
  records.push({group:group.group,page,position:i+1,sourceId:p.id,sourceUrl:p.url,sourceGroupUrl:group.url,sourceTitle:p.title,reviewedAt:new Date().toISOString(),status:selected?'ready-for-publication':slug?'consolidated-existing':'needs-detail-verification',canonicalSlug:slug,reason:selected?selected.distinct:!slug?'Closed exterior/reference image does not verify the opening or internal construction. Hold rather than invent a separate product.':referenced?'Exact source ID or an existing reference view is already in the catalog.':'Same construction/use family or menu/insert/artwork variation; consolidate into the mapped product rather than create a competing URL.'});
 }
}
const publications=[...(prior.publications||[])];
for(const p of earlier)if(!publications.some(x=>x.slug===p.slug))publications.push({slug:p.slug,sourceId:p.sourceId,publishedDate:'2026-10-23',status:'verified-live',commit:'8c084f35e2c5fb9d4049bb66abdf2946031f74b3',deployment:'93f97d39-86c7-4174-9466-b08d5d590af4',evidence:'D:/mxpack-audits/2026-10-23/product-upload/published-summary.json'});
const verify=process.argv.includes('--verify-live');
if(verify){
 const qa=JSON.parse(fs.readFileSync(dir+'/live-qa.json','utf8'));
 if(!qa.passed||qa.additions!==additions.length||qa.outgoing!==0)throw Error('Need successful live desktop/mobile QA first.');
 const commit=process.argv.find(a=>a.startsWith('--commit='))?.split('=')[1];
 const deployment=process.argv.find(a=>a.startsWith('--deployment='))?.split('=')[1];
 if(!commit||!deployment)throw Error('Supply verified production commit and deployment.');
 for(const p of additions){
  const url='https://mxpackpro.com/products/'+p.slug,r=await fetch(url,{redirect:'manual'}),html=await r.text();
  if(r.status!==200||!html.includes(`rel="canonical" href="${url}"`)||/name="robots" content="[^"]*noindex/.test(html))throw Error('Live URL verification failed '+url);
  if(!publications.some(x=>x.slug===p.slug))publications.push({slug:p.slug,sourceId:p.sourceId,publishedDate:'2026-10-23',status:'verified-live',commit,deployment,verifiedAt:new Date().toISOString(),evidence:dir+'/live-qa.json'});
 }
}
for(const r of records)if(publications.some(p=>p.sourceId===r.sourceId&&p.status==='verified-live'))r.status='published-verified';
const key=r=>`${r.group}|${r.page}|${r.sourceId}`;
const merged=[...new Map([...(prior.reviews||[]),...records].map(r=>[key(r),r])).values()];
const groups=['HOT SELLING','Grazing box','BBQ box','TAKE AWAY FOOD BOX','CAKE BOX','MAILER BOX','MACARON&CHOCOLATE','COSMETIC BOX','PIZZA BOX','WINE BOX','GIFT BOX','SHOES & CLOTHING BOX','BURGER BOX','PAPER BAG','PAPER CUP','CHRISTMAS BOX','BOX'];
const report={...prior,updatedAt:new Date().toISOString(),store:'https://meloxu.en.alibaba.com/',timezone:'Asia/Shanghai',dailyTarget:10,classificationOrder:groups,cursor:{nextGroup:'TAKE AWAY FOOD BOX',page:1,nextPosition:1,completedGroupReviews:['HOT SELLING','Grazing box','BBQ box'],heldSources:records.filter(r=>r.status==='needs-detail-verification').map(r=>r.sourceId),note:'Completed means reviewed and explicitly classified, including held items. Never publish held items automatically.'},daily:{...(prior.daily||{}),'2026-10-23':{verifiedNewCount:publications.filter(p=>p.publishedDate==='2026-10-23'&&p.status==='verified-live').length,remaining:Math.max(0,10-publications.filter(p=>p.publishedDate==='2026-10-23'&&p.status==='verified-live').length)}},publications,reviews:merged};
if(report.daily['2026-10-23'].verifiedNewCount>10)throw Error('Daily target exceeded');
fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({reviewed:records.length,consolidated:records.filter(r=>r.status==='consolidated-existing').length,held:records.filter(r=>r.status==='needs-detail-verification').length,selected:additions.length,daily:report.daily['2026-10-23'],cursor:report.cursor.nextGroup}));
