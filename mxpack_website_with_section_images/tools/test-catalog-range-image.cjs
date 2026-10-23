const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=process.cwd();
const out=process.env.QA_OUTPUT||'D:/mxpack-audits/2026-10-23/catalog-range-image';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 let file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.extname(file))file+='.html';
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));
});
(async()=>{
 if(!process.env.QA_BASE)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=process.env.QA_BASE||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 fs.mkdirSync(out,{recursive:true});const results=[];
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
   await context.route(/googletagmanager\.com|google-analytics\.com/,route=>route.fulfill({status:200,body:''}));
   await context.route('https://formsubmit.co/**',route=>route.abort());
   const page=await context.newPage();
   const response=await page.goto(base+'/products',{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   const image=page.locator('.catalog-hero-media img');
   await image.evaluate(img=>img.decode());
   const state=await image.evaluate(img=>({src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight}));
   assert(state.src.includes(width===390?'packaging-workshop-range-20261023-':'packaging-workshop-panorama-20261023-'));
   assert(state.width>0&&state.height>0);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://mxpackpro.com/products');
   assert(await page.locator('.catalog-image-note').isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,`${process.env.QA_BASE?'live':'local'}-${width}.png`)});
   results.push({viewportWidth:width,status:response.status(),image:state});
   await context.close();
  }
  fs.writeFileSync(path.join(out,`${process.env.QA_BASE?'live':'local'}-results.json`),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
