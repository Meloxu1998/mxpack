const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const svg=fs.readFileSync(path.join(root,'assets/img/brand/mxpack-logo.svg'),'utf8');
 // Decode the original embedded bitmap; SVG renderers may omit embedded WebP.
 const source=Buffer.from(svg.match(/base64,([^"]+)/)[1],'base64');
 for(const size of [1024,512]){
  const inset=Math.round(size*.1),inner=size-2*inset;
  await sharp(source).resize(inner,inner).extend({top:inset,bottom:inset,left:inset,right:inset,background:'#ffffff'}).flatten({background:'#ffffff'}).png().toFile(path.join(root,`assets/img/brand/mxpackpro-whatsapp-avatar-${size}.png`));
 }
})();
