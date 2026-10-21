const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const css=fs.readFileSync(path.join(root,'assets/css/v4.css'),'utf8');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();
 const output=await page.evaluate(source=>{
  const sheet=new CSSStyleSheet();sheet.replaceSync(source);
  return [...sheet.cssRules].map(rule=>rule.cssText).join('');
 },css);
 if(!output.includes('.contact-form')||!output.includes('.partner-copy'))throw new Error('Shared styles incomplete.');
 fs.writeFileSync(path.join(root,'assets/css/v4.min.css'),output+'\n');
 console.log(`Built shared CSS with the browser CSS parser: ${Buffer.byteLength(output)} bytes.`);
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
