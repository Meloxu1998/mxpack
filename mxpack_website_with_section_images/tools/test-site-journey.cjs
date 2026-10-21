const {chromium} = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.QA_BASE || 'http://127.0.0.1:4187';
const output = 'D:/mxpack-audits/2026-10-21';
const files = [...fs.readdirSync('.').filter(f => f.endsWith('.html')), ...fs.readdirSync('products').filter(f => f.endsWith('.html')).map(f => `products/${f}`)];
(async () => {
  const browser = await chromium.launch({headless:true, channel:'chrome'});
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('mxpackContactPromptDismissedAt', Date.now()));
    await context.route(/googletagmanager\.com|google-analytics\.com/, r => r.fulfill({status:200, body:''}));
    await context.route('https://formsubmit.co/**', r => r.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const results = [];
    for (const width of [2560,1440,390]) {
      await page.setViewportSize({width,height:1000});
      for (const file of files) {
        const route = file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '');
        const response = await page.goto(base + route);
        assert.equal(response.status(), file === '404.html' && base.startsWith('https:') ? 404 : 200, route);
        await page.evaluate(async () => {
          document.querySelectorAll('img[loading="lazy"]').forEach(img => img.loading = 'eager');
          await document.fonts.ready;
          await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        });
        const metrics = await page.evaluate(() => ({
          overflow:document.documentElement.scrollWidth > innerWidth + 1,
          missing:[...document.querySelectorAll('main img')].filter(img => !img.naturalWidth).map(img=>img.src),
          headings:[...document.querySelectorAll('.partner-copy h2,.detail-hero-copy h1,.about-copy h1')].map(el=>({width:Math.round(el.getBoundingClientRect().width),text:el.textContent})),
          duplicates:[...document.querySelectorAll('[id]')].map(el=>el.id).filter((id,index,ids)=>ids.indexOf(id)!==index),
          menus:document.querySelectorAll('[data-nav-toggle]').length,
          oldFields:document.querySelectorAll('.quote-form,.form-layout').length
        }));
        assert(!metrics.overflow, `${width} overflow ${route}`);
        assert.deepEqual(metrics.missing, [], `${width} images ${route}`);
        assert.deepEqual(metrics.duplicates, [], `${width} duplicate IDs ${route}`);
        assert.equal(metrics.oldFields, 0, `${route} old form`);
        if (file !== '404.html') assert.equal(metrics.menus, 2, `${route} menu structure`);
        if (width >= 1440) for (const heading of metrics.headings) assert(heading.width>=340, `${width} narrow heading ${route}: ${heading.width}`);
        results.push({route,width,...metrics});
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+'/');
    const toggle = page.locator('[data-nav-toggle]').first();
    await toggle.focus(); await page.keyboard.press('ArrowDown');
    assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('.mega-menu a').first().evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await toggle.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'),'true');
    await page.locator('h1').click();
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.goto(base+'/faq');
    const faqUrl = page.url();
    for (const category of ['ordering','printing','materials','shipping','all']) {
      await page.locator(`[data-faq-filter="${category}"]`).click();
      assert.equal(page.url(),faqUrl);
      const visible = await page.locator('[data-faq-category]:not([hidden])').count();
      assert(visible>0);if(category==='all')assert.equal(visible,14);
      else assert.equal(await page.locator(`[data-faq-category]:not([hidden]):not([data-faq-category="${category}"])`).count(),0);
    }
    for (const route of ['/get-a-quote?solution=catering','/custom-packaging']) {
      await page.goto(base+route);
      const form=page.locator('[data-quote-form]');
      assert.equal(await form.count(),1);
      for(const id of ['name','phone','email','message'])assert.equal(await form.locator('#'+id).evaluate(el=>el.required),true);
      assert(await form.locator('#phone').evaluate(el=>parseFloat(getComputedStyle(el).minHeight)>=52));
      if(route.includes('solution'))assert((await form.locator('#message').inputValue()).includes('Catering'));
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(base+'/');
    await page.locator('[data-menu-toggle]').click();
    await page.locator('.mobile-menu summary').first().click();
    await page.locator('.mobile-menu summary').last().click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.mobile-menu details[open]').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
    for(const width of [1920,1024,768,360]) {
      await page.setViewportSize({width,height:1000});
      for(const route of ['/','/solutions','/custom-packaging','/get-a-quote','/packaging-buying-guide','/about-us']) {
        await page.goto(base+route);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Additional width ${width} ${route}`);
      }
    }
    for (const [route,width,selector,name] of [
      ['/',2560,'.home-stage','ux-home-wide'],
      ['/custom-packaging',1440,'#quote-form','ux-custom-form-desktop'],
      ['/custom-packaging',390,'#quote-form','ux-custom-form-mobile'],
      ['/solutions',1440,'#catering','ux-solutions-desktop'],
      ['/solutions',390,'#catering','ux-solutions-mobile'],
      ['/packaging-buying-guide',1440,'.buyer-guide','ux-buying-guide'],
      ['/about-us',2560,'main','ux-about-wide']
    ]) {
      await page.setViewportSize({width,height:1000});await page.goto(base+route);
      await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
      const target=page.locator(selector).first();await target.scrollIntoViewIfNeeded();
      await target.screenshot({path:`${output}/${name}.png`,style:'.site-header,.floating-contact,.mobile-contact-bar,.skip-link { visibility:hidden!important; }'});
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(`${output}/site-journey-qa.json`,JSON.stringify({base,passed:true,pageViewportChecks:results.length,additionalWidths:[1920,1024,768,360],results,noRealEmailSent:true},null,2));
    console.log(`PASS: ${results.length} page/viewport checks, navigation keyboard/touch, FAQ filters, both forms, all main images. No email sent.`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
