import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='https://wa.me/8615918968149?text='+encodeURIComponent('Hi MXPACKPRO, I am interested in custom packaging.');
const icon='<img class="icon" src="/assets/img/brand/whatsapp.svg" alt="" width="22" height="22">';
const attrs=`href="${url}" target="_blank" rel="noopener noreferrer" data-whatsapp data-track="whatsapp_click"`;
const row=`<a class="contact-method" ${attrs}><span class="contact-icon" style="background:#127a3f">${icon}</span><span><small>WhatsApp</small><strong>+86 159 1896 8149</strong></span></a>`;
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>'products/'+f)];
let configured=0;
for(const file of files){
 const full=path.join(root,file);let html=fs.readFileSync(full,'utf8');
 if(html.includes('class="floating-contact"'))configured++;
 html=html.replace(/<a class="wa"[^>]*>[\s\S]*?<\/a>/,`<a class="wa" ${attrs} aria-label="Chat on WhatsApp (opens in a new tab)" title="Chat on WhatsApp">${icon}<span>WhatsApp</span></a>`);
 if(html.includes('class="contact-methods"')&&!html.includes('<small>WhatsApp</small>'))html=html.replace('<div class="contact-methods">','<div class="contact-methods">'+row);
 html=html.replace(/v4\.js\?v=[^"\s]+/g,'v4.js?v=20261021-9').replace(/v4\.min\.css\?v=[^"\s]+/g,'v4.min.css?v=20261021-5');
 fs.writeFileSync(full,html);
}
console.log(`WhatsApp configured on ${configured} contact-enabled pages.`);
