const fs=require('node:fs');
const sharp=require('sharp');
const dir='D:/mxpack-audits/2026-10-23/product-upload';
const ids=['1601522047646','1601581402884','1601588291874','1601591959373','1601645106085','1601645148051','1601584447385','1601586264452'];
(async()=>{
 const groups=JSON.parse(fs.readFileSync(dir+'/supplier-groups.json'));
 const all=new Map(groups.flatMap(g=>g.products.map(p=>({...p,sourceGroup:g.group,sourceGroupUrl:g.url}))).map(p=>[p.id,p]));
 const existing=JSON.parse(fs.readFileSync('seo-system/data/catalog-products.json'));
 const provenance=JSON.parse(fs.readFileSync('seo-system/data/catalog-provenance.json'));
 const selected=ids.map(id=>{const p=all.get(id);if(!p)throw Error('Missing live supplier reference '+id);if(existing.some(x=>x.sourceId===id)||provenance.products.some(x=>x.id===id))throw Error('Already documented/published '+id);return p});
 const cells=[];
 for(let i=0;i<selected.length;i++){
  const p=selected[i],r=await fetch(p.image);if(!r.ok)throw Error('Image HTTP '+r.status);
  const bytes=Buffer.from(await r.arrayBuffer());fs.writeFileSync(dir+'/'+p.id+'.jpg',bytes);
  const photo=await sharp(bytes).resize(300,300,{fit:'contain',background:'white'}).png().toBuffer();
  cells.push({input:photo,left:(i%4)*320,top:Math.floor(i/4)*345});
  const label=Buffer.from(`<svg width="320" height="35"><rect width="320" height="35" fill="white"/><text x="10" y="24" font-size="18">${p.id}</text></svg>`);
  cells.push({input:label,left:(i%4)*320,top:Math.floor(i/4)*345+300});
 }
 await sharp({create:{width:1280,height:690,channels:3,background:'#e9edeb'}}).composite(cells).png().toFile(dir+'/candidate-contact-sheet.png');
 fs.writeFileSync(dir+'/candidate-products.json',JSON.stringify(selected,null,2));
 console.log('Prepared 8 unlisted references for structural image review.');
})().catch(e=>{console.error(e);process.exitCode=1});
