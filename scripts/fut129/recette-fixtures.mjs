// Recette locale reproductible : vraie page, entrées déterministes figées,
// réponses API simulées. Aucun parsing ni appel de modèle réel.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { repliInondation } from '../../src/lib/comparateur/synthese-repli.ts';

const base = process.argv[2];
assert.match(base ?? '', /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir = 'docs/audits/2026-10-23-fut129-regles-synthese';
mkdirSync(dir,{recursive:true});
const bridge = process.env.FUT129_HTTP_BRIDGE === '1';
const mesures=[];
const normaliser = t => t.replace(/\s+/g,' ').trim();
const sessions = Object.fromEntries(['inondation-soins','inondation-seule'].map(n=>[n,
 JSON.parse(readFileSync(`docs/audits/2026-10-23-revue-finale/${n}-session.json`,'utf8'))]));

for (const [nom,s] of Object.entries(sessions)) {
 for (const cas of [{width:1440,theme:'dark'},{width:390,theme:'light'},{width:360,theme:'dark'},{width:390,theme:'dark',echec:true}]) {
  const id=`${nom}-${cas.width}-${cas.theme}${cas.echec?'-repli':''}`;
  const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,
   args:process.env.CHROME_SINGLE_PROCESS==='1'?['--no-sandbox','--single-process','--no-zygote']:[]});
  const page=await browser.newPage({viewport:{width:cas.width,height:900},hasTouch:cas.width<480,isMobile:cas.width<480,deviceScaleFactor:1,reducedMotion:'reduce'});
  const appels=[]; const erreurs=[]; const consoles=[]; const inattendus=[]; const ressources=[];
  const texte=repliInondation(s.parsed.preferences,s.outcome.results,s.outcome.inondation.exploration);
  page.on('pageerror',e=>erreurs.push(e.message));
  page.on('console',m=>{if(m.type()==='error') consoles.push(m.text());});
  await page.route('**/*',async route=>{
   const req=route.request(); const url=new URL(req.url());
   if(url.origin!==base || /ingest|posthog|_vercel/.test(url.pathname)) return route.abort();
   if(req.method()==='POST') {
    const data=req.postDataJSON(); appels.push({path:url.pathname,body:data});
    if(url.pathname==='/api/comparateur-vie/parse') {
     assert.equal(data.text,s.submittedText);
     return route.fulfill({json:{parsed:s.parsed}});
    }
    if(url.pathname==='/api/comparateur-vie/match') {
     assert.deepEqual(data.parsed,s.parsed);
     return route.fulfill({json:s.outcome});
    }
    if(url.pathname==='/api/comparateur-vie/synthesize') {
     assert.deepEqual(data.preferences,s.parsed.preferences);
     assert.deepEqual(data.results.map(r=>r.nom),s.outcome.results.map(r=>r.nom));
     assert.equal(data.outcome.exploration,s.outcome.inondation.exploration);
     return cas.echec?route.fulfill({status:502,body:'Fournisseur indisponible simulé'})
      :route.fulfill({contentType:'text/plain; charset=utf-8',body:texte});
    }
    inattendus.push(url.pathname); return route.abort();
   }
   if(req.method()!=='GET') {inattendus.push(url.pathname); return route.abort();}
   if(!bridge) return route.continue();
   try {
    const response=await fetch(req.url(),{signal:AbortSignal.timeout(60000)});
    const headers=Object.fromEntries(response.headers);
    delete headers['content-encoding']; delete headers['content-length'];
    const body=Buffer.from(await response.arrayBuffer());
    ressources.push({path:url.pathname,status:response.status,type:headers['content-type'],bytes:body.length});
    await route.fulfill({status:response.status,headers,body});
   } catch(e) {erreurs.push(`GET ${url.pathname}: ${e.message}`); await route.abort();}
  });
  await page.addInitScript(theme=>{localStorage.setItem('futuree-consent','denied');localStorage.setItem('futuree-theme',theme);},cas.theme);
  try {
   await page.goto(`${base}/ou-vivre`,{waitUntil:'networkidle',timeout:180000});
   // Attendre un effet client réel avant de saisir : un fill trop précoce sur
   // le HTML SSR serait perdu lors de l'hydratation React.
   await page.waitForFunction(()=>document.querySelector('textarea')?.placeholder.length>3,null,{timeout:30000});
   await page.locator('textarea').first().fill(s.submittedText);
   await page.getByRole('button',{name:'Explorer mes possibilités'}).click();
   const cards=page.locator('article.card-answer');
   await cards.first().waitFor({timeout:30000});
   assert.equal(await cards.count(),3);
   for(const [i,r] of s.outcome.results.entries()) {
    assert.equal(normaliser(await cards.nth(i).locator('h3').innerText()),r.nom);
    assert.ok(normaliser(await cards.nth(i).innerText()).includes(normaliser(r.inondation.ligne)));
   }
   await page.getByText(texte,{exact:true}).waitFor({timeout:30000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.addStyleTag({content:'nextjs-portal {display:none!important}'});
   if(s.outcome.inondation.exploration) {
    assert.equal(await cards.getByText(/correspondance/i).count(),0);
    assert.equal(await cards.locator('details').count(),3);
    assert.equal(await cards.locator('details[open]').count(),0);
    assert.equal(await cards.first().locator('details p').first().isVisible(),false);
    await page.screenshot({path:`${dir}/${id}-ferme.jpg`,type:'jpeg',quality:80,fullPage:true});
    for(const card of await cards.all()) {
     const summary=card.locator('summary');
     if(cas.width<480) await summary.tap();
     else {await summary.focus(); await summary.press('Enter');}
     assert.equal(await card.locator('details').getAttribute('open'),'');
     assert.equal(await card.locator('details p').first().isVisible(),true);
    }
   } else {
    assert.equal(await cards.getByText(/sur vos autres critères/i).count(),3);
    assert.equal(await cards.locator('details').count(),0);
   }
   await page.screenshot({path:`${dir}/${id}.jpg`,type:'jpeg',quality:80,fullPage:true});
   assert.deepEqual(appels.map(a=>a.path),['/api/comparateur-vie/parse','/api/comparateur-vie/match','/api/comparateur-vie/synthesize']);
   assert.deepEqual(erreurs,[]); assert.deepEqual(inattendus,[]);
   // Vérifie aussi la reprise réelle du snapshot créé par CE parcours, sans rejouer d'API.
   await page.reload({waitUntil:'networkidle'});
   await cards.first().waitFor({timeout:30000});
   await page.getByText(texte,{exact:true}).waitFor();
   assert.equal(appels.length,3);
   mesures.push({id,width:cas.width,theme:cas.theme,reponseSimulee:true,repli:!!cas.echec,cartes:3,debordement:0,depliant:s.outcome.inondation.exploration?'fermé puis ouvert tactile/clavier':null,repriseSession:true,appelsSimules:appels.map(a=>a.path),erreurs,consoles});
   console.log(`${id} OK`);
  } catch(e) {
   const client=await page.evaluate(()=>({ready:document.readyState,next:window.next?.version,chunks:window.webpackChunk_N_E?.map(c=>c[0]),placeholder:document.querySelector('textarea')?.placeholder,react:Reflect.ownKeys(document.querySelector('textarea')??{}).filter(k=>String(k).startsWith('__react'))}));
   writeFileSync(`${dir}/${id}-echec.json`,JSON.stringify({message:e.message,erreurs,consoles,inattendus,ressources,appels,client,body:await page.locator('body').innerText()},null,2));
   throw e;
  } finally {await browser.close();}
 }
}
const fichiers=['src/app/api/comparateur-vie/synthesize/route.ts','src/app/(public)/ou-vivre/OuVivreClient.tsx','src/lib/comparateur/synthese-repli.ts'];
writeFileSync(`${dir}/mesures.json`,JSON.stringify({base,git:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:Object.fromEntries(fichiers.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),recette:'fixtures locales, aucune réponse Anthropic réelle',mesures},null,2)+'\n');
