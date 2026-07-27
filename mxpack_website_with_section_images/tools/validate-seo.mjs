import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const errors = [];

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const slug = pathname === '/' ? 'index' : pathname.replace(/^\/|\/$/g, '');
  const file = path.join(root, `${slug}.html`);

  if (!fs.existsSync(file)) {
    errors.push(`${url}: file missing`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  const robots = html.match(/<meta name=['"]robots['"] content=['"]([^'"]+)/)?.[1] || '';
  const canonical = html.match(/rel=['"]canonical['"] href=['"]([^'"]+)/)?.[1] || '';
  const placeholders = html.match(/PRODUCT PAGE FRAMEWORK|SECOND-LEVEL PAGE|View framework|This framework|Real content will replace/gi) || [];

  if (h1Count !== 1) errors.push(`${url}: expected one H1, found ${h1Count}`);
  if (!robots.includes('index') || robots.startsWith('noindex')) errors.push(`${url}: robots is "${robots}"`);
  if (!canonical) errors.push(`${url}: canonical missing`);
  if (placeholders.length) errors.push(`${url}: ${placeholders.length} placeholder phrases`);

  for (const match of html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>(.*?)<\/script>/gs)) {
    try {
      JSON.parse(match[1]);
    } catch {
      errors.push(`${url}: invalid JSON-LD`);
    }
  }

  for (const match of html.matchAll(/(?:src|href)=['"]([^'"]+)['"]/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|#|\/)/.test(reference)) continue;
    const localPath = reference.split(/[?#]/)[0];
    if (!localPath) continue;
    const target = path.join(root, localPath);
    if (!fs.existsSync(target) && !fs.existsSync(`${target}.html`)) {
      errors.push(`${url}: missing local reference ${reference}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${urls.length} sitemap pages: H1, robots, canonical, JSON-LD and local references.`);
