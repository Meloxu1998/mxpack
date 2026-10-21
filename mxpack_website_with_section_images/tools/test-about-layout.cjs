const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const sharp = require('sharp');
const base = process.env.QA_BASE || 'http://127.0.0.1:4187';
const output = 'D:/mxpack-audits/2026-10-21/about-layout';
fs.mkdirSync(output, {recursive:true});
(async () => {
  const previous = execFileSync('git', ['show', '1d8bc12:mxpack_website_with_section_images/about-us.html'], {encoding:'utf8'});
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => localStorage.setItem('mxpackContactPromptDismissedAt', Date.now()));
    await context.route(/googletagmanager\.com|google-analytics\.com/, route => route.fulfill({status:200,body:''}));
    await context.route('https://formsubmit.co/**', route => route.abort());
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const results=[];
    for (const width of [360,390,768,1024,1440,1920,2560]) {
      await page.setViewportSize({width,height:1000});
      const response=await page.goto(base+'/about-us');
      assert.equal(response.status(),200);
      await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
      const preserved=await page.evaluate(source=>{
        const old=new DOMParser().parseFromString(source,'text/html');
        const normalize=element=>element.textContent.replace(/\s+/g,' ').trim();
        return {text:normalize(old.querySelector('main'))===normalize(document.querySelector('main')),images:[...old.querySelectorAll('main img')].map(el=>el.getAttribute('src')).join('|')===[...document.querySelectorAll('main img')].map(el=>el.getAttribute('src')).join('|')};
      },previous);
      assert(preserved.text,`Visible content changed at ${width}`);
      assert(preserved.images,`Images changed at ${width}`);
      const metrics=await page.evaluate(()=>{
        const size=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {width:Math.round(r.width),height:Math.round(r.height)}};
        return {overflow:document.documentElement.scrollWidth>innerWidth+1,hero:size('.about-hero'),quality:size('#quality'),sustainability:size('.sustainability-band'),missing:[...document.querySelectorAll('main img')].filter(img=>!img.naturalWidth).length,brokenPrinciples:document.querySelectorAll('#quality .check-list li > strong').length};
      });
      assert(!metrics.overflow,`${width} horizontal overflow`);
      assert.equal(metrics.missing,0);
      assert.equal(metrics.brokenPrinciples,0);
      if(width>1060){assert(metrics.hero.height<=680);assert(metrics.quality.width<=1240);}
      for(const [selector,name] of [['.about-hero','hero'],['#quality','quality'],['.sustainability-band','sustainability']]) {
        const screenshot=await page.locator(selector).screenshot({path:`${output}/${name}-${width}.png`,style:'.site-header,.floating-contact,.mobile-contact-bar,.skip-link { visibility:hidden!important }'});
        const stats=await sharp(screenshot).stats();
        assert(stats.channels.slice(0,3).some(channel=>channel.stdev>25),`${name} ${width} appears blank`);
      }
      if([390,1440,1920].includes(width)){
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:`${output}/page-${width}.png`,fullPage:true});
      }
      results.push({width,...metrics,preserved});
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(`${output}/verification.json`,JSON.stringify({base,passed:true,results,noEmailSent:true,noGscSubmission:true},null,2));
    console.log('PASS: about page at seven widths, unchanged text/images, no overflow, readable principle flow and nonblank screenshot pixels.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
