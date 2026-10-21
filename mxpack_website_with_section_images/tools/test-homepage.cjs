const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const sharp=require('sharp');
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
const output='D:/mxpack-audits/2026-10-21/homepage-rebuild';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext();
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  await context.route('https://formsubmit.co/**',r=>r.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const results=[];
  for(const width of [360,390,768,1024,1101,1200,1280,1440,1920,2560]){
   await page.setViewportSize({width,height:width<600?844:1000});
   const response=await page.goto(base+'/');assert.equal(response.status(),200);
   await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.home-stage img').decode();});
   const metrics=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,h1:rect('h1'),stage:rect('.home-stage'),facts:rect('.home-facts'),hero:document.querySelector('.home-stage img').currentSrc,heroDownloads:performance.getEntriesByType('resource').filter(r=>/packaging-family-.*webp/.test(r.name)).map(r=>r.name),families:document.querySelectorAll('[data-home-family]').length,logos:document.querySelectorAll('.logo-group:not([aria-hidden]) img').length};
   });
   assert(!metrics.overflow,`Overflow ${width}`);assert.equal(metrics.families,6);assert.equal(metrics.logos,10);
   assert(metrics.facts.y< (width<600?844:1000)-20,`No next-section hint ${width}`);
   assert(metrics.h1.height<=220,`Headline too tall ${width}`);
   assert(metrics.hero.includes(width<=1240?'mobile':'desktop'),`Wrong art direction ${width}`);
   assert.equal(metrics.heroDownloads.length,1,`Duplicate hero image download ${width}`);
   await page.screenshot({path:`${output}/first-fold-${width}.png`});
   await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
   assert.equal(await page.locator('main img').evaluateAll(images=>images.filter(img=>!img.naturalWidth).length),0,`Missing image ${width}`);
   assert(await page.locator('.home-family-media img').evaluateAll(images=>images.every(img=>getComputedStyle(img).objectFit==='contain')));
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('.home-questions details').count(),7);
   const screenshot=await page.locator('.home-stage-media').screenshot({path:`${output}/hero-${width}.png`});
   const stats=await sharp(screenshot).stats();assert(stats.channels.some(channel=>channel.stdev>25),`Blank hero ${width}`);
   if([390,1440,1920].includes(width)){
    for(const [selector,name] of [['.home-collections','collection'],['.home-custom','custom'],['.home-company-faq','company-faq']])await page.locator(selector).screenshot({path:`${output}/${name}-${width}.png`,style:'.site-header,.floating-contact,.mobile-contact-bar,.skip-link { visibility:hidden!important }'});
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${output}/page-${width}.png`,fullPage:true});
   }
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight*.6));
   assert.equal(await page.locator('[data-contact-prompt]').isHidden(),true,`Obstructive popup ${width}`);
   results.push({width,...metrics});
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();const graph=JSON.parse(schemas[0])['@graph'];
  assert.equal(graph.filter(node=>node['@type']==='Organization').length,1);
  assert.equal(graph.find(node=>node['@type']==='WebPage').mainEntity.numberOfItems,6);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://mxpackpro.com/');
  await page.locator('[data-home-family]').first().evaluate(link=>link.addEventListener('click',event=>event.preventDefault(),{once:true}));
  await page.locator('[data-home-family]').first().click();
  assert(await page.evaluate(()=>window.dataLayer.some(args=>args[0]==='event'&&args[1]==='home_category_click'&&args[2].entry_point==='home_takeaway-food-boxes')));
  await page.locator('.home-questions details').nth(1).locator('summary').click();
  assert.equal(await page.locator('.home-questions details').nth(1).getAttribute('open'),'');
  await page.locator('[data-track="quote_home_hero_click"]').click();await page.waitForURL('**/get-a-quote*');
  assert.equal(await page.locator('[name="Inquiry source"]').inputValue(),'/');
  assert.equal(await page.locator('#phone').evaluate(input=>input.required),true);
  const entry=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mxpackQuoteEntry')));assert.equal(entry.entry_point,'quote_home_hero_click');
  await page.goto(base+'/');await page.clock.install();await page.clock.fastForward(30000);
  assert(await page.locator('[data-contact-prompt]').isHidden());
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${output}/verification.json`,JSON.stringify({base,passed:true,results,checks:['six real format categories','seven purchasing answers','ten existing client logos','responsive art direction','single hero request','one H1','connected entity schema','no overflowing layout','nonblank image pixels','no automatic contact popup','homepage quote attribution','phone required'],noEmailSent:true,noGscSubmission:true},null,2));
  console.log(`PASS: homepage at ${results.length} widths, responsive media, native FAQs, quote attribution and no obstructive popup. No email or GSC submission.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
