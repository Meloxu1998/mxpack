const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=process.cwd();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const output=process.env.QA_OUTPUT||`D:/mxpack-audits/${today}/guide-release`;
const all=JSON.parse(fs.readFileSync('seo-system/data/procurement-guides.json','utf8'));
const guides=all.filter(guide=>fs.existsSync(`${guide.slug}.html`));
assert(guides.length,'No published guide source to test');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];let formPosts=0;
 fs.mkdirSync(output,{recursive:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}:{viewport:{width:1440,height:1000}});
   await context.route(/googletagmanager\.com|google-analytics\.com/,route=>route.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',route=>{formPosts++;return route.abort()});
   const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   for(const guide of guides){
    await page.goto(`${base}/resources`);
    await page.locator(`.article-grid a[href="/${guide.slug}"]`).click();
    await page.waitForURL(`**/${guide.slug}`);
    assert.equal((await page.request.get(page.url())).status(),200);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('h1').innerText(),guide.title);
    assert.equal(await page.title(),guide.seoTitle||`${guide.title} | MXPACKPRO`);
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),guide.description);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://mxpackpro.com/${guide.slug}`);
    assert(!/noindex/.test(await page.locator('meta[name="robots"]').getAttribute('content')));
    const structured=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.textContent)));
    const article=structured.find(item=>item['@type']==='Article');
    assert.equal(article.headline,guide.title);
    assert.equal(article.datePublished,await page.locator('article time').getAttribute('datetime'));
    assert.equal(article.mainEntityOfPage,`https://mxpackpro.com/${guide.slug}`);
    assert.deepEqual(structured.find(item=>item['@type']==='FAQPage').mainEntity.map(q=>[q.name,q.acceptedAnswer.text]),guide.faq);
    assert.equal(await page.locator('.accordion details').count(),guide.faq.length);
    await page.evaluate(async()=>{document.querySelectorAll('main img').forEach(img=>img.loading='eager');await Promise.all([...document.querySelectorAll('main img')].map(img=>img.decode()))});
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
    for(const table of await page.locator('.buyer-table-wrap').all()){
     const reachable=await table.evaluate(element=>{
      const max=element.scrollWidth-element.clientWidth;
      element.scrollLeft=max;
      const endReached=max<=1||element.scrollLeft>=max-1;
      element.scrollLeft=0;
      return endReached;
     });
     assert(reachable,'Comparison table must scroll to its final column');
    }
    const wa=await page.locator('[data-whatsapp]').first().getAttribute('href');
    assert(wa.startsWith(mobile?'whatsapp://':'https://web.whatsapp.com/'));
    assert(wa.includes('8615918968149'));
    assert(new URL(wa).searchParams.get('text').includes(`https://mxpackpro.com/${guide.slug}`));
    assert(await page.locator('a[href="mailto:sales@mxpackpro.com"]').count());
    await page.screenshot({path:`${output}/${guide.slug}-${mobile?'mobile':'desktop'}.png`});
    await page.locator('.buyer-table-wrap').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/${guide.slug}-table-${mobile?'mobile':'desktop'}.png`});
    await page.locator('.accordion details').first().locator('summary').click();
    await page.locator('.accordion').scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/${guide.slug}-faq-${mobile?'mobile':'desktop'}.png`});
    await page.locator('[data-track="quote_guide_click"]').first().click();await page.waitForURL('**/get-a-quote*');
    assert.equal(await page.locator('input[name="Inquiry source"]').inputValue(),`/${guide.slug}`);
    assert.equal(await page.locator('input[name="Product page"]').inputValue(),`https://mxpackpro.com/products/${guide.product}`);
    assert((await page.locator('#message').inputValue()).trim().length>0);
    assert.equal(await page.locator('[data-quote-form]').getAttribute('action'),'https://formsubmit.co/sales@mxpackpro.com');
    for(const slug of guide.related){
     await page.goto(`${base}/products/${slug}`);
     assert(await page.locator(`main a[href="/${guide.slug}"]`).count());
    }
    for(const slug of guide.hubs||[]){
     await page.goto(`${base}/${slug}`);
     assert(await page.locator(`main a[href="/${guide.slug}"]`).count());
    }
    const sitemap=await(await page.request.get(`${base}/sitemap.xml`)).text();
    assert(sitemap.includes(`<loc>https://mxpackpro.com/${guide.slug}</loc>`));
    results.push({slug:guide.slug,mobile,passed:true,publishedOn:article.datePublished,quoteSourceVerified:true,whatsappContextVerified:true,backlinksVerified:true});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  assert.equal(formPosts,0);
  fs.writeFileSync(`${output}/${process.env.QA_BASE?'live':'local'}-qa.json`,JSON.stringify({checkedAt:new Date().toISOString(),base,passed:true,results,formPosts},null,2));
  console.log(`PASS: ${guides.length} published guide(s), desktop + Android; dates/schema/FAQ/images/quote attribution/WhatsApp/backlinks; 0 form submissions.`);
 }finally{await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
