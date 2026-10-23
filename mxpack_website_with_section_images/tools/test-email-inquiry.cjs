const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=process.cwd(),out='D:/mxpack-audits/2026-10-23/email-inquiry';
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];let formRequests=0;fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390,userAgent:width===390?'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36':undefined});
   await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',r=>{formRequests++;return r.abort()});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const pathname of ['/','/products/custom-printed-corrugated-mailer','/bbq-meal-packaging-buying-guide','/get-a-quote']){
    if(width===390&&pathname==='/get-a-quote')continue;
    await page.goto(base+pathname,{waitUntil:'networkidle'});
    assert.equal(await page.locator('.email-inquiry-dialog[open]').count(),0);
    assert.equal(await page.locator('[data-quote-form]').count(),pathname==='/get-a-quote'?1:0);
    if(pathname==='/'){
     await page.clock.install();await page.clock.fastForward(30000);
     assert.equal(await page.locator('.email-inquiry-dialog[open]').count(),0,'Inquiry opened automatically');
     assert(await page.locator('[data-contact-prompt]').isHidden());
    }
    const trigger=width===390&&pathname!=='/get-a-quote'?page.locator('.mobile-contact-email'):page.locator('.floating-contact .mail');
    await trigger.click();const dialog=page.locator('.email-inquiry-dialog');
    await dialog.waitFor({state:'visible'});
    assert.equal(await page.locator(':focus').getAttribute('id'),'email-inquiry-name');
    await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');
    assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'Keyboard focus left the modal');
    await dialog.locator('#email-inquiry-name').focus();
    const bounds=await dialog.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);
    assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    const form=dialog.locator('form');
    assert(await form.evaluate(f=>!f.checkValidity()),'Empty required fields should be invalid');
    assert.equal(await form.getAttribute('action'),'https://formsubmit.co/sales@mxpackpro.com');
    assert.equal(await form.locator('[name="Inquiry source"]').inputValue(),pathname);
    if(pathname.startsWith('/products/')){
     assert.equal(await form.locator('[name="Product page"]').inputValue(),'https://mxpackpro.com'+pathname);
     assert((await form.locator('[name="Message"]').inputValue()).includes('Printed Corrugated Mailer'));
    }
    assert((await dialog.locator('[data-direct-inquiry-email]').getAttribute('href')).startsWith('mailto:sales@mxpackpro.com?'));
    const whatsapp=await dialog.locator('[data-whatsapp]').getAttribute('href');
    assert(whatsapp.includes('8615918968149'));
    assert.equal(whatsapp.startsWith('whatsapp://'),width===390);
    if(pathname==='/products/custom-printed-corrugated-mailer')await dialog.screenshot({path:path.join(out,`${process.env.QA_BASE?'live':'local'}-${width}.png`)});
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    assert(await trigger.evaluate(e=>document.activeElement===e));
    await trigger.click();await dialog.waitFor({state:'visible'});
    await dialog.locator('[data-email-inquiry-close]').click();await dialog.waitFor({state:'detached'});
    await trigger.click();await dialog.waitFor({state:'visible'});
    await page.mouse.click(1,1);await dialog.waitFor({state:'detached'});
    await trigger.click();await dialog.waitFor({state:'visible'});
    await form.locator('[name="Name"]').fill('QA Preview');
    await form.locator('[name="email"]').fill('preview@example.com');
    await form.locator('[name="Company Name"]').fill('Preview only');
    await form.locator('[name="Message"]').fill('Local validation only; no message is sent.');
    // Replace native transmission before exercising the submit handler. No network send occurs.
    await page.evaluate(()=>{window.previewPayloads=[];HTMLFormElement.prototype.submit=function(){window.previewPayloads.push(Object.fromEntries(new FormData(this)));};});
    await form.locator('[type="submit"]').click();
    await page.waitForFunction(()=>window.previewPayloads.length===1);
    const payload=await page.evaluate(()=>window.previewPayloads[0]);
    assert(payload['Inquiry reference']);assert(payload._next.includes(encodeURIComponent(payload['Inquiry reference'])));
    assert.equal(payload['Inquiry source'],pathname);assert(!Object.hasOwn(payload,'Phone'));
    assert.equal(await form.locator('[type="submit"]').isDisabled(),true);
    results.push({width,pathname,source:payload['Inquiry source'],product:payload.Product||null,referenceGenerated:true,transmission:'replaced with local spy'});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  assert.equal(formRequests,0);
  fs.writeFileSync(path.join(out,`${process.env.QA_BASE?'live':'local'}-verification.json`),JSON.stringify({results,formRequests,passed:true},null,2));
  console.log(`PASS: ${results.length} desktop/mobile inquiry flows, product/source attribution, close/focus, submit data and WhatsApp; 0 outbound form requests.`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
