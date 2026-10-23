const fs=require('node:fs'),sharp=require('sharp'),path=require('node:path');
const input=process.argv[2],out=process.argv[3];
if(!input||!out)throw Error('Pass source group JSON and private output directory.');
(async()=>{
 const groups=JSON.parse(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});
 for(const group of groups){
  const cells=[],cols=4,cell=280,photoSize=260;
  for(let i=0;i<group.products.length;i++){
   const p=group.products[i];if(!new URL(p.image).hostname.endsWith('.alicdn.com'))throw Error('Untrusted image host');
   const file=path.join(out,p.id+'.jpg');
   if(!fs.existsSync(file)){const r=await fetch(p.image);if(!r.ok)throw Error('Image status '+r.status);fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()))}
   const left=(i%cols)*cell,top=Math.floor(i/cols)*300;
   cells.push({input:await sharp(file).resize(photoSize,photoSize,{fit:'contain',background:'white'}).png().toBuffer(),left,top});
   cells.push({input:Buffer.from(`<svg width="280" height="32"><rect width="280" height="32" fill="white"/><text x="8" y="23" font-size="17">${i+1}. ${p.id}</text></svg>`),left,top:top+photoSize});
  }
  await sharp({create:{width:cols*cell,height:Math.ceil(group.products.length/cols)*300,channels:3,background:'#e8ecea'}}).composite(cells).png().toFile(path.join(out,group.group.replace(/[^a-z0-9]/gi,'-')+(group.page>1?'-page-'+group.page:'')+'-contact-sheet.png'));
  console.log(group.group,group.products.length);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
