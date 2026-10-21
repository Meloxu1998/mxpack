import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(root, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const entries = urls.map((url) => {
  const pathname = new URL(url).pathname;
  const slug = pathname === '/' ? 'index' : pathname.replace(/^\/|\/$/g, '');
  const file = path.join(root, `${slug}.html`);
  const html = fs.readFileSync(file, 'utf8');
  if (/content=["']noindex/i.test(html)) throw new Error(`Non-indexable sitemap URL: ${url}`);
  // Use recorded page history instead of stamping every URL with the build date.
  const modified = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
    { cwd: root, encoding: 'utf8' }).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(modified)) throw new Error(`No Git date for ${file}`);
  return `  <url><loc>${url}</loc><lastmod>${modified}</lastmod></url>`;
});
fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
console.log(`Refreshed ${urls.length} sitemap entries from recorded page modification dates.`);
