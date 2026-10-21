const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const [desktop,mobile]=process.argv.slice(2);
if(!desktop||!mobile)throw new Error('Provide desktop and mobile concept image paths.');
(async()=>{
 const directory=path.join(root,'assets/img/home');
 for(const [source,name,widths] of [[desktop,'packaging-family-desktop',[1280,1860]],[mobile,'packaging-family-mobile',[480,800,1200]]]){
  for(const width of widths){
   const output=path.join(directory,`${name}-${width}.webp`);
   await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:82,effort:6}).toFile(output);
   console.log(`${path.basename(output)}: ${fs.statSync(output).size} bytes`);
  }
 }
})();
