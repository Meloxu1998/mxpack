const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const state = require('../assets/js/url-state.js');
const root = path.resolve(__dirname, '..');
const out = process.env.QA_OUTPUT;
assert(out, 'Set QA_OUTPUT to a private evidence directory.');
fs.mkdirSync(out, {recursive:true});
const products = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-products.json')));
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-taxonomy.json')));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!path.extname(file)) file += '.html';
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return res.writeHead(404).end();
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2'};
  res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'}).end(fs.readFileSync(file));
});
const formData = async locator => {
  await locator.locator('[name="Inquiry source"]').waitFor({state:'attached'});
  return locator.evaluate(form => Object.fromEntries([...form.elements].filter(e => e.name).map(e => [e.name, e.value])));
};
(async () => {
  const {compactInteractionHtml} = await import('./url-state-html.mjs');
  const unit = state.write('https://mxpackpro.com/get-a-quote?product=old&utm_source=buyer&source=catalog#view=lid', {product:'new', from:'/products/new'});
  assert.equal(unit.search, '?utm_source=buyer');
  assert.equal(state.read(unit).get('view'), 'lid');
  assert.equal(state.read(unit).get('product'), 'new');
  assert.equal(state.read('/get-a-quote?product=old#product=new').get('product'), 'new');
  assert.equal(state.write('/products?category=bbq&utm_source=buyer', {category:null}).search, '?utm_source=buyer');
  assert.equal(state.write('/thank-you?request=abc').search, '?request=abc');
  assert.equal(state.read('/products/real-product#product=ignored').has('product'), false);
  const baseline = process.env.QA_BASELINE_COMMIT;
  let unchangedContent = 0;
  for (const url of urls) {
    const page = new URL(url).pathname;
    const file = (page === '/' ? '/index' : page) + '.html';
    const html = fs.readFileSync(path.join(root, '.' + file), 'utf8');
    assert.equal(compactInteractionHtml(html, page), html, `Non-idempotent conversion ${page}`);
    if (baseline) {
      const old = execFileSync('git', ['show', `${baseline}:mxpack_website_with_section_images${file}`], {cwd:root, encoding:'utf8', maxBuffer:2e6});
      assert.equal(compactInteractionHtml(old, page), html, `Unrelated HTML changes ${page}`);
      unchangedContent++;
    }
    for (const match of html.matchAll(/\bhref=['"]([^'"]+)['"]/g)) {
      const target = new URL(match[1].replaceAll('&amp;', '&'), url);
      if (target.origin !== 'https://mxpackpro.com') continue;
      assert(!state.keysFor(target.pathname).some(key => target.searchParams.has(key)), `Crawlable interaction query ${target}`);
    }
  }
  if (baseline) assert.equal(execFileSync('git', ['show', `${baseline}:mxpack_website_with_section_images/sitemap.xml`], {cwd:root, encoding:'utf8'}), sitemap);
  if (!process.env.QA_BASE) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.QA_BASE || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const results = [];
  const assetCache = new Map();
  let transmissions = 0;
  try {
    for (const width of [1440, 390]) {
      console.log(`Checking ${base}, viewport ${width}`);
      const context = await browser.newContext({viewport:{width, height:1000}, isMobile:width === 390, hasTouch:width === 390});
      await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200, body:''}));
      await context.route(/formsubmit\.co|wa\.me|api\.whatsapp\.com/, route => {transmissions++; return route.abort();});
      // Playwright routing disables browser caching; reuse only assets fetched from this deployment.
      await context.route(base + '/assets/**', async route => {
        const url = route.request().url();
        if (!assetCache.has(url)) {
          assetCache.set(url, (async () => {
            const response = await route.fetch();
            return {status:response.status(), headers:response.headers(), body:await response.body()};
          })());
        }
        await route.fulfill(await assetCache.get(url));
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const go = async url => {
        await page.goto('about:blank');
        const response = await page.goto(base + url, {waitUntil:'load'});
        assert.equal(response.status(), 200, url);
        await page.waitForFunction(() => !!window.mxpackUrlState && !!window.mxpackTrack);
      };
      const getQuote = async (url, expected, source) => {
        await page.evaluate(() => sessionStorage.clear());
        await go(url);
        const data = await formData(page.locator('#quote-form'));
        assert.equal(data.Product, expected.name);
        assert.equal(data['Product page'], `https://mxpackpro.com/products/${expected.slug}`);
        if (source) assert.equal(data['Inquiry source'], source);
        assert.equal(await page.locator('#quote-form').getAttribute('action'), 'https://formsubmit.co/sales@mxpackpro.com');
        assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1));
        return data;
      };
      await go('/products');
      for (const category of taxonomy.categories) {
        await go('/products#category=' + category.id);
        const actual = await page.locator('[data-catalog-category]:visible').evaluateAll(cards => cards.map(c => c.dataset.productId).sort());
        assert.deepEqual(actual, [...category.members].sort(), category.id);
      }
      for (const [alias, id] of Object.entries(taxonomy.aliases)) {
        await go('/products?category=' + alias);
        assert.equal(await page.locator('[data-catalog-filter][aria-pressed="true"]').getAttribute('data-catalog-filter'), id);
      }
      await go('/products?category=bbq&utm_source=legacy');
      const choose = async id => {
        if (width === 390) await page.locator('[data-catalog-select]').selectOption(id);
        else await page.locator(`[data-catalog-filter="${id}"]`).click();
      };
      await choose('gift-boxes');
      assert.equal(new URL(page.url()).search, '?utm_source=legacy');
      assert.equal(state.read(page.url()).get('category'), 'gift-boxes');
      await choose('cake-boxes');
      await page.goBack();
      assert.equal(await page.locator('[data-catalog-filter][aria-pressed="true"]').getAttribute('data-catalog-filter'), 'gift-boxes');
      await page.goForward();
      assert.equal(await page.locator('[data-catalog-filter][aria-pressed="true"]').getAttribute('data-catalog-filter'), 'cake-boxes');
      await page.evaluate(() => {location.hash = 'category=bbq';});
      await page.waitForFunction(() => document.querySelector('[data-catalog-filter="bbq"]').getAttribute('aria-pressed') === 'true');
      await choose('all');
      assert.equal(new URL(page.url()).hash, '');
      await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-catalog-${width}.png`)});
      for (const product of products) {
        await getQuote('/get-a-quote#' + new URLSearchParams({product:product.slug, source:'product-detail', from:'/products/' + product.slug}), product, '/products/' + product.slug);
      }
      const sample = products.find(p => p.views?.length);
      assert(sample, 'Reference gallery product required.');
      const legacy = await getQuote('/get-a-quote?' + new URLSearchParams({product:sample.slug, view:sample.views[1].id, source:'product-detail', utm_source:'legacy', utm_medium:'email'}), sample);
      assert.equal(legacy['Packaging reference view'], sample.views[1].label);
      assert.equal(legacy.utm_source, 'legacy');
      assert.equal(legacy.utm_medium, 'email');
      const modern = await getQuote('/get-a-quote?utm_source=modern#' + new URLSearchParams({product:sample.slug, view:sample.views[1].id, from:'/bbq-meal-packaging-buying-guide', source:'guide'}), sample, '/bbq-meal-packaging-buying-guide');
      assert.equal(modern['Packaging reference view'], sample.views[1].label);
      assert.equal(modern.utm_source, 'modern');
      const invalid = await getQuote('/get-a-quote#product=' + sample.slug + '&view=toString&from=https%3A%2F%2Fevil.example', sample);
      assert(!invalid['Packaging reference view']);
      assert(!invalid['Inquiry source'].includes('evil'));
      for (const separator of ['?', '#']) {
        for (const id of ['bakery-cake-boxes','burger-boxes','custom-paper-bags','paper-cups','pizza-boxes','takeaway-food-boxes']) {
          await go('/get-a-quote' + separator + 'category=' + id);
          assert.equal((await formData(page.locator('#quote-form')))['Category page'], 'https://mxpackpro.com/' + id);
        }
        await go('/get-a-quote' + separator + 'product=pizza-boxes');
        assert.equal((await formData(page.locator('#quote-form')))['Packaging category'], 'Custom pizza boxes');
        for (const id of ['restaurants','catering','food-brands','startups','enterprise']) {
          await go('/get-a-quote' + separator + 'solution=' + id);
          assert((await formData(page.locator('#quote-form')))['Business type']);
        }
        await go('/get-a-quote' + separator + 'occasion=christmas');
        assert((await formData(page.locator('#quote-form')))['Seasonal project'].includes('Christmas'));
      }
      await go('/products/' + sample.slug);
      await page.locator('[data-reference-id]').nth(1).click();
      const link = page.locator('main a[href*="get-a-quote"]').first();
      const href = await link.getAttribute('href');
      assert.equal(new URL(href, base).search, '');
      assert.equal(state.read(href).get('view'), sample.views[1].id);
      const whatsapp = new URL(await page.locator('[data-whatsapp]').first().getAttribute('href'));
      assert(whatsapp.pathname === '/8615918968149' || whatsapp.searchParams.get('phone') === '8615918968149');
      assert(whatsapp.searchParams.get('text').includes(sample.views[1].label));
      await page.locator(width === 390 ? '.mobile-contact-email' : '.floating-contact .mail').click();
      const modal = page.locator('.email-inquiry-dialog[open]');
      const modalData = await formData(modal.locator('form'));
      assert.equal(modalData.Product, sample.name);
      assert.equal(modalData['Inquiry source'], '/products/' + sample.slug);
      assert.equal(await modal.locator('form').getAttribute('action'), 'https://formsubmit.co/sales@mxpackpro.com');
      await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-email-${width}.png`)});
      await page.keyboard.press('Escape');
      await link.click();
      assert.equal((await formData(page.locator('#quote-form')))['Packaging reference view'], sample.views[1].label);
      await page.locator('#quote-form').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-quote-${width}.png`)});
      await go('/bbq-meal-packaging-buying-guide');
      await page.locator('[data-track="quote_guide_click"]').first().click();
      assert.equal((await formData(page.locator('#quote-form')))['Inquiry source'], '/bbq-meal-packaging-buying-guide');
      await go('/christmas-packaging');
      await page.locator('[data-catalog-filter]').nth(1).click();
      assert.equal(new URL(page.url()).search, '');
      assert(new URL(page.url()).hash.startsWith('#category='));
      await go('/get-a-quote#product=' + products[0].slug);
      await page.evaluate(slug => {location.hash = 'product=' + slug;}, products[1].slug);
      await page.waitForFunction(name => document.querySelector('#quote-form [name="Product"]')?.value === name, products[1].name);
      assert.deepEqual(errors, []);
      results.push({width, products:products.length, categories:taxonomy.categories.length, legacyAliases:Object.keys(taxonomy.aliases).length, legacyAndFragmentPrefills:true, referenceView:true, modal:true, sourceAndUtm:true, history:true});
      await context.close();
    }
    const noStorage = await browser.newContext();
    await noStorage.route(/googletagmanager\.com|google-analytics\.com/, r => r.fulfill({status:200, body:''}));
    await noStorage.addInitScript(() => Object.defineProperty(window, 'sessionStorage', {get() {throw new Error('Storage unavailable');}}));
    const page = await noStorage.newPage();
    await page.goto(base + '/get-a-quote#product=' + products[0].slug + '&from=%2Fproducts', {waitUntil:'load'});
    const data = await formData(page.locator('#quote-form'));
    assert.equal(data.Product, products[0].name);
    assert.equal(data['Inquiry source'], '/products');
    await noStorage.close();
    assert.equal(transmissions, 0);
    fs.writeFileSync(path.join(out, `${process.env.QA_BASE ? 'live' : 'local'}-interaction-qa.json`), JSON.stringify({at:new Date().toISOString(), base, passed:true, formalPages:urls.length, unchangedContent, sitemapUnchanged:true, results, storageUnavailable:true, transmissions}, null, 2));
    console.log('PASS: interaction state, legacy links, all products/categories, attribution and desktop/mobile; 0 messages.');
  } finally { await browser.close(); server.close(); }
})().catch(error => {console.error(error); server.close(); process.exitCode = 1;});
