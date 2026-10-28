import fs from 'node:fs';
import {compactInteractionHtml} from './url-state-html.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const navigation=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/site-navigation.json'),'utf8'));
const products=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-products.json'),'utf8'));
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'products')).filter(f=>f.endsWith('.html')).map(f=>`products/${f}`)];
const activeSection=pathname=>navigation.find(n=>n.url===pathname||n.children?.some(c=>c.url===pathname))?.id||(pathname.startsWith('/products/')?'products':'');
for(const file of files){
 const full=path.join(root,file);let html=fs.readFileSync(full,'utf8');if(!html.includes('site-header'))continue;
 const pathname=file==='index.html'?'/':'/'+file.replace(/\.html$/,'');
 const current=activeSection(pathname);
 const link=(item,cls='')=>`<a${cls?` class="${cls}"`:''} href="${item.url}"${item.url===pathname?' aria-current="page"':''}>${esc(item.label)}</a>`;
 const desktop=navigation.map(n=>{
  const trigger=link(n,`nav-trigger${current===n.id?' is-section-active':''}`);
  if(!n.children)return trigger;
  const all={label:n.id==='products'?`Browse all ${products.length} products`:'Guide library',url:n.url};
  return `<div class="nav-group"><div class="nav-parent">${trigger}<button class="nav-menu-toggle" type="button" data-nav-toggle aria-label="Show ${n.label.toLowerCase()} menu" aria-expanded="false" aria-controls="nav-${n.id}"><i class="icon" data-lucide="chevron-down" aria-hidden="true"></i></button></div><div class="mega-menu${n.id==='products'?' mega-menu-products':''}" id="nav-${n.id}"><p class="mega-menu-heading">${n.id==='products'?'Shop by packaging format':'Plan your order'}</p>${link(all,'menu-all')}<div${n.id==='products'?' class="mega-menu-grid"':''}>${n.children.map(c=>link(c)).join('')}</div></div></div>`;
 }).join('');
 const mobile=navigation.map(n=>n.children?`<details><summary>${n.label}</summary>${link({label:n.id==='products'?'All products':'Guide library',url:n.url})}${n.children.map(c=>link(c)).join('')}</details>`:link(n)).join('')+'<a class="button" href="/get-a-quote">Request a quote <i class="icon" data-lucide="arrow-right" aria-hidden="true"></i></a>';
 html=html.replace(/<nav class="nav-links"[\s\S]*?<\/nav>/,`<nav class="nav-links" aria-label="Main navigation">${desktop}</nav>`)
  .replace(/<nav class="mobile-menu"[\s\S]*?<\/nav>/,`<nav class="mobile-menu" data-mobile-menu aria-label="Mobile navigation">${mobile}</nav>`);
 // One stylesheet source avoids stale page-specific copies of shared layout rules.
 if(file==='index.html')html=html.replace(/<style>@font-face[\s\S]*?<\/style>/,'<link rel="stylesheet" href="/assets/css/v4.min.css?v=20261021-3">');
 html=html.replace(/v4\.min\.css\?v=[^"\s]+/g,'v4.min.css?v=20261021-3').replace(/v4\.js\?v=[^"\s]+/g,file==='index.html'?'v4.js?v=20261023-modal-1':'v4.js?v=20261023-modal-1').replace(/catalog-products\.css\?v=[^"\s]+/g,'catalog-products.css?v=20261021-3');
 html=html.replace(/inquiry-analytics\.js\?v=[^"\s]+/g,'inquiry-analytics.js?v=20261023-modal-3');
 html=html.replaceAll('>Resources<','>Guides<').replaceAll('Resource center','Guide library').replaceAll('Resource Center','Guide library');
 html=html.replace(/catalog-data\.js\?v=[^"\s]+/g,'catalog-data.js?v=20261026-ordered2');
 if(file==='resources.html')html=html.replaceAll('Food Packaging Guides &amp; Resources','Packaging Buying Guides').replaceAll('Food Packaging Guides & Resources','Packaging Buying Guides').replace('Better packaging decisions, made easier.','Packaging buying guides.');
 fs.writeFileSync(full,compactInteractionHtml(html, file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '')));
}

const quote=fs.readFileSync(path.join(root,'get-a-quote.html'),'utf8');
let canonicalForm=quote.match(/<form class="contact-form"[\s\S]*?<\/form>/)?.[0];
if(!canonicalForm)throw new Error('Canonical inquiry form missing.');
canonicalForm=canonicalForm.replace('id="quote-form"','id="custom-quote-form"').replace('New MXPACKPRO quote request - Quote page','New MXPACKPRO quote request - Custom packaging').replace('name="_url" value="https://mxpackpro.com/get-a-quote"','name="_url" value="https://mxpackpro.com/custom-packaging"');
let custom=fs.readFileSync(path.join(root,'custom-packaging.html'),'utf8');
const formSection=`<section class="section quote-contact-section" id="quote-form"><div class="container contact-layout"><div class="contact-panel"><p class="eyebrow">Start your project</p><h2 class="section-title">Tell us what you need.</h2><p class="contact-lead">Send your product, quantity and delivery country. We will help with the format, sample and quotation.</p><div class="contact-methods"><a class="contact-method" href="mailto:sales@mxpackpro.com" data-track="email_click"><span class="contact-icon"><i class="icon" data-lucide="mail" aria-hidden="true"></i></span><span><small>Email</small><strong>sales@mxpackpro.com</strong></span></a></div></div>${canonicalForm}</div></section>`;
custom=custom.replace(/<section class="section (?:section-white|quote-contact-section)" id="quote-form">[\s\S]*?<\/section>/,formSection);
fs.writeFileSync(path.join(root,'custom-packaging.html'),compactInteractionHtml(custom, '/custom-packaging'));

let faq=fs.readFileSync(path.join(root,'faq.html'),'utf8');
const categories=[['all','All questions'],['ordering','Ordering & MOQ'],['printing','Custom printing'],['materials','Materials'],['shipping','Shipping & supply']];
faq=faq.replace(/<div class="faq-categories"[^>]*>[\s\S]*?<\/div>/,`<div class="faq-categories" role="group" aria-label="Filter purchasing questions">${categories.map(([id,label])=>`<button class="faq-category${id==='all'?' active':''}" type="button" data-faq-filter="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div>`);
const groups=['ordering','ordering','printing','shipping','printing','ordering','materials','shipping','ordering','ordering','materials','shipping','ordering','printing'];
let q=0;faq=faq.replace(/(<div class="faq-layout"><div class="accordion">)([\s\S]*?)(<\/div><aside)/,(_,start,questions,end)=>start+questions.replace(/<details(?:\s+[^>]*)?>/g,()=>`<details data-faq-category="${groups[q++]}"${q===1?' open':''}>`)+end);
if(q!==14)throw new Error('Expected all 14 purchasing questions.');
fs.writeFileSync(path.join(root,'faq.html'),compactInteractionHtml(faq, '/faq'));
console.log(`Updated navigation and shared assets on ${files.length} pages; unified both inquiry forms and in-page FAQ filters.`);
execFileSync(process.execPath,[path.join(root,'tools/update-whatsapp.mjs')],{stdio:'inherit'});
