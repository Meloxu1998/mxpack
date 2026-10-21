const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const additions=require('../seo-system/data/gift-catalog-20261021.json');
const catalog=require('../seo-system/data/catalog-products.json');
const provenance=require('../seo-system/data/catalog-provenance.json').products;
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
const output='D:/mxpack-audits/2026-10-21/gift-catalog';
(async()=>{
 const baseline=JSON.parse(execFileSync('git',['show','823e0ae:mxpack_website_with_section_images/seo-system/data/catalog-products.json'],{cwd:root,encoding:'utf8'}));
 assert.equal(baseline.length,41);assert.equal(catalog.length,51);assert.equal(additions.length,10);
 for(const old of baseline)assert.deepEqual(catalog.find(p=>p.slug===old.slug),old,'Existing record changed '+old.slug);
 assert.equal(new Set(catalog.map(p=>p.keyword)).size,51);
 assert.equal(new Set(catalog.map(p=>p.slug)).size,51);
 for(const p of additions){
  const s=provenance.find(s=>s.id===p.sourceId);assert.equal(s.minimumOrder,null);assert.equal(s.kind,'design-concept');
  assert(fs.statSync(path.join(root,s.imagePath)).size<180000,'Unoptimized image '+p.slug);
 }
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const pageErrors=[];
 try{
  for(const width of [1440,768,390,360]){
   const mobile=width<500;
   const context=await browser.newContext({viewport:{width,height:960},isMobile:mobile,hasTouch:mobile,userAgent:mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1':undefined});
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',r=>r.abort());
   const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(e.message));
   for(const p of additions){
    const response=await page.goto(`${base}/products/${p.slug}`);assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.querySelector('.detail-hero-media img')?.naturalWidth>0);
    assert.equal(await page.locator('h1').innerText(),p.name);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Overflow '+p.slug+' '+width);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://mxpackpro.com/products/${p.slug}`);
    const schemas=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent)));
    const faq=schemas.find(s=>s['@type']==='FAQPage');assert.equal(faq.mainEntity.length,4);
    assert.equal(await page.locator('.accordion details').count(),4);
    for(let i=0;i<4;i++)assert.equal(await page.locator('.accordion details summary').nth(i).innerText(),faq.mainEntity[i].name);
    assert((await page.locator('main').innerText()).includes('Design visualization'));
    assert(!/null pieces|From 0 pieces|LuxoPack|FSC.certified|3.5 [Dd]ays/.test(await page.locator('main').innerText()));
    const wa=await page.locator('.floating-contact [data-whatsapp]').getAttribute('href');
    assert(wa.startsWith(mobile?'whatsapp://send?':'https://web.whatsapp.com/send/'));
    assert.equal(new URL(wa).searchParams.get('phone'),'8615918968149');assert(new URL(wa).searchParams.get('text').includes(p.name));
    assert.equal(await page.locator('.floating-contact a[href^="mailto:sales@mxpackpro.com"]').count(),1);
    if([1440,390].includes(width)&&[additions[0].slug,additions[4].slug].includes(p.slug))await page.screenshot({path:path.join(output,`${p.slug}-${width}.png`),fullPage:false});
    await page.locator('main a[href*="get-a-quote?product="]').first().click();await page.waitForURL('**/get-a-quote*');
    assert((await page.locator('#message').inputValue()).includes(p.name));
    assert.equal(await page.locator('input[name="Product"]').inputValue(),p.name);
    assert(await page.locator('#phone').getAttribute('required')!==null);
   }
   await page.goto(base+'/products?category=gifts');
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),10);
   assert.equal(await page.locator('header a[href="/products?category=gifts"]').count(),2);
   if(width<=1060){
    await page.locator('[data-menu-toggle]').click();
    await page.locator('.mobile-menu details').first().locator('summary').click();
    await page.locator('.mobile-menu a[href="/products?category=gifts"]').click();
   }else{
    await page.locator('[aria-controls="nav-products"]').hover();
    await page.locator('.nav-links a[href="/products?category=gifts"]').click();
   }
   await page.waitForURL('**/products?category=gifts');
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),10);
   await page.locator('[data-catalog-sort]').selectOption('moq');
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),10);
   await page.locator('[data-catalog-filter="all"]').click();
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),51);
   const order=await page.locator('.catalog-grid .catalog-card').evaluateAll(cards=>cards.map(c=>c.dataset.productMoq));
   assert(order.slice(0,41).every(n=>Number(n)>0));assert(order.slice(41).every(n=>!n));
   await page.locator('[data-catalog-filter="gifts"]').click();
   await page.locator('.catalog-filters').scrollIntoViewIfNeeded();
   if([1440,390].includes(width))await page.screenshot({path:path.join(output,`gift-filter-${width}.png`),fullPage:false});
   await page.locator('[data-catalog-search-input]').fill('shoulder');
   await page.waitForFunction(()=>document.querySelector('[data-catalog-result-count]').textContent==='1 product');
   assert.equal(await page.locator('.catalog-card:not([hidden]) h2').innerText(),'Shoulder-and-Neck Rigid Gift Box');
   await context.close();
  }
  assert.deepEqual(pageErrors,[]);
 }finally{await browser.close();}
 fs.writeFileSync(path.join(output,base.startsWith('https:')?'live-verification.json':'local-verification.json'),JSON.stringify({base,totalProducts:51,newGiftFormats:10,unchangedExistingRecords:41,viewportWidths:[1440,768,390,360],pageErrors,messagesSent:false,indexingSubmitted:false,results:'PASS'},null,2));
 console.log('PASS: 10 gift formats, 41 preserved records, 4 widths, images, FAQs, canonical URLs, gift filter/search, unknown-MOQ sorting and product-context quote/WhatsApp links. No messages sent.');
})().catch(e=>{console.error(e);process.exit(1)});
