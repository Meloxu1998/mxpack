import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const legacy = ['/quality-control', '/sushi-boxes', '/grazing-catering-boxes', '/mailer-shipping-boxes'];
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#')).map((line) => line.split(/\s+/)[0]);
const oldHtml = urls.map((url) => new URL(url).pathname).map((slug) => slug === '/' ? '/index.html' : `${slug}.html`);
const targets = [...new Set([...urls, ...[...legacy, ...redirects, ...oldHtml].map((slug) => `https://mxpackpro.com${slug}`),
  'https://mxpackpro.com/robots.txt', 'https://mxpackpro.com/sitemap.xml',
  'https://mxpackpro.com/thank-you', 'https://mxpackpro.com/seo-audit-missing-page',
  'http://mxpackpro.com/', 'https://www.mxpackpro.com/'])];
const rows = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < targets.length) {
    const url = targets[cursor++];
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
      const html = await response.text();
      const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1] || '';
      const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] || '';
      rows.push({ url, status: response.status, location: response.headers.get('location'),
        canonical, robots, xRobots: response.headers.get('x-robots-tag'),
        title: html.match(/<title>(.*?)<\/title>/is)?.[1] || '',
        h1: (html.match(/<h1(?:\s|>)/gi) || []).length,
        contentType: response.headers.get('content-type'), bytes: Buffer.byteLength(html),
        error: urls.includes(url)
          ? response.status !== 200 || canonical !== url || /noindex/i.test(`${robots} ${response.headers.get('x-robots-tag') || ''}`)
          : [...redirects, ...oldHtml].includes(new URL(url).pathname) && ![301, 308].includes(response.status) });
    } catch (error) {
      rows.push({ url, error: String(error) });
    }
  }
}));
rows.sort((a, b) => targets.indexOf(a.url) - targets.indexOf(b.url));
const report = { checkedAt: new Date().toISOString(), checked: rows.length,
  failures: rows.filter((row) => row.error).length, rows };
if (process.argv.includes('--write')) {
  const reportPath = path.join(root, 'seo-system', 'reports', `${report.checkedAt.slice(0, 10)}-live-urls.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(process.argv.includes('--summary')
  ? { checkedAt: report.checkedAt, checked: report.checked, failures: report.failures,
      errors: rows.filter((row) => row.error) } : report, null, 2));
if (rows.some((row) => row.error)) process.exitCode = 1;
