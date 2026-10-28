// Recette HTTP du build de production local, sans compte ni appel à un modèle.
import { spawn } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const port=3210;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
 cwd:process.cwd(),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'local-audit-placeholder',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-audit-placeholder',SUPABASE_SERVICE_ROLE_KEY:'local-audit-placeholder',STRIPE_SECRET_KEY:'sk_test_local_audit_placeholder',NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:'phc_local_audit_dummy',NEXT_PUBLIC_POSTHOG_HOST:'http://127.0.0.1:9',OTEL_SDK_DISABLED:'true',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
for(const stream of [server.stdout,server.stderr])stream.on('data',b=>appendFileSync('/tmp/release-http-server.log',b));
const base=`http://127.0.0.1:${port}`;
const rows=[];
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base+'/connexion');if(r.status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
 assert.ok(ready,'production server ready');
 for(const path of ['/comparateur?communes=29016,29162,29103','/ou-vivre','/dev/fut147','/dev/fut148','/rapport','/rapport/quartier','/rapport/logement']){
  const r=await fetch(base+path,{redirect:'manual'});const html=await r.text();
  if(path.startsWith('/dev/'))assert.equal(r.status,404,path);
  else if(path.startsWith('/rapport')){assert.ok([200,302,303,307,308].includes(r.status),path+' '+r.status); if(r.status===200){assert.match(html,/NEXT_REDIRECT|http-equiv="refresh"/i,path+' streamed auth redirect');assert.match(html,/connexion/,path+' login destination');}else assert.match(r.headers.get('location'),/connexion/,path);}
  else assert.equal(r.status,200,path);
  if(path.startsWith('/comparateur'))assert.match(html,/Incendies observés/,'BDIFF conservé dans le rendu gratuit');
  rows.push({path,status:r.status,location:r.headers.get('location'),bytes:Buffer.byteLength(html),fireLine:path.startsWith('/comparateur')?html.includes('Incendies observés'):undefined});
 }
 const parsed={reformulation:'Nature, calme, peu de risque de feu en Finistère, fibre pour télétravailler',hardConstraints:{departements:['29']},preferences:[{key:'faible_risque_feu',weight:3},{key:'nature',weight:2},{key:'cadre_calme',weight:2}]};
 const post=async p=>{const r=await fetch(base+'/api/comparateur-vie/match',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parsed:p})});assert.equal(r.status,200);return r.json()};
 const without=await post(parsed),withFibre=await post({...parsed,horsMesure:[{term:'fibre',kind:'autre'}]});
 assert.equal(withFibre.results.length,3);assert.ok(withFibre.results.every(r=>r.fibre?.ligne));
 assert.deepEqual(withFibre.results.map(({fibre,...r})=>r),without.results,'la ligne fibre ne change ni scores ni ordre ni autres faits');
 assert.equal(withFibre.comparaisonComplete,undefined);assert.equal(withFibre.pistes,undefined);
 rows.push({path:'/api/comparateur-vie/match',status:200,trio:withFibre.results.map(r=>({insee:r.insee,score:r.score,fibre:r.fibre.ligne,incendiesObserves:r.incendiesObserves})),sameScoresAndOrder:true,noPaidPayload:true});
 const out={date:new Date().toISOString(),applicationCommit:'2447b198',pass:true,checks:rows,scope:'Build de production local : route match réelle, aperçus publics, gardes authentification et bancs dev404 ; aucun paiement/session réelle ni appel modèle.'};
 writeFileSync('docs/audits/2026-10-28-vercel-storage/integration-http.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
}finally{server.kill('SIGTERM');}
