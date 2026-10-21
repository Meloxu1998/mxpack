import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('Pass the captured supplier catalog JSON path.');
const products = JSON.parse(await fs.readFile(input, 'utf8'));
if (products.length !== 20 || new Set(products.map(p => p.id)).size !== 20) {
  throw new Error('Expected 20 distinct, selected supplier product IDs.');
}
const imageDir = path.join(root, 'assets', 'img', 'catalog');
const dataDir = path.join(root, 'seo-system', 'data');
await fs.mkdir(imageDir, { recursive: true });
await fs.mkdir(dataDir, { recursive: true });
let cursor = 0;
await Promise.all(Array.from({length: 4}, async () => {
  while (cursor < products.length) {
    const product = products[cursor++];
    const source = new URL(product.image);
    if (!source.hostname.endsWith('.alicdn.com')) throw new Error(`Unexpected image host: ${source.hostname}`);
    const response = await fetch(source, {signal: AbortSignal.timeout(45000)});
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`Image unavailable: ${product.id} (${response.status})`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const original = await sharp(bytes).metadata();
    for (const width of [480, 960]) {
      await sharp(bytes).rotate().resize({width, withoutEnlargement: true})
        .webp({quality: 86}).toFile(path.join(imageDir, `${product.id}-${width}.webp`));
    }
    product.width = original.width;
    product.height = original.height;
    product.imagePath = `/assets/img/catalog/${product.id}-960.webp`;
    product.thumbnailPath = `/assets/img/catalog/${product.id}-480.webp`;
    product.minimumOrder = Number(product.moq.match(/\d+/)?.[0]);
    console.log(`${product.id}: ${original.width}x${original.height}; MOQ ${product.minimumOrder}`);
  }
}));
await fs.writeFile(path.join(dataDir, 'catalog-provenance.json'), `${JSON.stringify({
  capturedAt: new Date().toISOString(), store: 'https://meloxu.en.alibaba.com/',
  verification: 'Public store category and product listing cards; detailed specifications require project confirmation.',
  products
}, null, 2)}\n`);
