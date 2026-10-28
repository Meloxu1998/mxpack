import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const out = process.argv[2];
assert(out, 'Provide the private directory containing the browser-read GSC reports.');
const groups = ['alternate-143', 'redirects', 'noindex', 'crawled', 'discovered'];
const tasks = [];
for (const group of groups) {
  const rows = JSON.parse(await fs.readFile(path.join(out, group + '.json'), 'utf8'));
  for (const row of rows) tasks.push({group, url:row[0].split('\n')[0], reportedCrawl:row[1]});
}
const results = [];
let cursor = 0;
async function check(task) {
  const chain = [];
  let url = task.url;
  try {
    for (let i = 0; i < 6; i++) {
      const target = new URL(url);
      assert(['mxpackpro.com', 'www.mxpackpro.com'].includes(target.hostname));
      target.hash = '';
      const r = await fetch(target, {redirect:'manual', signal:AbortSignal.timeout(20000)});
      const location = r.headers.get('location');
      chain.push({url:target.href, status:r.status, location});
      if (r.status >= 300 && r.status < 400 && location) {
        await r.body?.cancel();
        url = new URL(location, target).href;
        continue;
      }
      const body = await r.text();
      const canonical = body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1] || null;
      const noindex = /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(body) || /noindex/i.test(r.headers.get('x-robots-tag') || '');
      const expectedCanonical = task.group === 'alternate-143' ? `https://mxpackpro.com${new URL(task.url).pathname}` : null;
      return {...task, chain, status:r.status, canonical, noindex,
        alternateCorrect:expectedCanonical ? r.status === 200 && canonical === expectedCanonical && !noindex : undefined};
    }
    throw new Error('Redirect limit exceeded');
  } catch (error) {
    return {...task, chain, error:error.message};
  }
}
await Promise.all(Array.from({length:4}, async () => {
  while (cursor < tasks.length) results.push(await check(tasks[cursor++]));
}));
results.sort((a, b) => a.url.localeCompare(b.url));
const failures = results.filter(r => r.error || r.status !== 200 || r.alternateCorrect === false || r.noindex);
const summary = {at:new Date().toISOString(), reportedExclusions:tasks.length, checked:results.length,
  alternateChecked:results.filter(r => r.group === 'alternate-143').length,
  alternateCorrect:results.filter(r => r.alternateCorrect).length, failures, results};
await fs.writeFile(path.join(out, 'exclusion-http-audit.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({checked:summary.checked, alternateCorrect:summary.alternateCorrect, failures}, null, 2));
if (failures.length) process.exitCode = 1;
