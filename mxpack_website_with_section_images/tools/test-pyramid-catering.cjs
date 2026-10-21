const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const product=require('../seo-system/data/pyramid-catering-product.json');
const catalog=require('../seo-system/data/catalog-products.json');
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
const output='D:/mxpack-audits/2026-10-21/pyramid-catering';
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext();
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  await context.route('https://formsubmit.co/**',r=>r.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,768,390,360]){
   await page.setViewportSize({width,height:900});
   for(const view of product.views){
    await page.goto(base+'/products/'+product.slug);
    assert.equal(await page.locator('[data-reference-id]').count(),3);
    await page.locator(`[data-reference-id="${view.id}"]`).click();
    await page.waitForFunction(id=>document.querySelector('[data-gallery-main]').complete&&document.querySelector('[data-gallery-main]').naturalWidth>0&&document.querySelector('[data-gallery-main]').currentSrc.includes(id),view.sourceId);
    assert.equal(await page.locator(`[data-reference-id="${view.id}"]`).getAttribute('aria-pressed'),'true');
    assert((await page.locator('[data-reference-note]').innerText()).includes(view.note));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const wa=new URL(await page.locator('.floating-contact [data-whatsapp]').getAttribute('href'));
    assert(wa.searchParams.get('text').includes(view.label));
    if(width===1440||width===390){
     await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
     await page.evaluate(()=>scrollTo(0,0));
     await page.screenshot({path:path.join(output,`${view.id}-${width}.png`),fullPage:width===390});
    }
    await page.locator('main a[href*="get-a-quote?product="]').first().click();await page.waitForURL('**/get-a-quote*');
    assert((await page.locator('#message').inputValue()).includes('Reference view: '+view.label));
    assert.equal(await page.locator('input[name="Packaging reference view"]').inputValue(),view.label);
   }
  }
  await page.goto(base+`/get-a-quote?product=${product.slug}&view=toString`);
  assert.equal(await page.locator('input[name="Packaging reference view"]').count(),0);
  await page.goto(base+'/products');
  assert.equal(await page.locator(`.catalog-card[data-product-id="${product.slug}"]`).count(),1);
  assert.equal(await page.locator('.catalog-card').count(),catalog.length);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');assert.equal(canonical,'https://mxpackpro.com/products');
  assert.deepEqual(errors,[]);
  console.log('PASS: 3 original reference images, one deduplicated product, 4 widths, view-specific quote/WhatsApp context, unknown view rejected. No messages sent.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
