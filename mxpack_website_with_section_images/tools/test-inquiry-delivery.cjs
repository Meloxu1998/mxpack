const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = process.cwd();
const out = process.env.QA_OUTPUT || 'D:/mxpack-audits/2026-11-04/inquiry-repair/ui';
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.extname(file)) file += '.html';
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.webp':'image/webp'};
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'}).end(fs.readFileSync(file));
});

(async () => {
  if (!process.env.QA_BASE) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.QA_BASE || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'chrome', headless:true});
  fs.mkdirSync(out, {recursive:true});
  const results = []; let oldProviderRequests = 0, mockedApiRequests = 0;
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({viewport:{width,height:width === 390 ? 844 : 1000}, isMobile:width === 390, hasTouch:width === 390});
      await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200,body:''}));
      await context.route('https://formsubmit.co/**', route => { oldProviderRequests++; return route.abort(); });
      let attempts = [], mode = 'error';
      await context.route('**/api/inquiry', async route => {
        mockedApiRequests++;
        const incoming = route.request();
        const form = await new Request(incoming.url(), {method:'POST',headers:incoming.headers(),body:incoming.postDataBuffer()}).formData();
        attempts.push(Object.fromEntries(form));
        if (mode === 'network') return route.abort();
        if (mode === 'error') return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'temporarily_unavailable'})});
        await new Promise(resolve => setTimeout(resolve, 250));
        return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({saved:true,reference:'MXP-20261104-0123456789ABCDEF0123',notification:'separate'})});
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const pathname of ['/products/bbq-meal-tray-carry-box', '/get-a-quote', '/custom-packaging']) {
        attempts = []; mode = 'error';
        await page.goto(base + pathname, {waitUntil:'networkidle'});
        assert.equal(await page.locator('.email-inquiry-dialog[open]').count(), 0);
        const modal = pathname.startsWith('/products/');
        if (modal) await page.locator(width === 390 ? '.mobile-contact-email' : '.floating-contact .mail').click();
        const form = page.locator(modal ? '.email-inquiry-dialog form' : '[data-quote-form]');
        assert.equal(await form.getAttribute('action'), '/api/inquiry');
        await form.locator('[name="Name"]').fill('Local Delivery QA');
        await form.locator('[name="email"]').fill('qa@example.test');
        await form.locator('[name="Message"]').fill('Mock-only brief. No live email.');
        if (!modal) await form.locator('[name="Phone"]').fill('5550100100');
        const button = form.locator('[type="submit"]');
        await button.click();
        await form.locator('.inquiry-status[data-error]').waitFor({state:'visible'});
        assert.equal(await form.locator('[name="Message"]').inputValue(), 'Mock-only brief. No live email.');
        assert.equal(await button.isDisabled(), false);
        const firstKey = attempts[0]['Inquiry reference'];
        await form.locator('[name="Message"]').fill('Edited mock-only brief. No live email.');
        mode = 'network';
        await button.click();
        await page.waitForFunction(() => document.querySelector('.inquiry-status[data-error]') && !document.querySelector('[data-quote-form] [type="submit"]:disabled'));
        assert.equal(attempts.length, 2);
        assert.notEqual(attempts[1]['Inquiry reference'], firstKey, 'An edited brief needs a new idempotency key');
        assert((await form.locator('.inquiry-status').textContent()).includes('could not confirm receipt'));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        if (modal) await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-${width}-retained-error.png`)});
        mode = 'saved';
        await button.click();
        assert.equal(await button.isDisabled(), true);
        await form.evaluate(element => element.dispatchEvent(new Event('submit', {bubbles:true,cancelable:true})));
        await page.waitForURL('**/thank-you**');
        assert.equal(attempts.length, 3, 'Double submits must not create a fourth request');
        assert.equal(attempts[2]['Inquiry reference'], attempts[1]['Inquiry reference'], 'An unchanged retry must retain its key');
        assert((await page.locator('[data-inquiry-result-title]').textContent()).includes('has been saved'));
        assert((await page.locator('[data-inquiry-receipt]').textContent()).includes('MXP-20261104-0123456789ABCDEF0123'));
        assert(!page.url().includes('request='), 'Receipt state should not persist in the URL');
        const events = await page.evaluate(() => window.dataLayer.filter(value => value[0] === 'event').map(value => value[1]));
        assert(!events.includes('generate_lead'));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        if (modal) {
          assert.equal(attempts[2]['Product page'], 'https://mxpackpro.com' + pathname);
          assert.equal(attempts[2]['Inquiry source'], pathname);
          assert(!('Phone' in attempts[2]));
          await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-${width}-saved.png`)});
        } else assert(attempts[2].Phone.includes('5550100100'));
        results.push({width,pathname,fieldRetention:true,retryKeyStable:true,duplicateClickBlocked:true,receiptShown:true,actualMail:'not tested; API fully mocked'});
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    assert.equal(oldProviderRequests, 0);
    fs.writeFileSync(path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-ui-qa.json`), JSON.stringify({passed:true,results,mockedApiRequests,oldProviderRequests,realEmailsSent:0}, null, 2));
    console.log(`PASS: ${results.length} desktop/mobile form flows; failure retention, stable retries, double-submit guard, attribution and saved receipts. ${mockedApiRequests} mocked API requests; zero live messages.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
