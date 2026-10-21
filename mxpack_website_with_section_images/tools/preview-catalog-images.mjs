import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {products} = JSON.parse(fs.readFileSync(path.join(root, 'seo-system/data/catalog-provenance.json'), 'utf8'));
const cells = [];
for (const [i, product] of products.entries()) {
  const buffer = await sharp(path.join(root, product.thumbnailPath)).resize(240, 240,
    {fit: 'contain', background: '#ffffff'}).toBuffer();
  const label = Buffer.from(`<svg width="240" height="32"><rect width="240" height="32" fill="white"/><text x="8" y="22" font-size="15" font-family="Arial">${i + 1}. ${product.id}</text></svg>`);
  cells.push({input: buffer, left: (i % 5) * 248, top: Math.floor(i / 5) * 280});
  cells.push({input: label, left: (i % 5) * 248, top: Math.floor(i / 5) * 280 + 240});
}
const output = process.argv[2];
if (!output) throw new Error('Pass a PNG output path.');
await sharp({create: {width: 1240, height: 1120, channels: 3, background: '#e4e9e6'}})
  .composite(cells).png().toFile(output);
console.log(output);
