import fs from 'node:fs';
const families=['bakery-cake-boxes','burger-boxes','custom-paper-bags','paper-cups','pizza-boxes','takeaway-food-boxes'];
for(const slug of families){
 const file=slug+'.html';let html=fs.readFileSync(file,'utf8');
 html=html.replaceAll(`get-a-quote?product=${slug}`,`/get-a-quote?category=${slug}`);
 html=html.replace(/(<section class="cta-band">[\s\S]*?<\/section>)/g,section=>section.replace('href="get-a-quote"',`href="/get-a-quote?category=${slug}"`));
 fs.writeFileSync(file,html);
}
const file='pizza-boxes.html';let html=fs.readFileSync(file,'utf8');
const title='Custom Pizza Boxes | Sizes, Print & Order Planning | MXPACKPRO';
const description='Plan custom pizza box orders by finished pizza size, lid clearance, artwork version and delivery conditions. Prepare a sample brief and compare product specifications.';
html=html.replace(/<title>.*?<\/title>/,`<title>${title.replaceAll('&','&amp;')}</title>`).replace(/(<meta name="description" content=")[^"]+/,`$1${description}`).replace(/(<meta property="og:title" content=")[^"]+/,`$1${title.replaceAll('&','&amp;')}`).replace(/(<meta property="og:description" content=")[^"]+/,`$1${description}`);
html=html.replace('Strong, stackable corrugated boxes for hot pizza, flat foods and delivery orders. Built for dependable takeaway performance and a consistent brand presentation.','Plan a pizza-box range around your menu sizes, finished pizzas and delivery journey. Compare the order requirements here, then review the exact carton and artwork with your quotation.');
const rows=[
 ['Internal footprint','Measure the finished pizza and the liner or tray, not just the advertised menu size.','Pizza diameter, liner dimensions and practical insertion clearance.'],
 ['Lid height & closure','Check toppings, lid clearance and how the packed box closes.','Finished pizza height and a sample closure check.'],
 ['Service & delivery','Describe packing temperature, holding time and the actual delivery journey.','The intended use and material documents required for your destination.'],
 ['Print versions','Separate each size, store artwork and seasonal design in the order brief.','Pieces per version, artwork status and dieline review.'],
 ['Packing & replenishment','Compare flat-pack space, outer cartons and repeat-order requirements.','Carton measurements, order split and the approved specification reference.']
];
const hub=`<section class="section section-white" data-pizza-buying-hub><div class="container"><div class="section-head"><div><p class="eyebrow">Pizza packaging order planning</p><h2 class="section-title">Specify the box around the finished pizza.</h2></div><p>Use this category checklist to compare menu sizes and order versions. The linked product page covers the specific folding carton, rather than replacing this purchasing brief.</p></div><div class="buyer-table-wrap" role="region" aria-label="Pizza box procurement checklist" tabindex="0"><table class="buyer-table"><thead><tr><th scope="col">Decision</th><th scope="col">What to check</th><th scope="col">What to send</th></tr></thead><tbody>${rows.map(([a,b,c])=>`<tr><th scope="row">${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table></div><p class="section-copy" style="margin-top:24px">For the current carton construction, see the <a class="text-link" href="/products/custom-corrugated-pizza-box">printed corrugated pizza box</a>. Review the <a class="text-link" href="/materials-food-safety">material and intended-use checklist</a> before confirming a specification.</p></div></section>`;
html=html.replace(/<section[^>]*data-pizza-buying-hub[\s\S]*?<\/section>/g,'');
const heroStart=html.indexOf('<section class="detail-hero">'),heroEnd=html.indexOf('</section>',heroStart)+10;
html=html.slice(0,heroEnd)+hub+html.slice(heroEnd);
const plan='<section class="section section-cream" data-pizza-order-plan><div class="container spec-layout"><div><p class="eyebrow">Quote each version clearly</p><h2 class="section-title">One menu. A clear order breakdown.</h2><ul class="check-list"><li>List internal dimensions and pieces for every menu size.</li><li>Identify store, language or artwork versions separately.</li><li>Ask for MOQ and setup terms for each proposed specification.</li><li>Confirm flat-pack outer cartons and your destination postcode.</li></ul><a class="text-link" href="/get-a-quote?category=pizza-boxes" data-track="quote_category_click">Send the pizza-box brief</a></div><div><p class="eyebrow">Before approving production</p><h2 class="section-title">Check a complete packed sample.</h2><ul class="check-list"><li>Load the actual pizza and liner to check clearance and closure.</li><li>Review holding and delivery conditions against your intended use.</li><li>Inspect artwork placement on the agreed dieline.</li><li>Record the approved version for future reorders.</li></ul><a class="text-link" href="/packaging-buying-guide">Prepare a packaging sample review</a></div></div></section>';
html=html.replace(/<section class="section section-cream"[^>]*>[\s\S]*?<\/section>/,plan);
const faq=[
 ['How do I specify pizza box dimensions?','Measure the finished pizza diameter and height, including toppings, liners or a tray. State the required internal footprint and lid clearance. Confirm fit and closure using a packed sample rather than relying only on a menu size.'],
 ['Can I combine several pizza sizes in one order?','Provide a separate quantity for each size and artwork version. The applicable MOQ, setup requirements and quotation are confirmed for each specification; do not assume the combined quantity qualifies every version.'],
 ['Should I order the same box for collection and delivery?','Describe both service journeys, including holding time, handling and packing conditions. Review the complete pack with your actual product before deciding whether one specification suits both uses. No fixed heat-retention or delivery-performance claim is assumed.'],
 ['What information helps compare printed pizza box quotations?','Send internal dimensions, quantities by artwork version, material requirements, the delivery country or postcode, required arrival date and artwork status. Request a quotation against the same brief so box, print and shipping assumptions can be compared.'],
 ['Where can I check the current pizza carton structure?','The printed corrugated pizza box product page shows the current flat-folding carton with a hinged lid. Use that page for its product-specific starting details and this category checklist for planning menu sizes, artwork versions and sampling.']
];
html=html.replace(/<div class="accordion">[\s\S]*?<\/div>/,`<div class="accordion">${faq.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`);
html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,json)=>{
 const data=JSON.parse(json);
 if(data['@type']==='FAQPage')data.mainEntity=faq.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}));
 if(data['@type']==='CollectionPage'){data.name='Custom Pizza Boxes: Category Buying Checklist';data.description=description;data.mainEntity={'@type':'ItemList',numberOfItems:1,itemListElement:[{'@type':'ListItem',position:1,name:'Printed Corrugated Pizza Box',url:'https://mxpackpro.com/products/custom-corrugated-pizza-box'}]};}
 return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
});
fs.writeFileSync(file,html);
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
fs.writeFileSync('sitemap.xml',fs.readFileSync('sitemap.xml','utf8').replace(/(<loc>https:\/\/mxpackpro.com\/pizza-boxes<\/loc><lastmod>)[^<]+/,`$1${today}`));
console.log('Repaired six category inquiry links and differentiated the pizza category buying page.');
