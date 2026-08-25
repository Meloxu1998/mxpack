import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ? path.resolve(projectRoot, process.argv[2]) : path.join(projectRoot, 'dist');
let files = (await readdir(root)).filter((file) => file.endsWith('.html'));
try {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  files = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/?([^<]*)<\/loc>/g)]
    .map((match) => match[1] || 'index.html')
    .map((file) => file.endsWith('.html') ? file : `${file.replace(/\/$/, '')}.html`);
} catch {
  // Fall back to every HTML file when a sitemap is not present.
}
const issues = [];
const titles = new Map();
const canonicals = new Map();
const headings = new Map();

for (const file of files) {
  const html = await readFile(path.join(root, file), 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]?.trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!title || title.length < 20 || title.length > 70) issues.push(`${file}: title length ${title?.length || 0}`);
  if (!description || description.length < 80 || description.length > 170) issues.push(`${file}: description length ${description?.length || 0}`);
  if (!canonical) issues.push(`${file}: missing canonical`);
  if (h1Count !== 1) issues.push(`${file}: expected one H1, found ${h1Count}`);
  if (/noindex/i.test(html)) issues.push(`${file}: contains noindex`);
  if (titles.has(title)) issues.push(`${file}: duplicate title with ${titles.get(title)}`); else titles.set(title, file);
  if (canonicals.has(canonical)) issues.push(`${file}: duplicate canonical with ${canonicals.get(canonical)}`); else canonicals.set(canonical, file);
  if (headings.has(h1)) issues.push(`${file}: duplicate H1 with ${headings.get(h1)}`); else headings.set(h1, file);

  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*(?:href|src)="([^"]+)"/gi)) {
    const url = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/i.test(url)) continue;
    const clean = decodeURIComponent(url.split(/[?#]/)[0]);
    if (!clean) continue;
    try {
      await stat(path.join(root, clean));
    } catch {
      try { await stat(path.join(root, `${clean}.html`)); } catch { issues.push(`${file}: missing local target ${url}`); }
    }
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { issues.push(`${file}: invalid JSON-LD (${error.message})`); }
  }
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`QA passed: ${files.length} HTML pages, unique metadata, valid JSON-LD and no missing local links.`);
}
