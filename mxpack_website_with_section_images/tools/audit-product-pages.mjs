import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const products=JSON.parse(fs.readFileSync(new URL('seo-system/data/catalog-products.json',root),'utf8'));
const base='https://mxpackpro.com';
const sitemap=await(await fetch(`${base}/sitemap.xml`)).text();
const catalog=await(await fetch(`${base}/products`)).text();
const rows=[];let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
 while(cursor<products.length){
  const product=products[cursor++];const url=`${base}/products/${product.slug}`;
  try{
   const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
   const html=await response.text();
   const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
   const robots=html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/)?.[1]||'';
   const row={slug:product.slug,status:response.status,canonical,robots,xRobots:response.headers.get('x-robots-tag'),h1:(html.match(/<h1(?:\s|>)/g)||[]).length,inSitemap:sitemap.includes(`<loc>${url}</loc>`),inCatalog:catalog.includes(`href="/products/${product.slug}"`)};
   row.passed=row.status===200&&canonical===url&&!/noindex/i.test(robots+' '+row.xRobots)&&row.h1===1&&row.inSitemap&&row.inCatalog;
   rows.push(row);
  }catch(error){rows.push({slug:product.slug,passed:false,error:String(error)})}
 }
}));
rows.sort((a,b)=>a.slug.localeCompare(b.slug));
const report={checkedAt:new Date().toISOString(),checked:rows.length,passed:rows.filter(row=>row.passed).length,rows};
const output=process.argv.find(arg=>arg.startsWith('--output='))?.slice('--output='.length);
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({checked:report.checked,passed:report.passed,failures:rows.filter(row=>!row.passed)},null,2));
if(report.passed!==report.checked)process.exitCode=1;
