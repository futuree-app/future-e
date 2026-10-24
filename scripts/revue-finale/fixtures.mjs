import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.argv[2]; assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir='docs/audits/2026-10-23-revue-finale'; const out=[];
for(const cas of ['charron-adresse','lr-duperre','chatel','ancien']) for(const vue of ['classique','releve']) for(const width of [1440,360]){
 const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true});
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===360,isMobile:width===360,reducedMotion:'reduce'});
 await page.addInitScript(()=>{localStorage.setItem('futuree-consent','denied');localStorage.setItem('futuree-theme','dark')});
 await page.route('**/*',async r=>{if(r.request().method()!=='GET'||new URL(r.request().url()).origin!==base||/ingest|posthog/.test(r.request().url()))return r.abort();try{const res=await fetch(r.request().url());const h=Object.fromEntries(res.headers);delete h['content-encoding'];delete h['content-length'];await r.fulfill({status:res.status,headers:h,body:Buffer.from(await res.arrayBuffer())})}catch{await r.abort()}});
 await page.goto(`${base}/dev/fut127?cas=${cas}&vue=${vue}`,{waitUntil:'networkidle',timeout:180000});
 await page.addStyleTag({content:'nextjs-portal {display:none!important}'});
 const texte=(await page.locator('body').innerText()).replace(/\s+/g,' '); assert.ok(/banc fut-127/i.test(texte));
 if(cas==='charron-adresse') assert.ok(/réserve majeure/i.test(texte));
 if(cas==='ancien') assert.ok(texte.includes("sa lecture des inondations n'est plus celle"));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth); assert.equal(overflow,0);
 let clavier=false;
 if(vue==='releve'){
  const summaries=page.locator('#controles summary');
  if(await summaries.count()){
   const first=summaries.first();await first.focus();const outline=await first.evaluate(el=>getComputedStyle(el).outlineStyle);assert.notEqual(outline,'none');await page.keyboard.press('Enter');assert.equal(await first.evaluate(el=>el.parentElement.open),true);clavier=true;
  }
 }
 await page.screenshot({path:`${dir}/${cas}-${vue}-${width}.jpg`,type:'jpeg',quality:65,fullPage:true});
 out.push({cas,vue,width,overflow,clavier});await browser.close();
}
writeFileSync(`${dir}/fixtures-visuelles.json`,JSON.stringify(out,null,2));console.log(JSON.stringify(out));
