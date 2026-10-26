// Test indépendant : même commune et mêmes scores, seule la preuve locale varie.
import {createJiti} from 'jiti';
import {readFileSync,writeFileSync} from 'node:fs';
import{gunzipSync}from'node:zlib';
const root=process.cwd()+'/';
const j=createJiti(root,{alias:{'server-only':root+'scripts/mer/etude-courbe/vide.mjs','@/':root+'src/'}});
const V=await j.import(root+'src/lib/comparateur-vie.ts');
const {classifyHigherEdAbsence}=await j.import(root+'src/lib/decision/absence-facts.ts');
const idx=JSON.parse(gunzipSync(readFileSync('data/comparateur-index.json.gz')));
await V.getCommuneEntry('49007');
const wanted='Pour une ville étudiante à taille humaine.';
function verdict(sup){return classifyHigherEdAbsence(sup?.measured===true?{measured:true,weightedAccess:sup.weightedAccess,radiusKm:sup.radiusKm,establishmentCount:sup.establishmentCount??null}:{measured:false});}
const real={total:idx.communes.length,sansObjet:0,nonMesures:0,incertains:0,identitesAutoriseesSansPreuve:[]};
for(const c of idx.communes){const v=verdict(c.etudesSup);if(!c.etudesSup)real.sansObjet++;if(c.etudesSup?.measured!==true)real.nonMesures++;if(v==='uncertain')real.incertains++;if(v!=='neutral'&&V.buildIdentiteCandidates(c).includes(wanted))real.identitesAutoriseesSansPreuve.push(c.insee);}
const cases=[
 ['temoin',c=>c.etudesSup],
 ['objet_absent',()=>undefined],['objet_null',()=>null],
 ['non_mesure',()=>({measured:false,weightedAccess:0,radiusKm:5})],
 ['rayon_absent',c=>({...c.etudesSup,radiusKm:undefined})],
 ['rayon_zero',c=>({...c.etudesSup,radiusKm:0})],
 ['poids_absent',c=>({...c.etudesSup,weightedAccess:undefined,establishmentCount:undefined})],
 ['poids_negatif',c=>({...c.etudesSup,weightedAccess:-1,establishmentCount:undefined})],
 ['compte_negatif',c=>({...c.etudesSup,establishmentCount:-1})],
 ['absence_attestee',()=>({measured:true,weightedAccess:0,radiusKm:5,establishmentCount:0})],
 ];
const results=[];
for(const insee of ['49007','35238','86194','2B096']){
 const c=idx.communes.find(c=>c.insee===insee);
 for(const [cas,change] of cases){
  const mod={...c,etudesSup:change(c)},v=verdict(mod.etudesSup),candidats=V.buildIdentiteCandidates(mod);
  results.push({insee,nom:c.nom,cas,etudesSup:mod.etudesSup??null,score:V.subScore('vie_etudiante',mod),verdictPreuve:v,identiteEtudiante:candidats.includes(wanted),premiereIdentite:candidats[0],candidats});
 }
}
const out={sha:'41376a1192c5d75bd4c4b8775f2c6bf036b2fbf2',donneesReelles:real,fixtures:results,violations:results.filter(r=>r.verdictPreuve!=='neutral'&&r.identiteEtudiante)};
writeFileSync('docs/audits/2026-10-26-fut135-revue2/preuve-positive.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({donneesReelles:real,violations:out.violations.map(r=>({nom:r.nom,cas:r.cas,score:r.score,verdict:r.verdictPreuve,identite:r.premiereIdentite}))},null,2));
// L'échec est voulu et conservé si une absence de preuve autorise l'identité.
if(out.violations.length)process.exitCode=1;
