import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {interactionVersion} from './url-state-html.mjs';
const state = createRequire(import.meta.url)('../assets/js/url-state.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.QA_OUTPUT;
assert(out, 'Set QA_OUTPUT to a private evidence directory.');
const base = process.env.QA_BASE || 'https://mxpackpro.com';
const normalize = text => text.replace(/\r\n/g, '\n');
const assets = [];
for (const name of ['url-state', 'inquiry-analytics', 'products-catalog-v2', 'product-reference-gallery']) {
  const response = await fetch(`${base}/assets/js/${name}.js?v=${interactionVersion}`);
  assert.equal(response.status, 200, name);
  assert.equal(normalize(await response.text()), normalize(fs.readFileSync(path.join(root, `assets/js/${name}.js`), 'utf8')), `Wrong asset body ${name}`);
  assets.push({name, status:200, currentBody:true});
}
const pages = [];
if (!process.argv.includes('--assets-only')) {
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  assert.equal(normalize(sitemap), normalize(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8')));
  const queue = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  await Promise.all(Array.from({length:5}, async () => {
    while (queue.length) {
      const url = queue.shift();
      const response = await fetch(url, {redirect:'manual'});
      assert.equal(response.status, 200, url);
      assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''));
      const html = await response.text();
      const page = new URL(url).pathname;
      const file = (page === '/' ? '/index' : page) + '.html';
      assert.equal(normalize(html), normalize(fs.readFileSync(path.join(root, '.' + file), 'utf8')), `Live HTML differs ${url}`);
      assert.equal(html.match(/rel=['"]canonical['"] href=['"]([^'"]+)/)?.[1], url);
      assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
      assert(!/noindex/i.test(html.match(/<meta name=['"]robots['"] content=['"]([^'"]+)/)?.[1] || ''));
      for (const match of html.matchAll(/\bhref=['"]([^'"]+)['"]/g)) {
        const target = new URL(match[1].replaceAll('&amp;', '&'), url);
        if (target.origin === new URL(base).origin) assert(!state.keysFor(target.pathname).some(key => target.searchParams.has(key)), `Old query link ${url}: ${target}`);
      }
      pages.push({url, status:200, canonical:true, currentBody:true, noInteractionQueryLinks:true});
    }
  }));
  for (const suffix of ['', '/', '.html']) {
    const response = await fetch(base + '/products/custom-christmas-cracker-favor-box' + suffix, {redirect:'manual'});
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  for (const url of ['/products?category=gifts', '/get-a-quote?product=custom-pyramid-catering-box&view=white-board']) {
    const response = await fetch(base + url, {redirect:'manual'});
    assert.equal(response.status, 200, `Legacy URL ${url}`);
  }
}
fs.mkdirSync(out, {recursive:true});
fs.writeFileSync(path.join(out, process.argv.includes('--assets-only') ? 'asset-predeployment.json' : 'live-http-audit.json'), JSON.stringify({at:new Date().toISOString(), base, passed:true, version:interactionVersion, assets, pages:pages.sort((a,b) => a.url.localeCompare(b.url))}, null, 2));
console.log(`PASS: ${assets.length} versioned assets${pages.length ? ', ' + pages.length + ' live pages, legacy URLs and withdrawn 410 routes' : ''}.`);
