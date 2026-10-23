const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.cwd(),out='D:/mxpack-audits/2026-10-23/custom-service';
const server=http.createServer((req,res)=>{
 let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.extname(f))f+='.html';
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404).end();return;}
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync(out,{recursive:true});let sent=0;const results=[];
 try{
  for(const width of [1920,1440,1024,768,390,360]){
   const c=await browser.newContext({viewport:{width,height:width<=600?844:1000},isMobile:width<=600,hasTouch:width<=600});
   await c.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await c.route('https://formsubmit.co/**',r=>{sent++;return r.abort()});
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   const response=await p.goto(base+'/custom-packaging',{waitUntil:'networkidle'});assert.equal(response.status(),200);
   assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('h1').innerText(),'Custom packaging.');
   assert.equal(await p.locator('link[rel="canonical"]').getAttribute('href'),'https://mxpackpro.com/custom-packaging');
   await p.locator('.service-hero img').evaluate(i=>i.decode());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const jump=await p.locator('.service-jump').boundingBox();assert(jump.y<(width<=600?844:1000));
   await p.screenshot({path:`${out}/${process.env.QA_BASE?'live':'local'}-hero-${width}.png`});
   if(width>=1101){
    await p.locator('[aria-controls="nav-products"]').hover();
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('#nav-products')).opacity==='1');
    assert.equal(await p.locator('#nav-products').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
    const menuBox=await p.locator('#nav-products').boundingBox();
    assert(await p.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('#nav-products'),{x:menuBox.x+30,y:menuBox.y+30}));
    await p.locator('[aria-controls="nav-products"]').focus();
    await p.locator('.site-header a[href="/custom-packaging"]').first().hover();
    await p.waitForFunction(()=>getComputedStyle(document.querySelector('#nav-products')).visibility==='hidden');
   }
   for(const anchor of ['capabilities','approval-process','printing','samples'])assert.equal(await p.locator('#'+anchor).count(),1);
   await p.locator('.service-jump a[href="#samples"]').click();
   const questions=p.locator('.service-faq details');assert.equal(await questions.count(),5);
   const schemas=(await p.locator('script[type="application/ld+json"]').allTextContents()).flatMap(s=>{const j=JSON.parse(s);return j['@graph']||[j]});
   const faq=schemas.find(s=>s['@type']==='FAQPage');assert.equal(faq.mainEntity.length,5);
   for(let i=0;i<5;i++){
    await questions.nth(i).locator('summary').click();
    const text=await questions.nth(i).locator('p').innerText();assert.equal(text,faq.mainEntity[i].acceptedAnswer.text);
   }
   await p.locator('.service-capabilities').scrollIntoViewIfNeeded();
   for(const img of await p.locator('.service-capabilities img').all())await img.evaluate(i=>i.decode());
   if([1440,390].includes(width))await p.locator('#capabilities').screenshot({path:`${out}/${process.env.QA_BASE?'live':'local'}-capabilities-${width}.png`});
   await p.locator('.service-hero a[href="#quote-form"]').click();
   const f=p.locator('#custom-quote-form');await f.scrollIntoViewIfNeeded();
   assert.equal(await f.getAttribute('action'),'https://formsubmit.co/sales@mxpackpro.com');
   assert.equal(await f.locator('[name="Inquiry source"]').inputValue(),'/custom-packaging');
   assert(await p.locator('.contact-methods a[data-whatsapp]').isVisible());
   assert(await p.locator('.contact-methods a[href^="mailto:"]').isVisible());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
   results.push({width,status:200,nextSectionY:jump.y,faq:5,formPreserved:true});await c.close();
  }
  assert.equal(sent,0);fs.writeFileSync(`${out}/${process.env.QA_BASE?'live':'local'}-verification.json`,JSON.stringify({passed:true,results,formSubmissions:sent},null,2));
  console.log(`PASS: ${results.length} widths; navigation layering, hero, images, FAQ/schema, anchors, native inquiry source and contacts; 0 submissions.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
