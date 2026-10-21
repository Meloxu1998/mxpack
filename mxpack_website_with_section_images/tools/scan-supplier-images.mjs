import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');
const input = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const categories = new Set(['BURGER BOX', 'TAKE AWAY FOOD BOX', 'MACARON&CHOCOLATE']);
const products = [...new Map(input.filter(p => categories.has(p.category))
  .flatMap(p => p.products.slice(4)).map(p => [p.id, p])).values()];
const cells = [];
let cursor = 0;
await Promise.all(Array.from({length: 6}, async () => {
  while (cursor < products.length) {
    const i = cursor++;
    const product = products[i];
    const r = await fetch(product.image, {signal: AbortSignal.timeout(30000)});
    if (!r.ok) throw new Error(`Cannot read ${product.id}`);
    const image = await sharp(Buffer.from(await r.arrayBuffer())).resize(240,240,
      {fit:'contain', background:'#fff'}).webp().toBuffer();
    const label = Buffer.from(`<svg width="240" height="30"><rect width="240" height="30" fill="white"/><text x="5" y="22" font-size="14" font-family="Arial">${i+1}. ${product.id}</text></svg>`);
    cells.push({input:image,left:i%6*248,top:Math.floor(i/6)*278},
      {input:label,left:i%6*248,top:Math.floor(i/6)*278+240});
  }
}));
await sharp({create:{width:1488,height:Math.ceil(products.length/6)*278,channels:3,background:'#e4e9e6'}})
  .composite(cells).png().toFile(process.argv[3]);
console.log(`${products.length} candidate images checked`);
