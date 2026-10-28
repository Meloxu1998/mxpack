import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {createRequire} from 'node:module';
const urlState = createRequire(import.meta.url)('../assets/js/url-state.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const errors = [];
const documents = new Map();

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const slug = pathname === '/' ? 'index' : pathname.replace(/^\/|\/$/g, '');
  const file = path.join(root, `${slug}.html`);

  if (!fs.existsSync(file)) {
    errors.push(`${url}: file missing`);
    continue;
  }

  const html = fs.readFileSync(file, 'utf8');
  documents.set(url, html);
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  const robots = html.match(/<meta name=['"]robots['"] content=['"]([^'"]+)/)?.[1] || '';
  const canonical = html.match(/rel=['"]canonical['"] href=['"]([^'"]+)/)?.[1] || '';
  const placeholders = html.match(/PRODUCT PAGE FRAMEWORK|SECOND-LEVEL PAGE|View framework|This framework|Real content will replace/gi) || [];

  if (h1Count !== 1) errors.push(`${url}: expected one H1, found ${h1Count}`);
  if (!robots.includes('index') || robots.startsWith('noindex')) errors.push(`${url}: robots is "${robots}"`);
  if (canonical !== url) errors.push(`${url}: canonical must equal the sitemap URL, found "${canonical}"`);
  if (placeholders.length) errors.push(`${url}: ${placeholders.length} placeholder phrases`);

  for (const match of html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>(.*?)<\/script>/gs)) {
    try {
      const schema = JSON.parse(match[1]);
      const checkSchema = (node) => {
        if (!node || typeof node !== 'object') return;
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (types.includes('Product') && !node.offers && !node.review && !node.aggregateRating) {
          errors.push(`${url}: Product markup is missing offers, review or aggregateRating; use page markup for unpriced category pages`);
        }
        for (const child of Object.values(node)) {
          if (Array.isArray(child)) child.forEach(checkSchema);
          else if (child && typeof child === 'object') checkSchema(child);
        }
      };
      checkSchema(schema);
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

const links = new Map();
for (const [url, html] of documents) {
  const destinations = [];
  for (const match of html.matchAll(/<a\b[^>]*href=['"]([^'"]+)['"]/gi)) {
    const target = new URL(match[1].replace(/&amp;/g, '&'), url);
    if (target.origin !== new URL(url).origin) continue;
    const canonical = `${target.origin}${target.pathname}`;
    if (documents.has(canonical)) {
      destinations.push(canonical);
      const id = decodeURIComponent(target.hash.slice(1));
      const interactionState = urlState.keysFor(target.pathname).length && id.includes('=')
        && [...new URLSearchParams(target.hash.slice(1)).keys()].every(key => urlState.keysFor(target.pathname).includes(key));
      if (id && !interactionState && !documents.get(canonical).includes(`id="${id}"`) && !documents.get(canonical).includes(`id='${id}'`)) {
        errors.push(`${url}: missing anchor ${target.href}`);
      }
    } else if (!target.pathname.startsWith('/assets/') && !target.pathname.endsWith('.xml')) {
      errors.push(`${url}: internal page link is not in the canonical sitemap: ${target.href}`);
    }
  }
  links.set(url, destinations);
}
const reached = new Set();
const queue = ['https://mxpackpro.com/'];
while (queue.length) {
  const url = queue.shift();
  if (reached.has(url)) continue;
  reached.add(url);
  queue.push(...(links.get(url) || []));
}
for (const url of urls) {
  if (!reached.has(url)) errors.push(`${url}: not reachable from homepage links`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${urls.length} sitemap pages: H1, robots, canonical, JSON-LD, local references, internal anchors and homepage reachability.`);
