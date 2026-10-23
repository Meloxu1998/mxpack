import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'faq.html');
let html=fs.readFileSync(file,'utf8');
const faq=[
 ['What affects the price of custom packaging?','Size, structure, material thickness, print coverage, finishing and order quantity affect the unit price. Compare quotations using the same specification, carton packing and shipping basis. Ask for the total landed cost rather than comparing only the advertised piece price.'],
 ['What is your minimum order quantity?','Starting quantities differ by product and are shown on the individual product pages. A different size, material or print process can change the minimum. Check the individual product page and ask for a quotation for your exact specification.'],
 ['How do I know whether my artwork is printable?','Send your logo or artwork and tell us the desired size and printing coverage. Resolution, bleed, fine lines and print setup are reviewed during proofing. Approve the final artwork on the confirmed dieline before production.'],
 ['Where is your packaging produced?','MXPACKPRO coordinates packaging production in Foshan, Guangdong, China. Tell us your delivery destination so the quotation can confirm production arrangements, packing and the proposed shipping route.'],
 ['Can I get a dieline before preparing the artwork?','Yes. First confirm the box structure and internal dimensions. The project dieline can then be used to place artwork, bleed and folds correctly. Do not build print-ready artwork around an unconfirmed example image.'],
 ['Can I check a sample before ordering?','Ask about a stock sample or a custom structural prototype. Availability, sample charges and courier costs are quoted for the project. Test the sample with your actual food, cup or product before approving fit and performance.'],
 ['Can the packaging be called recyclable or compostable?','That depends on the final material, coatings, adhesives and the disposal system in the destination market. Request evidence for the exact specification. A paper appearance or a leaf symbol alone does not establish recyclability, compostability or certification.'],
 ['How long does custom packaging production take?','The schedule depends on structure, quantity, materials, finishing and artwork approval. Ask for separate sample, production and transit estimates. Confirm the required arrival date and do not treat the production completion date as the delivery date.'],
 ['What information is needed for a packaging quotation?','Send the product or food being packed, internal dimensions, estimated order quantity, artwork status and delivery country. Add the target arrival date, sample requirements and any food-contact or disposal requirements. A product page link helps identify the correct structure.'],
 ['Should I measure the inside or outside of a box?','Start with the packed product and specify internal length, width and height, including the tray, decoration or protective insert. Check the packed sample and closure clearance. State clearly whether any existing measurements are internal or external.'],
 ['Are food-contact certificates available for every product?','Requirements depend on the food, contact time, temperature, coating and destination market. State these conditions before requesting compliance documentation for the proposed material. Do not assume a certificate from another product covers your final specification.'],
 ['Are shipping, taxes and import duties included in the price?','Only if the quotation expressly includes them. Confirm the delivery country and postcode, shipping method, shipping terms, carton quantities and which party handles import clearance and duties. Compare the quoted scope before comparing totals.'],
 ['Can I combine different designs to reach the minimum order?','Ask for a quotation showing the quantity for each structure, size and artwork. Different designs or tooling can have separate setup costs and minimums. The starting quantity on a product page is not a promise that unrelated products can be pooled.'],
 ['Do the product photos show the exact artwork I will receive?','No. The catalog photos show example structures and printed designs. Your order is made to the approved structure, material and artwork in your quotation. Request a proof or sample where color, finish or fit is important.']
];
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
html=html.replace(/(<div class="faq-layout"><div class="accordion">)[\s\S]*?(<\/div><aside class="faq-aside">)/,`$1${faq.map(([q,a],i)=>`<details${i===0?' open':''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}$2`);
const data={'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
html=html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage"[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify(data)}</script>`);
// These existing labels were decorative spans, not working filters. Keep the visual treatment as real links.
html=html.replace(/<span class="faq-category active">([\s\S]*?)<\/span>/,'<a class="faq-category active" href="/moq-pricing-guide">$1</a>');
const targets=['/custom-packaging#printing','/materials-food-safety','/packaging-buying-guide'];
let i=0;html=html.replace(/<span class="faq-category">([\s\S]*?)<\/span>/g,(_,text)=>`<a class="faq-category" href="${targets[i++]}">${text}</a>`);
fs.writeFileSync(file,html);
console.log(`Updated ${faq.length} buyer-focused FAQs with matching visible content and schema.`);
