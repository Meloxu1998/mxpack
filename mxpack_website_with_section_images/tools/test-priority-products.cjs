const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.QA_BASE || 'https://mxpackpro.com';
const output = process.env.QA_OUTPUT || 'D:/mxpack-audits/2026-10-22/indexing-followup';
const slugs = ['bbq-grill-kit-packaging-box', 'bbq-meal-tray-carry-box', 'custom-pyramid-catering-box'];
fs.mkdirSync(output, {recursive: true});
(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const results = [];
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://formsubmit.co/**', route => route.abort());
    await page.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200, body:''}));
    const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
    const catalog = await (await page.request.get(`${base}/products`)).text();
    assert(!sitemap.includes('custom-christmas-cracker-favor-box'));
    assert(!catalog.includes('custom-christmas-cracker-favor-box'));
    for (const slug of slugs) {
      assert(sitemap.includes(`${base}/products/${slug}`));
      assert(catalog.includes(`href="/products/${slug}"`));
      for (const width of [390, 1440]) {
        await page.setViewportSize({width, height: 1000});
        const response = await page.goto(`${base}/products/${slug}`);
        assert.equal(response.status(), 200);
        assert(!/noindex/i.test(response.headers()['x-robots-tag'] || ''));
        assert(!/noindex/i.test(await page.locator('meta[name="robots"]').getAttribute('content')));
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${base}/products/${slug}`);
        assert.equal(await page.locator('h1').count(), 1);
        assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
        assert(await page.locator('main img').first().evaluate(async img => {await img.decode(); return img.naturalWidth > 0;}));
        assert((await page.locator('[data-whatsapp]').first().getAttribute('href')).includes('8615918968149'));
        await page.screenshot({path: `${output}/${slug}-${width}.png`});
        await page.locator('main a[href*="get-a-quote?product="]').first().click();
        await page.waitForURL('**/get-a-quote*');
        assert((await page.locator('#message').inputValue()).trim().length > 0);
        results.push({slug, width, httpStatus: 200, canonical: true, imageLoaded: true, quotePrefilled: true});
      }
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({width, height: 1000});
      const response = await page.goto(`${base}/products/custom-christmas-cracker-favor-box`);
      assert.equal(response.status(), 410);
      assert.equal(response.headers()['cache-control'], 'no-store');
      assert(!(await page.locator('body').innerText()).includes('Custom Christmas cracker favor boxes'));
      await page.screenshot({path: `${output}/withdrawn-410-${width}.png`});
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${output}/live-priority-qa.json`, JSON.stringify({checkedAt: new Date().toISOString(), base, passed: true, results, withdrawnStatus: 410, noMessagesSent: true}, null, 2));
    console.log('PASS: 3 priority pages x desktop/mobile; SEO, images, quote context, contact links; withdrawn URL 410. No messages sent.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
