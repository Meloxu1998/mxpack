const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=process.cwd();
const out='D:/mxpack-audits/2026-10-22/procurement-drafts';
const guides=JSON.parse(fs.readFileSync('seo-system/data/procurement-guides.json','utf8'));
const enhancements=JSON.parse(fs.readFileSync('seo-system/data/catalog-buyer-enhancements.json','utf8'));
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const guide=guides.find(guide=>pathname===`/${guide.slug}`);
 let file=guide?path.join(out,`${guide.slug}.html`):path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
 if(!guide&&!path.extname(file))file+='.html';
 if(!guide&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  await page.route('https://formsubmit.co/**',r=>r.abort());
  for(const guide of guides){
   assert(!fs.existsSync(`${guide.slug}.html`),'Draft must not be published before its schedule');
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});
    const response=await page.goto(`${base}/${guide.slug}`);assert.equal(response.status(),200);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://mxpackpro.com/${guide.slug}`);
    assert.equal(await page.locator('body').getAttribute('data-guide-id'),guide.slug);
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
    await page.evaluate(async()=>{document.querySelectorAll('main img').forEach(img=>img.loading='eager');await Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode()));});
    const structured=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.textContent)));
    assert.equal(structured.find(item=>item['@type']==='Article').headline,guide.title);
    assert.deepEqual(structured.find(item=>item['@type']==='FAQPage').mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),guide.faq);
    assert.equal(await page.locator('.accordion details').count(),guide.faq.length);
    await page.screenshot({path:`${out}/${guide.slug}-${width}.png`,fullPage:true});
    await page.screenshot({path:`${out}/${guide.slug}-${width}-viewport.png`});
    await page.locator('[data-track="quote_guide_click"]').first().click();await page.waitForURL('**/get-a-quote*');
    assert.equal(await page.locator('input[name="Inquiry source"]').inputValue(),`/${guide.slug}`);
    assert.equal(await page.locator('input[name="Product page"]').inputValue(),`https://mxpackpro.com/products/${guide.product}`);
    assert((await page.locator('#message').inputValue()).trim().length>0);
    assert((await page.locator('[data-whatsapp]').first().getAttribute('href')).includes('8615918968149'));
    results.push({slug:guide.slug,width,passed:true,quoteAttribution:true});
   }
  }
  for(const [slug,enhancement] of Object.entries(enhancements)){
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});await page.goto(`${base}/products/${slug}`);
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
    for(const related of enhancement.relatedSlugs)assert(await page.locator(`main a[href="/products/${related}"]`).count());
    const faq=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.textContent)).find(item=>item['@type']==='FAQPage'));
    for(const [q,a] of enhancement.additionalFaq||[]){
     assert(faq.mainEntity.some(item=>item.name===q&&item.acceptedAnswer.text===a));
     assert(await page.getByText(q,{exact:true}).count());
    }
    if(enhancement.additionalFaq)await page.screenshot({path:`${out}/${slug}-${width}.png`});
   }
  }
  assert.deepEqual(errors,[]);
  const schedule=JSON.parse(execFileSync(process.execPath,['tools/build-procurement-guides.mjs','--check-schedule'],{encoding:'utf8'}));
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  for(const item of schedule)assert.equal(item.canPublish,today>=item.plannedPublishOn);
  fs.writeFileSync(`${out}/qa.json`,JSON.stringify({checkedAt:new Date().toISOString(),passed:true,results,enhancedProducts:Object.keys(enhancements).length,scheduledPublicationGuard:true,noMessagesSent:true},null,2));
  console.log('PASS: 2 draft guides x 2 widths, FAQ schema, source/product quote attribution, 8 enhanced product pages and future publication guard. No messages sent.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
