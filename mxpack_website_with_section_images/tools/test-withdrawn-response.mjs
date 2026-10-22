import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const code = await fs.readFile(new URL('_worker.js', root), 'utf8');
const {default: worker} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const routes = JSON.parse(await fs.readFile(new URL('_routes.json', root), 'utf8'));
const removed = '/products/custom-christmas-cracker-favor-box';
assert.deepEqual(routes.include, [removed, `${removed}/`, `${removed}.html`]);
const requests = [];
const env = {ASSETS: {fetch: async input => {
  requests.push(input instanceof Request ? input.url : input.href);
  return new Response('<h1>Page not found</h1>', {status: 404});
}}};
for (const path of [...routes.include, `${removed}?source=old-link`]) {
  for (const method of ['GET', 'HEAD', 'POST']) {
    const response = await worker.fetch(new Request(`https://mxpackpro.com${path}`, {method}), env);
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.equal(await response.text(), method === 'HEAD' ? '' : '<h1>Page not found</h1>');
    assert.equal(requests.at(-1), 'https://mxpackpro.com/404.html');
  }
}
const active = 'https://mxpackpro.com/products/bbq-meal-tray-carry-box';
assert.equal((await worker.fetch(new Request(active), env)).status, 404);
assert.equal(requests.at(-1), active);
console.log('PASS: withdrawn variants return 410/no-store; other URLs pass through unchanged.');
