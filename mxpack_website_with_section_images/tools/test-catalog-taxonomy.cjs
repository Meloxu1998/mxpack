const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const sharp=require('sharp');
const base=process.env.QA_BASE||'http://127.0.0.1:4198';
const output='D:/mxpack-audits/2026-10-21/catalog-taxonomy';
const {categories,aliases}=JSON.parse(fs.readFileSync('seo-system/data/catalog-taxonomy.json','utf8'));
const products=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json','utf8'));
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const baseline=JSON.parse(execFileSync('git',['show','bde6cdd:mxpack_website_with_section_images/seo-system/data/catalog-products.json'],{encoding:'utf8'}));
 assert.deepEqual(products,baseline,'Existing product records must not change');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  await page.route('https://formsubmit.co/**',r=>r.abort());
  const results=[];
  for(const width of [360,390,768,1024,1440,1920]){
   await page.setViewportSize({width,height:1000});await page.goto(base+'/');
   assert.deepEqual(await page.locator('[data-home-family]').evaluateAll(nodes=>nodes.map(n=>n.dataset.homeFamily)),categories.map(c=>c.id));
   const cols=await page.locator('.home-families').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);
   assert.equal(cols,width>1000?4:width>600?3:2);
   await page.locator('.home-collections').scrollIntoViewIfNeeded();
   await page.evaluate(async()=>{document.querySelectorAll('.home-family img').forEach(i=>i.loading='eager');await Promise.all([...document.querySelectorAll('.home-family img')].map(i=>i.decode()));});
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
   if([390,1440].includes(width)){
    const image=await page.locator('.home-collections').screenshot({path:`${output}/home-categories-${width}.png`,style:'.site-header,.floating-contact,.mobile-contact-bar {visibility:hidden!important}'});
    assert((await sharp(image).stats()).channels.some(c=>c.stdev>25));
   }
   await page.goto(base+'/products');
   assert.equal(await page.locator('.catalog-card').count(),54);
   assert.deepEqual(await page.locator('[data-catalog-filter]').evaluateAll(nodes=>nodes.slice(1).map(n=>n.dataset.catalogFilter)),categories.map(c=>c.id));
   for(const c of categories){
    if(width<=760)await page.locator('[data-catalog-select]').selectOption(c.id);
    else await page.locator(`[data-catalog-filter="${c.id}"]`).click();
    const visible=await page.locator('.catalog-card:not([hidden])').evaluateAll(nodes=>nodes.map(n=>n.dataset.productId).sort());
    assert.deepEqual(visible,[...c.members].sort(),`${width}: ${c.id}`);
    assert(new URL(page.url()).searchParams.get('category')===c.id);
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
   }
   await page.goto(base+'/products?category=cosmetic-boxes');
   assert((await page.locator('[data-catalog-context]').innerText()).includes('not fixed-size stock'));
   if([390,1440].includes(width)){
    await page.evaluate(async()=>{document.querySelectorAll('.catalog-card:not([hidden]) img').forEach(i=>i.loading='eager');await Promise.all([...document.querySelectorAll('.catalog-card:not([hidden]) img')].map(i=>i.decode()));scrollTo({top:500,behavior:'instant'});});
    await page.screenshot({path:`${output}/catalog-${width}.png`});
   }
   results.push({width,columns:cols,categoriesTested:16});
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const [legacy,current] of Object.entries(aliases)){
   await page.goto(`${base}/products?category=${legacy}`);
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),categories.find(c=>c.id===current).members.length);
  }
  await page.goto(base+'/products?category=bbq');
  await page.locator('[data-catalog-filter="burger-boxes"]').click();await page.goBack();
  assert.equal(await page.locator('.catalog-card:not([hidden])').count(),2);
  await page.locator('[data-catalog-filter="all"]').click();
  await page.locator('[data-catalog-search-input]').fill('pyramid');
  await page.waitForFunction(()=>document.querySelectorAll('.catalog-card:not([hidden])').length===2);
  await page.locator('[data-catalog-sort]').selectOption('name');
  const names=await page.locator('.catalog-card:not([hidden]) h2').allTextContents();
  assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://mxpackpro.com/products');
  await page.goto(base+'/christmas-packaging');assert.equal(await page.locator('.catalog-card:not([hidden])').count(),10);
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:960});await page.goto(base+'/products?category=bbq');
   if(width===1440){
    await page.locator('[aria-controls="nav-products"]').hover();
    await page.locator('#nav-products').waitFor({state:'visible'});
    assert.equal(await page.locator('#nav-products .mega-menu-grid a:visible').count(),16);
    await page.locator('#nav-products a[href="/products?category=christmas-boxes"]').click();
   }else{
    await page.locator('[data-menu-toggle]').click();
    await page.locator('.mobile-menu details').first().locator('summary').click();
    await page.locator('.mobile-menu a[href="/products?category=christmas-boxes"]').click();
   }
   await page.waitForURL('**/products?category=christmas-boxes');
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),10);
   await page.goto(base+'/products/bbq-meal-tray-carry-box');
   assert((await page.locator('.floating-contact [data-whatsapp]').getAttribute('href')).includes('8615918968149'));
   assert.equal(await page.locator('.floating-contact a[href^="mailto:sales@mxpackpro.com"]').count(),1);
   await page.locator('main a[href*="get-a-quote?product="]').first().click();await page.waitForURL('**/get-a-quote*');
   assert((await page.locator('#message').inputValue()).includes('BBQ'));
   assert(await page.locator('#phone').evaluate(n=>n.required));
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${output}/${base.startsWith('https')?'live':'local'}-verification.json`,JSON.stringify({base,passed:true,results,products:54,categories:16,recordsUnchanged:true,noMessagesSent:true},null,2));
  console.log('PASS: 16 categories, 54 unchanged products, 6 viewport sizes, all filter memberships, legacy links, search, sort and history. No messages sent.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
