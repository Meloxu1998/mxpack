const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const data = path.join(root, 'seo-system/data');
const additions = JSON.parse(fs.readFileSync(process.argv[2] ? path.resolve(process.argv[2]) : path.join(data,'gift-catalog-20261021.json'),'utf8'));
const generated = 'C:/Users/Administrator/.codex/generated_images/019f3b1e-70a2-7783-99c7-135bfac61fad';
(async () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(data, 'catalog-products.json'), 'utf8'));
  const provenance = JSON.parse(fs.readFileSync(path.join(data, 'catalog-provenance.json'), 'utf8'));
  const imageDir = path.join(root, 'assets/img/catalog');
  const review = process.argv[3] || 'D:/mxpack-audits/2026-10-21/gift-catalog';
  fs.mkdirSync(review, {recursive:true});
  const cells = [];
  for (const entry of additions) {
    const {referenceUrl, assetKey, generatedFile, approval, ...product} = entry;
    const input = path.join(generated, generatedFile);
    if (!fs.existsSync(input)) throw Error('Missing generated image ' + input);
    const collision = catalog.find(p => p.dedupGroup === product.dedupGroup && p.slug !== product.slug);
    if (collision) throw Error('Repeated structural family ' + collision.slug);
    for (const width of [960,480]) {
      await sharp(input).resize(width,width,{fit:'contain',background:'#ffffff'}).webp({quality:82}).toFile(path.join(imageDir,`${product.sourceId}-${width}.webp`));
    }
    const index = catalog.findIndex(p => p.slug === product.slug);
    if (index < 0) catalog.push(product); else catalog[index] = product;
    const source = {
      id:product.sourceId, title:product.name, kind:'design-concept',
      ...(referenceUrl?{referenceUrl}:{}), approval:approval || 'User approved publication of the ten format concepts on 2026-10-21; no fixed MOQ or lead time verified.',
      imageOrigin:'Original AI-generated design visualization; not competitor imagery or a produced sample photograph.',
      assetKey, generatedFile, width:960, height:960,
      imagePath:`/assets/img/catalog/${product.sourceId}-960.webp`,
      thumbnailPath:`/assets/img/catalog/${product.sourceId}-480.webp`, minimumOrder:null
    };
    const sourceIndex = provenance.products.findIndex(p => p.id === source.id);
    if (sourceIndex < 0) provenance.products.push(source); else provenance.products[sourceIndex] = source;
    const columns=Math.min(5,additions.length);
    cells.push({input:await sharp(input).resize(240,240).png().toBuffer(),left:(cells.length%columns)*240,top:Math.floor(cells.length/columns)*240});
  }
  if (new Set(catalog.map(p=>p.slug)).size !== catalog.length || new Set(catalog.map(p=>p.sourceId)).size !== catalog.length) throw Error('Repeated product identifier');
  fs.writeFileSync(path.join(data,'catalog-products.json'),'[\n  '+catalog.map(p=>JSON.stringify(p)).join(',\n  ')+'\n]\n');
  fs.writeFileSync(path.join(data,'catalog-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  const columns=Math.min(5,additions.length);
  await sharp({create:{width:columns*240,height:Math.ceil(additions.length/columns)*240,channels:3,background:'#ffffff'}}).composite(cells).png().toFile(path.join(review,process.argv[2]?'original-designs.png':'ten-original-designs.png'));
  console.log(`Prepared ${additions.length} original concept image pairs; catalog now ${catalog.length} unique products.`);
})().catch(error => {console.error(error);process.exit(1);});
