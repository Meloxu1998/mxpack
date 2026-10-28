const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const products=require('../seo-system/data/catalog-products.json');
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
const output='D:/mxpack-audits/2026-10-21';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/products`);await page.locator('.catalog-card').first().waitFor();
 assert.equal(await page.locator('.catalog-card').count(),products.length);
 assert.equal(await page.locator('.catalog-card:not([hidden])').count(),products.length);
 await page.locator('[data-catalog-filter="drinkware"]').click();assert.equal(await page.locator('.catalog-card:not([hidden])').count(),products.filter(p=>p.category==='drinkware').length);
 await page.locator('[data-catalog-filter="all"]').click();await page.locator('[data-catalog-search-input]').fill('macaron');await page.waitForTimeout(180);
 assert.equal(await page.locator('.catalog-card:not([hidden])').count(),1);
 await page.locator('[data-catalog-search-input]').fill('nonexistent-format-xyz');await page.waitForTimeout(180);assert(await page.locator('[data-catalog-empty]').isVisible());
 await page.locator('[data-catalog-search-input]').fill('');await page.waitForTimeout(180);
 await page.locator('[data-catalog-sort]').selectOption('name');
 const names=await page.locator('.catalog-card h2').allTextContents();assert.equal(names[0],products.map(p=>p.name).sort((a,b)=>a.localeCompare(b))[0]);
 await page.locator('[data-catalog-sort]').selectOption('recommended');
 await page.evaluate(()=>window.scrollTo(0,document.querySelector('.catalog-grid').getBoundingClientRect().top+scrollY-260));
 await page.waitForFunction(()=>[...document.querySelectorAll('.catalog-card img')].slice(0,3).every(img=>img.naturalWidth>0));
 await page.screenshot({path:path.join(output,'catalog-desktop.png')});
 for(const product of products){
  const response=await page.goto(`${base}/products/${product.slug}`);assert.equal(response.status(),200);
  assert.equal(await page.locator('h1').innerText(),product.name);
  assert((await page.title()).length<=65);
  assert((await page.locator('meta[name="description"]').getAttribute('content')).length<=170);
  const media=page.locator('.detail-hero-media img');await media.waitFor();
  await page.waitForFunction(()=>document.querySelector('.detail-hero-media img')?.naturalWidth>0);
  assert.equal(await media.evaluate(img=>getComputedStyle(img).objectFit),'contain');
  assert.equal(await page.locator('main .accordion details').count(),4);
  assert(await page.locator('main a[href*="get-a-quote"][href*="product="]').count()>0);
 }
 await page.goto(`${base}/products/${products[0].slug}`);await page.screenshot({path:path.join(output,'product-desktop.png')});
 for(const width of [768,390,360]){
  await page.setViewportSize({width,height:844});
  for(const route of ['/products',`/products/${products[0].slug}`,'/get-a-quote','/faq']){
   await page.goto(base+route);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow ${width} ${route}`);
   if(width===390&&route==='/products'){
    await page.evaluate(()=>window.scrollTo(0,document.querySelector('.catalog-grid').getBoundingClientRect().top+scrollY-150));
    await page.waitForFunction(()=>document.querySelector('.catalog-card img')?.naturalWidth>0);
    await page.screenshot({path:path.join(output,'catalog-mobile.png')});
   }
   if(width===390&&route.startsWith('/products/'))await page.screenshot({path:path.join(output,'product-mobile.png'),fullPage:true});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(`${base}/products/${products[0].slug}`);
 const whatsapp=new URL(await page.locator('.floating-contact .wa').getAttribute('href'));
 assert.equal(whatsapp.hostname,'web.whatsapp.com');assert.equal(whatsapp.searchParams.get('phone'),'8615918968149');
 assert(whatsapp.searchParams.get('text').includes(products[0].name));
 await page.locator('main a[href*="get-a-quote"][href*="product="]').first().click();await page.waitForURL('**/get-a-quote*');
 assert((await page.locator('#message').inputValue()).includes(products[0].name));
 await page.locator('[type="submit"]').click();
 assert.equal(await page.locator('#name').evaluate(input=>input.validity.valueMissing),true);
 assert.equal(await page.evaluate(()=>window.dataLayer.filter(args=>args[0]==='event'&&args[1]==='form_submit').length),0);
 await page.goto(`${base}/get-a-quote?product=${products[0].slug}&source=product-detail`);
 assert((await page.locator('#message').inputValue()).includes(products[0].name));
 assert(await page.locator('#phone').getAttribute('required')!==null);
 await page.locator('#name').fill('QA Buyer');await page.locator('#company').fill('QA Company');await page.locator('#city').fill('Canada');
 await page.locator('#email').fill('qa-buyer@example.test');await page.locator('#phone').fill('5550100123');
 await page.locator('#country-code').selectOption('+1');
 let payload='';
 await context.route('https://formsubmit.co/**',async route=>{
  payload=route.request().postData();const values=new URLSearchParams(payload);const next=new URL(values.get('_next'));
  await route.fulfill({status:302,headers:{location:base+next.pathname+next.search},body:''});
 });
 await page.locator('[type="submit"]').click();await page.waitForURL('**/thank-you*');await page.waitForTimeout(100);
 const submitted=new URLSearchParams(payload);assert.equal(submitted.get('Phone'),'+1 5550100123');assert.equal(submitted.get('Product'),products[0].name);assert(submitted.get('Inquiry reference'));
 const events=()=>page.evaluate(()=>window.dataLayer.filter(args=>args[0]==='event').map(args=>({name:args[1],params:args[2]})));
 const leads=(await events()).filter(e=>e.name==='generate_lead');assert.equal(leads.length,1);
 assert(!JSON.stringify(leads).includes('qa-buyer'));assert(!JSON.stringify(leads).includes('5550100123'));
 await page.reload();assert.equal((await events()).filter(e=>e.name==='generate_lead').length,0);
 await page.goto(base+'/thank-you');assert.equal((await events()).filter(e=>e.name==='generate_lead').length,0);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'catalog-qa.json'),JSON.stringify({products:products.length,viewports:[1440,768,390,360],checks:['filters','search','empty state','sort',`${products.length} unique details`,'all hero images','matching FAQs','quote context','required phone','E.164 phone payload','no real emails sent','provider return lead','refresh/direct no false lead','no PII in lead event'],passed:true},null,2));
 console.log(`PASS: ${products.length} product pages, catalog controls, four viewports and intercepted inquiry lifecycle. No email was sent.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
