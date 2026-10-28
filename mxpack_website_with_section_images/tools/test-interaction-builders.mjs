import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compactInteractionHtml} from './url-state-html.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert(process.env.QA_OUTPUT, 'Set QA_OUTPUT to a private evidence directory.');
fs.mkdirSync(process.env.QA_OUTPUT, {recursive:true});
const fixture = fs.mkdtempSync(path.join(process.env.QA_OUTPUT, 'builder-fixture-'));
for (const dir of ['tools', 'seo-system/data']) fs.cpSync(path.join(root, dir), path.join(fixture, dir), {recursive:true});
for (const dir of ['', 'products']) {
  fs.mkdirSync(path.join(fixture, dir), {recursive:true});
  for (const file of fs.readdirSync(path.join(root, dir)).filter(f => /\.(html|xml)$/.test(f))) fs.copyFileSync(path.join(root, dir, file), path.join(fixture, dir, file));
}
fs.mkdirSync(path.join(fixture, 'assets/js'), {recursive:true});
fs.copyFileSync(path.join(root, 'assets/js/url-state.js'), path.join(fixture, 'assets/js/url-state.js'));
const checks = [
  ['build-supplier-products.mjs', '--products-only=custom-pyramid-catering-box'],
  ['sync-catalog-taxonomy.mjs'],
  ['build-christmas-collection.mjs'],
  ['build-custom-service.mjs'],
  ['update-buyer-journey.mjs', '--guide=materials-food-safety'],
  ['build-procurement-guides.mjs', '--preview-dir=' + path.join(fixture, 'previews')]
];
for (const args of checks) {
  const log = execFileSync(process.execPath, ['tools/' + args[0], ...args.slice(1)], {cwd:fixture, encoding:'utf8'});
  fs.appendFileSync(path.join(fixture, 'builder-log.txt'), args.join(' ') + '\n' + log);
}
let pages = 0;
for (const dir of ['', 'products', 'previews']) {
  for (const file of fs.readdirSync(path.join(fixture, dir)).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(fixture, dir, file), 'utf8');
    const page = file === 'index.html' ? '/' : '/' + (dir === 'previews' ? '' : dir ? dir + '/' : '') + file.replace(/\.html$/, '');
    assert.equal(compactInteractionHtml(html, page), html, `Builder reintroduced uncompacted links/runtime: ${dir}/${file}`);
    pages++;
  }
}
fs.writeFileSync(path.join(process.env.QA_OUTPUT, 'builder-qa.json'), JSON.stringify({passed:true, at:new Date().toISOString(), fixture, builders:checks.map(c => c[0]), pages}, null, 2));
console.log(`PASS: ${checks.length} builders, ${pages} generated/preserved pages; all writes stayed in ${fixture}`);
