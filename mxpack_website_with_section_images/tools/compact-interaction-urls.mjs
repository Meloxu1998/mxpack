import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compactInteractionHtml, compactInteractionLink} from './url-state-html.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [...fs.readdirSync(root).filter(f => f.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'products')).filter(f => f.endsWith('.html')).map(f => 'products/' + f)];
let count = 0;
for (const file of files) {
  const absolute = path.join(root, file);
  const original = fs.readFileSync(absolute, 'utf8');
  const page = file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '');
  const next = compactInteractionHtml(original, page);
  if (next !== original) { fs.writeFileSync(absolute, next); count++; }
}
const file = path.join(root, 'seo-system/data/site-navigation.json');
const navigation = JSON.parse(fs.readFileSync(file, 'utf8'));
const visit = nodes => nodes.forEach(node => {
  if (node.url) node.url = compactInteractionLink(node.url, '/');
  if (node.children) visit(node.children);
});
visit(navigation);
fs.writeFileSync(file, JSON.stringify(navigation, null, 2) + '\n');
console.log(`Compacted interaction links and runtime references in ${count} HTML files; canonical URLs and sitemap unchanged.`);
