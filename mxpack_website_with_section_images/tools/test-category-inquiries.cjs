const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=process.cwd(),out=process.env.QA_OUTPUT||'D:/mxpack-audits/2026-10-23/redirect-root-cause';
const state=require('../assets/js/url-state.js');
const families={'bakery-cake-boxes':'Bakery & cake packaging','burger-boxes':'Burger boxes','custom-paper-bags':'Custom paper bags','paper-cups':'Paper cups','pizza-boxes':'Custom pizza boxes','takeaway-food-boxes':'Takeaway food boxes'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];let outbound=0;fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',r=>{outbound++;return r.abort()});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const [slug,label] of Object.entries(families)){
    await page.goto(base+'/'+slug,{waitUntil:'networkidle'});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(slug==='pizza-boxes'){
     const qa=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,faq:[...document.querySelectorAll('.accordion details')].map(e=>({q:e.querySelector('summary').textContent.trim(),a:e.querySelector('p').textContent.trim()})),schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)).find(e=>e['@type']==='FAQPage'),table:document.querySelector('[data-pizza-buying-hub] tbody').rows.length}));
     assert.equal(qa.h1,1);assert.equal(qa.table,5);assert.equal(qa.faq.length,5);
     assert.deepEqual(qa.faq,qa.schema.mainEntity.map(e=>({q:e.name,a:e.acceptedAnswer.text})));
     await page.screenshot({path:path.join(out,`${process.env.QA_BASE?'live':'local'}-pizza-${width}.png`),fullPage:true});
    }
    const trigger=page.locator(width===390?'.mobile-contact-email':'.floating-contact .mail');
    await trigger.click();const modal=page.locator('.email-inquiry-dialog[open] form');
    await modal.waitFor({state:'visible'});
    assert.equal(await modal.locator('[name="Packaging category"]').inputValue(),label);
    assert.equal(await modal.locator('[name="Category page"]').inputValue(),'https://mxpackpro.com/'+slug);
    assert.equal(await modal.locator('[name="Inquiry source"]').inputValue(),'/'+slug);
    await page.keyboard.press('Escape');
    await page.locator('.detail-hero a[href*="get-a-quote"][href*="category="]').click();
    assert.equal(state.read(page.url()).get('category'),slug);
    const form=page.locator('#quote-form');
    await form.locator('[name="Packaging category"]').waitFor({state:'attached'});
    assert.equal(await form.locator('[name="Packaging category"]').inputValue(),label);
    assert.equal(await form.locator('[name="Inquiry source"]').inputValue(),'/'+slug);
    assert.equal(await form.locator('[name="Product"]').count(),0);
    assert((await form.locator('[name="Message"]').inputValue()).includes(label));
    assert((await form.locator('[name="_subject"]').inputValue()).includes(label));
    assert.equal(await form.getAttribute('action'),'https://formsubmit.co/sales@mxpackpro.com');
    results.push({width,slug,categoryPrefill:true,sourcePreserved:true});
   }
   await page.goto(base+'/get-a-quote?product=pizza-boxes',{waitUntil:'networkidle'});
   assert.equal(await page.locator('#quote-form [name="Packaging category"]').inputValue(),'Custom pizza boxes');
   await page.goto(base+'/get-a-quote?product=custom-corrugated-pizza-box',{waitUntil:'networkidle'});
   assert.equal(await page.locator('#quote-form [name="Product page"]').inputValue(),'https://mxpackpro.com/products/custom-corrugated-pizza-box');
   assert.deepEqual(errors,[]);await context.close();
  }
  assert.equal(outbound,0);
  fs.writeFileSync(path.join(out,`${process.env.QA_BASE?'live':'local'}-category-qa.json`),JSON.stringify({passed:true,results,outbound},null,2));
  console.log('PASS: 12 category CTA/modal flows, legacy links, real product prefill, pizza FAQ/schema and responsive layout; no form transmission.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
