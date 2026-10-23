import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const products=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/catalog-products.json'),'utf8'));
const christmas=JSON.parse(fs.readFileSync(path.join(root,'seo-system/data/christmas-collection.json'),'utf8'));
const raw=category=>products.filter(p=>p.category===category).map(p=>p.slug);
const category=(id,label,image,description,members)=>({id,label,image,description,members:[...new Set(members)]});
export const taxonomy=[
 category('hot-selling','Hot Selling','bbq-grill-kit-packaging-box','Featured formats for your next packaging project.',[
  'bbq-grill-kit-packaging-box','bbq-meal-tray-carry-box','custom-pyramid-catering-box','window-grazing-box-with-dividers','custom-burger-clamshell-box','custom-corrugated-pizza-box','custom-printed-corrugated-mailer','foldable-magnetic-gift-box']),
 category('grazing-boxes','Grazing Boxes','window-grazing-box-with-dividers','Sharing platters, divided trays and catering boxes.',[...raw('catering'),'dessert-skewer-display-box']),
 category('bbq','BBQ Boxes','bbq-meal-tray-carry-box','Meal carriers and BBQ kit packaging.',raw('bbq')),
 category('takeaway-food-boxes','Take Away Food Boxes','printed-gable-meal-box','Meal cartons, food sleeves and takeaway wraps.',[...raw('food-boxes'),'custom-food-wrapping-paper']),
 category('cake-boxes','Cake Boxes','tall-cake-box-with-handles','Cake carriers, window boxes and bakery cartons.',[
  'tall-cake-box-with-handles','fold-open-cake-carrier-box','window-cake-box-removable-base','custom-folding-pastry-carton','printed-donut-pastry-box','pastry-pocket-sleeve']),
 category('mailer-boxes','Mailer Boxes','custom-printed-corrugated-mailer','Corrugated mailers for branded deliveries.',['custom-printed-corrugated-mailer','custom-tear-open-corrugated-mailer']),
 category('macaron-chocolate','Macaron & Chocolate Boxes','macaron-sleeve-box','Confectionery sleeves, cartons and gift formats.',['macaron-sleeve-box','custom-chocolate-bar-carton','custom-heart-shaped-rigid-gift-box','custom-cookie-assortment-drawer-box']),
 category('cosmetic-boxes','Cosmetic Boxes','custom-window-lid-rigid-gift-box','Folding cartons and presentation structures for beauty products.',['custom-folding-cosmetic-carton','foldable-magnetic-gift-box','custom-heart-shaped-rigid-gift-box','custom-hexagonal-rigid-gift-box','custom-window-lid-rigid-gift-box','custom-lid-and-base-rigid-gift-box','custom-shoulder-neck-rigid-gift-box']),
 category('pizza-boxes','Pizza Boxes','custom-corrugated-pizza-box','Printed corrugated cartons for takeaway pizza.',['custom-corrugated-pizza-box']),
 category('wine-boxes','Wine Boxes','custom-wine-bottle-gift-box-with-insert','Bottle presentation and beverage bag outer cartons.',['custom-wine-bottle-gift-box-with-insert','custom-bag-in-box-outer-carton']),
 category('gift-boxes','Gift Boxes','foldable-magnetic-gift-box','Rigid, folding and shaped gift packaging.',[...raw('gifts'),...raw('retail')]),
 category('apparel-boxes','Shoes & Clothing Boxes','custom-lid-and-base-rigid-gift-box','Custom-sized mailer and presentation structures.',['custom-printed-corrugated-mailer','custom-tear-open-corrugated-mailer','foldable-magnetic-gift-box','envelope-flap-gift-box','custom-lid-and-base-rigid-gift-box']),
 category('burger-boxes','Burger Boxes','custom-burger-clamshell-box','Hinged cartons for burgers and sliders.',['custom-burger-clamshell-box']),
 category('paper-bags','Paper Bags','custom-bakery-carrier-bag','Bakery, bread and retail carrier bags.',['custom-bakery-carrier-bag','printed-baguette-bread-bag','die-cut-handle-paper-bag','custom-ribbon-handle-paper-gift-bag']),
 category('paper-cups','Paper Cups','custom-printed-coffee-paper-cup','Printed paper cups and coordinated carriers.',raw('drinkware')),
 category('christmas-boxes','Christmas Boxes','custom-ornament-gift-box-with-paper-insert','Festive gifting, advent calendars and party packs.',christmas.products.map(p=>p.slug))
];
export const aliases={'gifts':'gift-boxes','catering':'grazing-boxes','food-boxes':'takeaway-food-boxes','bakery':'cake-boxes','drinkware':'paper-cups','bags':'paper-bags','retail':'gift-boxes'};
const slugs=new Set(products.map(p=>p.slug));
for(const c of taxonomy){
 if(!c.members.length||!slugs.has(c.image)||c.members.some(s=>!slugs.has(s)))throw new Error(`Invalid category: ${c.id}`);
}
for(const p of products)if(!taxonomy.some(c=>c.members.includes(p.slug)))throw new Error(`Uncategorized product: ${p.slug}`);
