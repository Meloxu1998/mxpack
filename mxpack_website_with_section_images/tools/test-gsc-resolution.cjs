const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = process.cwd();
const out = process.env.QA_OUTPUT;
assert(out, 'Set QA_OUTPUT to a private evidence directory.');
fs.mkdirSync(out, {recursive:true});
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let file = path.resolve(root, '.' + pathname);
  if (!path.extname(file)) file += '.html';
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return res.writeHead(404).end();
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.svg':'image/svg+xml'};
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'}).end(fs.readFileSync(file));
});
(async () => {
  if (!process.env.QA_BASE) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.QA_BASE || `http://127.0.0.1:${server.address().port}`;
  console.log(`Checking ${base}`);
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const results = [];
  let transmissions = 0;
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({viewport:{width, height:1000}, isMobile:width === 390, hasTouch:width === 390});
      await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200, body:''}));
      await context.route('https://formsubmit.co/**', route => {transmissions++; return route.abort();});
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(30000);
      console.log(`Viewport ${width}: loading guide`);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(base + '/materials-food-safety', {waitUntil:'networkidle'});
      assert.equal(response.status(), 200);
      await page.locator('main img').first().waitFor({state:'visible'});
      const data = await page.evaluate(async () => {
        const main = document.querySelector('main');
        const images = [...main.querySelectorAll('img')];
        for (const img of images) {
          img.loading = 'eager';
          await Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timeout: ' + img.src)), 10000))]);
        }
        const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
        return {
          h1:document.querySelectorAll('h1').length,
          canonical:document.querySelector('link[rel="canonical"]').href,
          robots:document.querySelector('meta[name="robots"]').content,
          overflow:document.documentElement.scrollWidth > innerWidth + 1,
          images:images.map(img => img.naturalWidth),
          faqs:[...main.querySelectorAll('.accordion details')].map(d => ({name:d.querySelector('summary').textContent, text:d.querySelector('p').textContent})),
          faqSchema:schemas.find(s => s['@type'] === 'FAQPage'),
          article:schemas.find(s => s['@type'] === 'Article'),
          sources:[...main.querySelectorAll('a[href^="https://"]')].map(a => a.href),
          updated:main.querySelector('time').dateTime
        };
      });
      assert.equal(data.h1, 1);
      assert.equal(data.canonical, 'https://mxpackpro.com/materials-food-safety');
      assert(!data.robots.includes('noindex'));
      assert(!data.overflow);
      assert(data.images.every(w => w > 0));
      assert.equal(data.faqs.length, 3);
      assert.deepEqual(data.faqs, data.faqSchema.mainEntity.map(q => ({name:q.name, text:q.acceptedAnswer.text})));
      assert.equal(data.article.dateModified, data.updated);
      assert.equal(data.article.mainEntityOfPage, data.canonical);
      assert.equal(data.sources.filter(url => /www\.fda\.gov|food\.ec\.europa\.eu/.test(url)).length, 3);
      await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-materials-${width}.png`), fullPage:true});
      await page.locator(width === 390 ? '.mobile-contact-email' : '.floating-contact .mail').click();
      const modal = page.locator('.email-inquiry-dialog[open] form');
      await modal.waitFor({state:'visible'});
      assert.equal(await modal.locator('[name="Inquiry source"]').inputValue(), '/materials-food-safety');
      assert.equal(await modal.getAttribute('action'), 'https://formsubmit.co/sales@mxpackpro.com');
      const whatsapp = await page.locator('.email-inquiry-dialog[open] [data-whatsapp]').getAttribute('href');
      assert(whatsapp.includes('8615918968149'));
      await page.keyboard.press('Escape');
      await page.locator('main a[href="get-a-quote"]').first().click();
      await page.locator('#quote-form [name="Inquiry source"]').waitFor({state:'attached'});
      assert.equal(await page.locator('#quote-form [name="Inquiry source"]').inputValue(), '/materials-food-safety');
      assert.equal(await page.locator('#quote-form').getAttribute('action'), 'https://formsubmit.co/sales@mxpackpro.com');
      assert.deepEqual(errors, []);
      results.push({width, canonical:true, images:true, faqSchema:true, references:true, modalSource:true, quoteSource:true});
      await context.close();
    }
    assert.equal(transmissions, 0);
    fs.writeFileSync(path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-materials-qa.json`), JSON.stringify({at:new Date().toISOString(), base, passed:true, results, transmissions}, null, 2));
    console.log('PASS: materials guide desktop/mobile content, SEO, images, schema, references and inquiry attribution; 0 messages.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => {console.error(e); server.close(); process.exitCode = 1;});
