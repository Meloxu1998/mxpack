const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
const output='D:/mxpack-audits/2026-10-21/catalog-expansion';
(async()=>{
 const catalog=require('../seo-system/data/catalog-products.json');
 const additions=require('../seo-system/data/catalog-expansion-20261021.json');
 const sources=require('../seo-system/data/catalog-provenance.json').products;
 const original=JSON.parse(execFileSync('git',['show','d984b54:mxpack_website_with_section_images/seo-system/data/catalog-products.json'],{encoding:'utf8',cwd:root}));
 assert.equal(original.length,20);assert.equal(additions.length,20);assert(catalog.length>=40);
 for(const old of original)assert.deepEqual(catalog.find(p=>p.slug===old.slug),old,'Existing product changed '+old.slug);
 assert.equal(new Set(catalog.map(p=>p.sourceId)).size,catalog.length);
 assert.equal(new Set(catalog.map(p=>p.keyword)).size,catalog.length);
 const hashes=[];
 for(const product of catalog){
  const source=sources.find(s=>s.id===product.sourceId);assert(source);
  const pixels=await sharp(path.join(root,source.thumbnailPath)).resize(32,32,{fit:'fill'}).removeAlpha().raw().toBuffer();
  const hash=require('node:crypto').createHash('sha256').update(pixels).digest('hex');assert(!hashes.includes(hash),'Repeated image '+product.slug);hashes.push(hash);
 }
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext();
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  await context.route('https://formsubmit.co/**',r=>r.abort());
  const page=await context.newPage();
  for(const width of [1440,390,360]){
   await page.setViewportSize({width,height:900});
   for(const slug of ['bbq-grill-kit-packaging-box','bbq-meal-tray-carry-box','triangular-portion-sharing-box']){
    await page.goto(`${base}/products/${slug}`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.waitForFunction(()=>document.querySelector('.detail-hero-media img')?.naturalWidth>0);
    if(width!==360)await page.screenshot({path:path.join(output,`${slug}-${width}.png`),fullPage:false});
    await page.locator('main a[href*="get-a-quote?product="]').first().click();await page.waitForURL('**/get-a-quote*');
    assert((await page.locator('#message').inputValue()).includes(catalog.find(p=>p.slug===slug).name));
   }
   await page.goto(base+'/products?category=bbq');
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),2);
   await page.locator('[data-catalog-filter="all"]').click();
   await page.locator('[data-catalog-search-input]').fill('triangular');await page.waitForTimeout(180);
   assert.equal(await page.locator('.catalog-card:not([hidden])').count(),1);
   await page.goto(base+'/resources');
   assert((await page.locator('h1').innerText()).includes('guides'));
   assert.equal(await page.locator('.nav-links a[href="/resources"]').first().innerText(),'Guides');
   assert.equal(await page.locator('h3').filter({hasText:/^Resources$/}).count(),0);
   await page.screenshot({path:path.join(output,`guides-${width}.png`),fullPage:true});
  }
 }finally{await browser.close();}
 const csv=rows=>rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
 fs.writeFileSync(path.join(output,'new-20-products.csv'),csv([['name','url','source_id','starting_moq','difference_from_existing'],...additions.map(p=>[p.name,`https://mxpackpro.com/products/${p.slug}`,p.sourceId,sources.find(s=>s.id===p.sourceId).minimumOrder,p.distinct])]));
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({base,originalRetained:20,newProducts:20,totalProducts:catalog.length,uniqueSourceIds:catalog.length,uniqueImageChecks:hashes.length,manualStructureReview:additions.map(p=>({slug:p.slug,distinction:p.distinct})),guideUrlPreserved:'/resources',gscSubmitted:false,messagesSent:false,luxopackPublished:false},null,2));
 console.log('PASS: 20 original records unchanged, 20 unique additions, BBQ filter, three mobile/desktop widths, product inquiry context and Guides labels. No messages or GSC submissions.');
})().catch(error=>{console.error(error);process.exit(1)});
