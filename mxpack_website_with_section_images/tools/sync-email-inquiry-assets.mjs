import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync('products').filter(f=>f.endsWith('.html')).map(f=>'products/'+f),...fs.readdirSync('tools').filter(f=>f.endsWith('.mjs')&&f!=='sync-email-inquiry-assets.mjs').map(f=>'tools/'+f)];
let count=0;
for(const file of files){
 const old=fs.readFileSync(path.join(root,file),'utf8');
 const next=old.replace(/inquiry-analytics\.js\?v=[\w-]+/g,'inquiry-analytics.js?v=20261023-modal-1').replace(/v4\.js\?v=[\w-]+/g,'v4.js?v=20261023-modal-1');
 if(old!==next){fs.writeFileSync(file,next);count++;}
}
console.log(`Updated inquiry asset versions in ${count} pages/templates.`);
