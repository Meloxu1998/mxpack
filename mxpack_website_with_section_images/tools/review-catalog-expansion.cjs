const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const output='D:/mxpack-audits/2026-10-21/catalog-expansion';
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const captured=JSON.parse(fs.readFileSync('D:/mxpack-audits/2026-10-21/alibaba-catalog-source.json','utf8'));
 const existing=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-products.json'),'utf8'));
 const candidates=[...new Map(captured.flatMap(x=>x.products).map(p=>[p.id,p])).values()].filter(p=>!existing.some(old=>old.sourceId===p.id));
 for(let start=0;start<candidates.length;start+=30){
  const subset=candidates.slice(start,start+30),cells=[];
  for(const [i,p] of subset.entries()){
   const file=path.join(output,p.id+'.webp');
   if(!fs.existsSync(file)){
    const result=await fetch(p.image,{signal:AbortSignal.timeout(30000)});if(!result.ok)throw Error(p.id);
    await sharp(Buffer.from(await result.arrayBuffer())).resize(700,700,{fit:'inside'}).webp({quality:85}).toFile(file);
   }
   const image=await sharp(file).resize(200,200,{fit:'contain',background:'#fff'}).toBuffer();
   const label=Buffer.from(`<svg width="200" height="30"><rect width="200" height="30" fill="white"/><text x="5" y="20" font-size="12" font-family="Arial">${start+i+1}. ${p.id}</text></svg>`);
   cells.push({input:image,left:i%6*208,top:Math.floor(i/6)*238},{input:label,left:i%6*208,top:Math.floor(i/6)*238+200});
  }
  await sharp({create:{width:1248,height:Math.ceil(subset.length/6)*238,channels:3,background:'#e4e9e6'}}).composite(cells).png().toFile(path.join(output,`candidates-${start}.png`));
  console.log(`Reviewed images ${start+1}-${start+subset.length}`);
 }
 fs.writeFileSync(path.join(output,'candidates.json'),JSON.stringify(candidates,null,2));
})();
