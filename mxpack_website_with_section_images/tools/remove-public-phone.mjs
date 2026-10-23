import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const retiredPhone=/155\s*2116\s*3050/;
const anchor=/<a\b[^>]*\bhref="tel:\+8615521163050"[^>]*>[\s\S]*?<\/a>(?:<br\s*\/?>)?/g;
function cleanSchema(value){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){value.forEach(cleanSchema);return;}
 for(const key of ['telephone','phone'])if(typeof value[key]==='string'&&retiredPhone.test(value[key])){
  delete value[key];
  if(value['@type']==='ContactPoint')value.email='sales@mxpackpro.com';
 }
 Object.values(value).forEach(cleanSchema);
}
const htmlFiles=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>'products/'+f)];
const changed=[];
for(const relative of htmlFiles){
 const file=path.join(root,relative),old=fs.readFileSync(file,'utf8');
 if(!retiredPhone.test(old))continue;
 let html=old.replace(anchor,'').replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(all,start,json,end)=>{
  const data=JSON.parse(json);cleanSchema(data);return start+JSON.stringify(data)+end;
 });
 assert(!retiredPhone.test(html),`Unrecognized phone markup in ${relative}`);
 if(html!==old){fs.writeFileSync(file,html);changed.push(relative);}
}
for(const relative of ['tools/build-homepage.mjs','tools/update-site-shell.mjs','tools/build-supplier-products.mjs']){
 const file=path.join(root,relative),old=fs.readFileSync(file,'utf8');
 let source=old.replace(anchor,'').replace(/,\s*telephone:\s*'\+86 155 2116 3050'/g,'');
 source=source.replace(/('@type':'ContactPoint'),contactType:'sales'/g,"$1,email:'sales@mxpackpro.com',contactType:'sales'");
 assert(!retiredPhone.test(source),`Unrecognized phone source in ${relative}`);
 if(source!==old){fs.writeFileSync(file,source);changed.push(relative);}
}
const configPath=path.join(root,'seo-system/config.json');
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
cleanSchema(config);
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
changed.push('seo-system/config.json');
console.log(JSON.stringify({changed:changed.length,files:changed},null,2));
