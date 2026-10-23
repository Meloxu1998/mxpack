import fs from 'node:fs';
const output='D:/mxpack-audits/2026-10-23/redirect-root-cause';
fs.mkdirSync(output,{recursive:true});
const observed=[
 'http://www.mxpackpro.com/','https://mxpackpro.com/index.html','https://www.mxpackpro.com/','http://mxpackpro.com/',
 'https://mxpackpro.com/custom-food-packaging','https://mxpackpro.com/box-styles-structures.html','https://mxpackpro.com/printing-finishes'
];
async function trace(start){
 let url=start;const chain=[];const visited=new Set();
 try{
  for(let n=0;n<10;n++){
   const requestUrl=new URL(url);requestUrl.hash='';
   if(visited.has(requestUrl.href))return {start,chain,error:'redirect loop'};
   visited.add(requestUrl.href);
   if(!['mxpackpro.com','www.mxpackpro.com'].includes(requestUrl.hostname))return {start,chain,error:'unexpected external destination'};
   const response=await fetch(requestUrl,{redirect:'manual',signal:AbortSignal.timeout(25000)});
   const location=response.headers.get('location');
   chain.push({url:requestUrl.href,status:response.status,location,cache:response.headers.get('cf-cache-status'),robotsHeader:response.headers.get('x-robots-tag')});
   if(response.status>=300&&response.status<400&&location){await response.body?.cancel();url=new URL(location,requestUrl).href;continue;}
   const body=await response.text();
   return {start,chain,final:requestUrl.href,status:response.status,canonical:body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]||null,noindex:/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(body)||/noindex/i.test(response.headers.get('x-robots-tag')||''),h1:(body.match(/<h1\b/g)||[]).length,challenge:/cf-chl-|Just a moment\.\.\./.test(body)};
  }
  return {start,chain,error:'too many redirects'};
 }catch(e){return {start,chain,error:e.message,cause:e.cause?.code||e.cause?.message};}
}
const xml=await(await fetch('https://mxpackpro.com/sitemap.xml')).text();
const sitemap=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const urls=[...new Set([...observed,...sitemap])],results=[];let cursor=0;
await Promise.all(Array.from({length:4},async()=>{while(cursor<urls.length)results.push(await trace(urls[cursor++]));}));
const gsc=results.filter(r=>observed.includes(r.start));
const pages=results.filter(r=>sitemap.includes(r.start));
const invalid=pages.filter(r=>r.error||r.status!==200||r.chain.length!==1||r.canonical!==r.start||r.noindex||r.h1!==1||r.challenge);
const redirects=new Map(fs.readFileSync('_redirects','utf8').split(/\r?\n/).filter(Boolean).map(line=>line.split(/\s+/)).map(([from,to])=>[from,to]));
const files=[...fs.readdirSync('.').filter(f=>f.endsWith('.html')),...fs.readdirSync('products').filter(f=>f.endsWith('.html')).map(f=>'products/'+f)];
const redirectLinks=[];
const productIds=new Set(JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8')).map(p=>p.slug));
const invalidQuoteProducts=[];
for(const file of files){
 const body=fs.readFileSync(file,'utf8'),page=new URL(file==='index.html'?'/':'/'+file.replace(/\.html$/,''),'https://mxpackpro.com');
 for(const match of body.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)){
  let url;try{url=new URL(match[1].replaceAll('&amp;','&'),page);}catch{continue;}
  if(!['mxpackpro.com','www.mxpackpro.com'].includes(url.hostname))continue;
  const product=url.searchParams.get('product');
  if(url.pathname==='/get-a-quote'&&product&&!productIds.has(product))invalidQuoteProducts.push({file,href:match[1],product});
  if(url.protocol==='http:'||url.hostname==='www.mxpackpro.com'||url.pathname==='/index.html'||redirects.has(url.pathname))redirectLinks.push({file,href:match[1],target:redirects.get(url.pathname)||'https://mxpackpro.com/'});
 }
}
const report={at:new Date().toISOString(),gscReportUpdated:'2026-10-16',gscRedirectExamples:gsc,sitemap:{count:sitemap.length,valid:pages.length-invalid.length,invalid},internalRedirectLinks:redirectLinks,invalidQuoteProducts,results};
fs.writeFileSync(output+'/http-redirect-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({gscRedirectExamples:gsc,sitemap:report.sitemap,internalRedirectLinks:redirectLinks,invalidQuoteProducts},null,2));
if(invalid.length)process.exitCode=1;
