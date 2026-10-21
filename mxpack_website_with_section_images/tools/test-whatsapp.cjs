const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.QA_BASE||'http://127.0.0.1:4187';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext();
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
  let external=0;
  await context.route(/https:\/\/(?:wa\.me|web\.whatsapp\.com)\//,async r=>{external++;await r.fulfill({status:200,body:'WhatsApp navigation intercepted. No message sent.'});});
  const page=await context.newPage();
  const output='D:/mxpack-audits/2026-10-21/whatsapp';fs.mkdirSync(output,{recursive:true});
  for(const width of [1440,390,360]){
   await page.setViewportSize({width,height:900});
   for(const route of ['/','/products/custom-burger-clamshell-box','/get-a-quote','/custom-packaging']){
    await page.goto(base+route);await page.locator('[data-whatsapp]').first().waitFor({state:'attached'});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    for(const link of await page.locator('[data-whatsapp]').all()){
     const url=new URL(await link.getAttribute('href'));assert.equal(url.hostname,'web.whatsapp.com');assert.equal(url.searchParams.get('phone'),'8615918968149');
     assert(url.searchParams.get('text').includes('https://mxpackpro.com'+route));
     if(route.includes('/products/'))assert(url.searchParams.get('text').includes(await page.locator('h1').innerText()));
     assert.equal(await link.getAttribute('data-track'),'whatsapp_click');
    }
    if(width<600&&!route.includes('quote')&&!route.includes('custom-packaging')){
     assert.equal(await page.locator('.mobile-contact-bar a').count(),3);
     const bounds=await page.locator('.mobile-contact-bar').boundingBox();assert(bounds.width===width);
    }
    if(route==='/'||route==='/get-a-quote')await page.screenshot({path:path.join(output,`${route==='/'?'home':'quote'}-${width}.png`),fullPage:false});
   }
  }
  await page.goto(base+'/');
  const popupPromise=context.waitForEvent('page');await page.locator('.mobile-contact-whatsapp').click();const popup=await popupPromise;await popup.waitForLoadState();
  assert.equal(external,1);await popup.close();
  const events=await page.evaluate(()=>window.dataLayer.filter(a=>a[0]==='event').map(a=>a[1]));
  assert(events.includes('whatsapp_click'));assert(!events.includes('generate_lead'));
  for(const userAgent of ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1','Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36']){
   const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent});
   const phone=await mobile.newPage();await phone.goto(base+'/products/custom-burger-clamshell-box');
   const url=new URL(await phone.locator('.mobile-contact-whatsapp').getAttribute('href'));
   assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/8615918968149');assert(url.searchParams.get('text').includes('Burger'));
   await mobile.close();
  }
  console.log('PASS: 4 routes, 3 viewports, correct WhatsApp number and product context, isolated click tracking, intercepted navigation. No message sent.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
