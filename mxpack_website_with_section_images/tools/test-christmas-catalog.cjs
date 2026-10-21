const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const catalog=require('../seo-system/data/catalog-products.json');
const additions=require('../seo-system/data/christmas-products-20261021.json');
const selection=require('../seo-system/data/christmas-collection.json');
const base=process.env.QA_BASE||'http://127.0.0.1:4197';
const output='D:/mxpack-audits/2026-10-21/christmas-catalog';
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const old=JSON.parse(execFileSync('git',['show','522cf11:mxpack_website_with_section_images/seo-system/data/catalog-products.json'],{cwd:root,encoding:'utf8'}));
 assert.equal(old.length,51);assert.equal(catalog.length,53);assert.equal(additions.length,2);
 for(const p of old)assert.deepEqual(catalog.find(q=>q.slug===p.slug),p,'Existing product changed '+p.slug);
 assert.equal(new Set(catalog.map(p=>p.keyword.toLowerCase())).size,53);
 assert.equal(new Set(catalog.map(p=>p.slug)).size,53);
 const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];
 try{
  for(const width of [1440,768,390,360]){
   const mobile=width<500;
   const context=await browser.newContext({viewport:{width,height:960},isMobile:mobile,hasTouch:mobile,userAgent:mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1':undefined});
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',r=>r.abort());
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const assertLayout=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow '+width+' '+page.url());
   await page.goto(base+'/christmas-packaging');await assertLayout();
   assert.equal(await page.locator('h1').innerText(),'Christmas Packaging');
   assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://mxpackpro.com/christmas-packaging');
   assert.equal(await page.locator('.catalog-card').count(),selection.products.length);
   const schemas=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent)));
   assert.equal(schemas.find(s=>s['@type']==='CollectionPage').mainEntity.numberOfItems,selection.products.length);
   const faq=schemas.find(s=>s['@type']==='FAQPage').mainEntity;
   for(let i=0;i<faq.length;i++){
    assert.equal(await page.locator('.accordion summary').nth(i).innerText(),faq[i].name);
    if(!await page.locator('.accordion details p').nth(i).isVisible())await page.locator('.accordion summary').nth(i).click();
    assert.equal(await page.locator('.accordion details p').nth(i).innerText(),faq[i].acceptedAnswer.text);
   }
   await page.waitForFunction(()=>[...document.querySelectorAll('.catalog-card img')].slice(0,3).every(img=>img.complete&&img.naturalWidth>0));
   if([1440,390].includes(width)){
    if(await page.locator('[data-contact-prompt-close]').isVisible()){
      await page.locator('[data-contact-prompt-close]').click();
      await page.locator('[data-contact-prompt]').waitFor({state:'hidden'});
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:path.join(output,`christmas-collection-${width}.png`),fullPage:false});
   }
   for(const group of Object.keys(selection.groups)){
    await page.locator(`[data-catalog-filter="${group}"]`).click();
    assert.equal(await page.locator('.catalog-card:not([hidden])').count(),selection.products.filter(p=>p.group===group).length);
   }
   await page.locator('[data-catalog-filter="all"]').click();
   await page.locator('[data-catalog-search-input]').fill('ornament');
   await page.waitForFunction(()=>document.querySelector('[data-catalog-result-count]').textContent==='1 product');
   await page.locator('.catalog-card:not([hidden]) a[data-track="quote_christmas_click"]').click();await page.waitForURL('**/get-a-quote*');
   assert.equal(await page.locator('input[name="Product"]').inputValue(),'Ornament Gift Box with Paper Insert');
   assert((await page.locator('input[name="Seasonal project"]').inputValue()).includes('Christmas'));
   assert((await page.locator('#message').inputValue()).includes('Required arrival date'));
   assert((await page.locator('input[name="Inquiry source"]').inputValue()).includes('/christmas-packaging'));
   assert(await page.locator('#phone').getAttribute('required')!==null);
   await page.goto(base+'/christmas-packaging');
   await page.locator('.christmas-order-note a').click();await page.waitForURL('**/get-a-quote*');
   assert((await page.locator('#message').inputValue()).startsWith('Christmas packaging project.'));
   for(const p of additions){
    assert.equal((await page.goto(`${base}/products/${p.slug}`)).status(),200);await assertLayout();
    assert.equal(await page.locator('h1').innerText(),p.name);
    await page.waitForFunction(()=>document.querySelector('.detail-hero-media img').naturalWidth>0);
    const s=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent)));
    assert.equal(s.find(n=>n['@type']==='FAQPage').mainEntity.length,4+p.additionalFaq.length);
    assert.equal(await page.locator('.accordion details').count(),4+p.additionalFaq.length);
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://mxpackpro.com/products/${p.slug}`);
    const wa=new URL(await page.locator('.floating-contact [data-whatsapp]').getAttribute('href'));
    assert.equal(wa.protocol,mobile?'whatsapp:':'https:');assert.equal(wa.searchParams.get('phone'),'8615918968149');assert(wa.searchParams.get('text').includes(p.name));
    assert.equal(await page.locator('.floating-contact a[href^="mailto:sales@mxpackpro.com"]').count(),1);
    assert((await page.locator('main').innerText()).includes('Design visualization'));
    if([1440,390].includes(width))await page.screenshot({path:path.join(output,`${p.slug}-${width}.png`),fullPage:false});
    await page.locator('main a[href*="get-a-quote?product="]').first().click();await page.waitForURL('**/get-a-quote*');
    assert((await page.locator('#message').inputValue()).includes(p.name));
   }
   await page.goto(base+'/products');assert.equal(await page.locator('.catalog-card').count(),catalog.length);
   if(width<=1060){await page.locator('[data-menu-toggle]').click();await page.locator('.mobile-menu details summary').first().click();await page.locator('.mobile-menu a[href="/products?category=christmas-boxes"]').click();}
   else{await page.locator('[aria-controls="nav-products"]').hover();await page.locator('.nav-links a[href="/products?category=christmas-boxes"]').click();}
   await page.waitForURL('**/products?category=christmas-boxes');await page.locator('.taxonomy-seasonal').click();
   await page.waitForURL('**/christmas-packaging');assert.equal(await page.locator('.catalog-card').count(),selection.products.length);
   await context.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 fs.writeFileSync(path.join(output,base.startsWith('https:')?'live-verification.json':'local-verification.json'),JSON.stringify({base,preservedProducts:51,newProducts:additions.length,totalProducts:catalog.length,collectionProducts:selection.products.length,widths:[1440,768,390,360],messagesSent:false,indexingSubmitted:false,pageErrors:errors,result:'PASS'},null,2));
 console.log(`PASS: 51 original records preserved, ${additions.length} seasonal additions, ${selection.products.length} Christmas formats, 4 widths, images, filters, FAQs and inquiry context. No messages sent.`);
})().catch(e=>{console.error(e);process.exit(1)});
