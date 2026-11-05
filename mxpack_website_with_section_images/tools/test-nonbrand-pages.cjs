const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const root = process.cwd();
const map = JSON.parse(fs.readFileSync('seo-system/data/nonbrand-landing-map.json', 'utf8'));
const out = process.env.QA_OUTPUT || 'D:/mxpack-audits/2026-11-04/nonbrand-growth/qa';
const source = JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json', 'utf8'));
const state = require('../assets/js/url-state.js');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!path.extname(file)) file += '.html';
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webp':'image/webp'};
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'}).end(fs.readFileSync(file));
});
(async () => {
  if (!process.env.QA_BASE) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.QA_BASE || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'chrome', headless:true});
  fs.mkdirSync(out, {recursive:true});
  const results = []; let posts = 0;
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({viewport:{width,height:width === 390 ? 844 : 1000},isMobile:width === 390,hasTouch:width === 390});
      await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200,body:''}));
      await context.route(/\/api\/inquiry(?:\?|$)|^https:\/\/formsubmit\.co\//, route => { posts++; return route.abort(); });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const item of map.pages) {
        const response = await page.goto(base + item.path, {waitUntil:'networkidle'});
        assert.equal(response.status(), 200);
        const product = source.find(p => item.path.endsWith('/' + p.slug));
        const selector = product ? '[data-buyer-selection]' : '[data-burger-buying-brief]';
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mxpackpro.com' + item.path);
        assert(!(await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
        const faq = await page.locator('.accordion details').evaluateAll(nodes => nodes.map(node => ({q:node.querySelector('summary').textContent.trim(),a:node.querySelector('p').textContent.trim()})));
        const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).find(data => data['@type'] === 'FAQPage'));
        assert.equal(faq.length, 6);
        assert.deepEqual(faq, schema.mainEntity.map(question => ({q:question.name,a:question.acceptedAnswer.text})));
        assert.equal(await page.locator(selector + ' tbody tr').count(), product ? 4 : 3);
        if (!product || ['custom-burger-clamshell-box', 'corn-dog-paper-sleeve'].includes(product.slug)) {
          const brief = page.locator('[data-export-brief]');
          assert.equal(await brief.count(), 1);
          assert.equal(await brief.locator('li').count(), 3);
          const text = await brief.innerText();
          assert(/North America|North American|United States/.test(text));
          assert(/Middle East|Middle Eastern/.test(text));
          assert(/millimetres|inches|stated unit/.test(text));
          assert.equal(await brief.locator('form').count(), 0);
          await brief.scrollIntoViewIfNeeded();
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          await brief.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-${width}-${item.path.split('/').pop()}-destination.png`)});
        }
        if (product?.slug === 'custom-folding-cosmetic-carton') {
          const specifications = await page.locator('#specifications').innerText();
          assert(specifications.includes('secondary outer packaging'));
          assert(!specifications.includes('Food-contact suitability'));
          assert.equal(await page.locator('#specifications a[href="/custom-packaging"]').count(), 1);
        }
        assert(await page.locator('.detail-hero img').first().evaluate(node => node.complete && node.naturalWidth > 0));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const local = fs.readFileSync(path.join(root, '.' + item.path + '.html'), 'utf8');
        const previous = execFileSync('git', ['show', `6ae94ce:mxpack_website_with_section_images${item.path}.html`], {cwd:path.resolve(root,'..'),encoding:'utf8'});
        for (const tag of ['header', 'footer']) {
          const section = text => text.match(new RegExp(`<${tag} class="site-${tag}">[\\s\\S]*?<\\/${tag}>`))?.[0]?.replace(/Browse all \d+ products/g, 'Browse all [catalog count] products');
          if (tag === 'header') assert(local.includes(`Browse all ${source.length} products`));
          assert.equal(section(local), section(previous), `${item.path} changed the ${tag}`);
        }
        for (const oldSection of previous.matchAll(/<section\b(?=[^>]*\bdata-supplier-batch=)[^>]*>[\s\S]*?<\/section>/g)) assert(local.includes(oldSection[0]), 'Existing supplier backlink lost');
        await page.locator(selector).scrollIntoViewIfNeeded();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator(selector).screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-${width}-${item.path.split('/').pop()}.png`)});
        await page.locator(width === 390 ? '.mobile-contact-email' : '.floating-contact .mail').click();
        const form = page.locator('.email-inquiry-dialog[open] form');
        await form.locator('[name="Inquiry source"]').waitFor({state:'attached'});
        assert.equal(await form.getAttribute('action'), '/api/inquiry');
        assert.equal(await form.locator('[name="Inquiry source"]').inputValue(), item.path);
        if (product) assert.equal(await form.locator('[name="Product page"]').inputValue(), 'https://mxpackpro.com' + item.path);
        else assert.equal(await form.locator('[name="Packaging category"]').inputValue(), 'Burger boxes');
        assert((await page.locator('.email-inquiry-dialog [data-whatsapp]').getAttribute('href')).includes('8615918968149'));
        await page.keyboard.press('Escape');
        const cta = product ? page.locator('main [data-track="quote_product_click"]').first() : page.locator('.detail-hero a[href*="get-a-quote"]');
        await cta.click();
        await page.locator('#quote-form [name="Inquiry source"]').waitFor({state:'attached'});
        assert.equal(await page.locator('#quote-form').getAttribute('action'), '/api/inquiry');
        assert.equal(await page.locator('#quote-form [name="Inquiry source"]').inputValue(), item.path);
        if (product) assert.equal(state.read(page.url()).get('product'), product.slug);
        else assert.equal(state.read(page.url()).get('category'), 'burger-boxes');
        results.push({width,path:item.path,faqMatches:true,buyerBrief:true,imageLoaded:true,noOverflow:true,existingLinksPreserved:true,inquirySourcePreserved:true});
      }
      assert.deepEqual(errors, []); await context.close();
    }
    assert.equal(posts, 0);
    fs.writeFileSync(path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-qa.json`), JSON.stringify({passed:true,base,results,posts}, null, 2));
    console.log(`PASS: ${results.length} desktop/mobile buyer pages, matching FAQ/schema, tables, original shell/backlinks, images, source attribution and unchanged receiver; zero messages.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
