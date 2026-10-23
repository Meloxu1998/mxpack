const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.cwd(),out='D:/mxpack-audits/2026-10-23/product-upload';
const additions=JSON.parse(fs.readFileSync('seo-system/data/catalog-expansion-20261023.json'));
const products=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json'));
const sources=JSON.parse(fs.readFileSync('seo-system/data/catalog-provenance.json')).products;
assert.equal(new Set(products.map(p=>p.slug)).size,products.length);assert.equal(new Set(products.map(p=>p.sourceId)).size,products.length);
const old=products.filter(p=>!additions.some(a=>a.slug===p.slug));assert.equal(old.length,53);
for(const p of additions){assert(!old.some(q=>q.sourceId===p.sourceId||q.dedupGroup===p.dedupGroup));assert.equal(sources.find(s=>s.id===p.sourceId).minimumOrder,250);}
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({channel:'chrome',headless:true});
 let outgoing=0;const results=[];
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',r=>{outgoing++;return r.abort()});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/products',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.catalog-card').count(),57);
   for(const group of ['cosmetic-boxes','wine-boxes','paper-bags','mailer-boxes']){
    if(width===390)await page.locator('[data-catalog-select]').selectOption(group);
    else await page.locator(`[data-catalog-filter="${group}"]`).click();
    const expected=additions.filter(p=>group==='cosmetic-boxes'?p.category==='cosmetics':group==='wine-boxes'?p.category==='beverage-packaging':group==='paper-bags'?p.category==='bags':p.slug==='custom-tear-open-corrugated-mailer');
    for(const p of expected)assert(await page.locator(`.catalog-card[data-product-id="${p.slug}"]`).isVisible());
   }
   for(const p of additions){
    const r=await page.goto(base+'/products/'+p.slug,{waitUntil:'networkidle'});assert.equal(r.status(),200);
    const content=await page.evaluate(()=>({h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),canonical:document.querySelector('link[rel="canonical"]').href,overflow:document.documentElement.scrollWidth>innerWidth+1,img:document.querySelector('.detail-hero img').naturalWidth,faq:[...document.querySelectorAll('.accordion details')].map(e=>({name:e.querySelector('summary').textContent,text:e.querySelector('p').textContent})),schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)).find(s=>s['@type']==='FAQPage')}));
    assert.deepEqual(content.h1,[p.name]);assert.equal(content.canonical,'https://mxpackpro.com/products/'+p.slug);assert(!content.overflow);assert(content.img>0);
    assert.deepEqual(content.faq,content.schema.mainEntity.map(e=>({name:e.name,text:e.acceptedAnswer.text})));
    await page.screenshot({path:path.join(out,`${process.env.QA_BASE?'live':'local'}-${p.slug}-${width}.png`)});
    await page.locator(width===390?'.mobile-contact-email':'.floating-contact .mail').click();
    const form=page.locator('.email-inquiry-dialog[open] form');await form.waitFor({state:'visible'});
    assert.equal(await form.locator('[name="Product"]').inputValue(),p.name);
    assert.equal(await form.locator('[name="Product page"]').inputValue(),'https://mxpackpro.com/products/'+p.slug);
    const wa=await page.locator('.email-inquiry-dialog[open] [data-whatsapp]').getAttribute('href');assert(wa.includes('8615918968149'));
    await page.keyboard.press('Escape');
    await page.locator('.detail-hero a[data-track="quote_product_click"]').click();
    await page.locator('#quote-form [name="Product"]').waitFor({state:'attached'});
    assert.equal(await page.locator('#quote-form [name="Product"]').inputValue(),p.name);
    assert.equal(await page.locator('#quote-form [name="Inquiry source"]').inputValue(),'/products/'+p.slug);
    assert.equal(await page.locator('#quote-form').getAttribute('action'),'https://formsubmit.co/sales@mxpackpro.com');
    results.push({width,slug:p.slug,canonical:true,image:true,faqSchema:true,quoteAttribution:true});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  assert.equal(outgoing,0);fs.writeFileSync(path.join(out,`${process.env.QA_BASE?'live':'local'}-qa.json`),JSON.stringify({passed:true,products:57,additions:4,results,outgoing},null,2));
  console.log('PASS: 4 distinct additions, 57 unique products, 4 category filters, 8 desktop/mobile product and inquiry flows; 0 messages sent.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
