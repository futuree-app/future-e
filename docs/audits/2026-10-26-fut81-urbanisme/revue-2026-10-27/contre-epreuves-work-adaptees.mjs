// Revue indépendante de PR #95. Depuis le checkout : node ../audit-fut81-repro.mjs
// Lecture seule : aucun service distant ni écriture de dossier utilisateur.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { register, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const hook = readFileSync('src/lib/fut81-urbanisme-parcelle.test.ts','utf8').match(/const hook = `([\s\S]*?)`;\n/)[1];
// Réutiliser seulement le chargeur TSX du dépôt, pas ses scénarios ni ses assertions.
const racine = pathToFileURL(root+'/').href;
const hookText = Function('racine', 'return `'+hook+'`')(racine);
register('data:text/javascript,'+encodeURIComponent(hookText));
const {lireUrbanisme,couvre} = await import(pathToFileURL(root+'/src/lib/urbanisme-parcelle.ts'));
// ADAPTATION APRÈS CORRECTION : les deux mesures supprimées sont rejouées par la sortie métier.
const partsDansParcelle=(parcelle,geoms)=>geoms.map(g=>{const u=lireUrbanisme({point:[2,46],...base,parcelle:{geometry:parcelle,contenance:null,rattachement:'point'},zones:[feat(parcelle,{libelle:'P'})],prescriptions:{surface:[feat(g,{typepsc:'01',stypepsc:'00',libelle:'mesure'})],ligne:[],point:[]}});return u.prescriptions[0]?.part ?? 0;});
const traverseParcelle=()=>null;
const {sourcesAbsentes,issueActualisation} = await import(pathToFileURL(root+'/src/lib/logement-report-version.ts'));
const require = createRequire(root+'/package.json');
const {createElement} = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {UrbanismeBlock} = await import(pathToFileURL(root+'/src/components/report/logement/UrbanismeBlock.tsx'));
const out = process.env.OUT; mkdirSync(out,{recursive:true});
const doc='0123456789abcdef0123456789abcdef';
const xy=(x,y)=>[2+x/(111320*Math.cos(46*Math.PI/180)),46+y/111320];
const rect=(a,b,c,d)=>({type:'Polygon',coordinates:[[xy(a,b),xy(c,b),xy(c,d),xy(a,d),xy(a,b)]]});
const p=rect(0,0,100,100);
const feat=(geometry,extra={})=>({geometry,properties:{gpu_doc_id:doc,...extra}});
const base={point:xy(50,50),parcelle:{geometry:p,contenance:10000,rattachement:'point'},municipality:[{properties:{is_rnu:false}}],documents:[feat(null,{du_type:'PLU'})],zones:[feat(p,{libelle:'UA',typezone:'U'})],secteurs:[],prescriptions:{surface:[],ligne:[],point:[]},details:{[doc]:{effectiveStatus:'EN_VIGUEUR',legalStatus:'APPROVED'}},fichiers:{[doc]:[]}};
const text=h=>h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const render=(u,repli=false)=>renderToStaticMarkup(createElement(UrbanismeBlock,{urbanisme:u,parcelCode:'PARCELLE-TEST',withDivider:false}));
const result={sha:'992af92fd4c23eece89b5c39ec465fcd2b3099c0',geometry:[],failures:[],witnesses:[]};
const report=(name,value)=>result.failures.push({name,...value});
for(const [name,g,exact,area] of [
 ['limite seule',rect(100,0,110,100),0,10000],
 ['microchevauchement',rect(99.99,0,110,100),0.0001,10000],
 ['bande réservée 50 m²',rect(1,0,1.5,100),0.005,10000],
 ['bande réservée 30 m²',rect(1,0,1.3,100),0.003,10000],
 ['deux zones réelles',rect(40,0,100,100),0.6,10000],
]){
 const part=partsDansParcelle(p,[g])[0]; const u=lireUrbanisme({...base,prescriptions:{surface:[feat(g,{typepsc:'05',libelle:name})],ligne:[],point:[]}});
 result.geometry.push({name,exact,measured:part,exactSurfaceM2:exact*area,prescriptions:u.prescriptions.map(x=>({categorie:x.categorie,etendue:x.etendue,part:x.part,surfaceM2:x.surfaceM2})),contact:u.prescriptionsContact});
}
const small=rect(0,0,10,10),smallBand=rect(0.1,0,0.2,10);
result.geometry.push({name:'petite parcelle : intersection réelle 1 m²',exact:0.01,measured:partsDansParcelle(small,[smallBand])[0]});
for(const [name,g] of [['point ouest',{type:'Point',coordinates:xy(0,50)}],['point est',{type:'Point',coordinates:xy(100,50)}],['ligne ouest',{type:'LineString',coordinates:[xy(0,0),xy(0,100)]}],['ligne est',{type:'LineString',coordinates:[xy(100,0),xy(100,100)]}]]){
 const u=lireUrbanisme({...base,prescriptions:{surface:[],ligne:g.type==='LineString'?[feat(g,{typepsc:'07',libelle:name})]:[],point:g.type==='Point'?[feat(g,{typepsc:'07',libelle:name})]:[]}});
 report(name,{prescriptions:u.prescriptions,contact:u.prescriptionsContact});
}
const hole={type:'Polygon',coordinates:[...p.coordinates,...rect(25,25,75,75).coordinates]};
result.geometry.push({name:'trou : prescription dans le trou',measured:partsDansParcelle(hole,[rect(30,30,70,70)])[0]});
const multi={type:'MultiPolygon',coordinates:[rect(0,0,10,10).coordinates,rect(90,90,100,100).coordinates]};
result.geometry.push({name:'multipolygone, une composante sur deux',measured:partsDansParcelle(multi,[rect(0,0,10,10)])[0]});
const concave={type:'Polygon',coordinates:[[xy(0,0),xy(100,0),xy(100,50),xy(50,50),xy(50,100),xy(0,100),xy(0,0)]]};
result.geometry.push({name:'parcelle concave : encoche exclue',measured:partsDansParcelle(concave,[rect(60,60,90,90)])[0]});
result.geometry.push({name:'parcelle concave : deux tiers reels',expected:0.667,measured:partsDansParcelle(concave,[rect(0,0,50,100)])[0]});
for(const [name,g] of [['geometry absente',null],['Polygon vide',{type:'Polygon',coordinates:[]}],['Polygon invalide',{type:'Polygon',coordinates:null}]]){
 try {const u=lireUrbanisme({...base,parcelle:{geometry:g,contenance:10000,rattachement:'point'}});report(name,{statut:u.statut,grain:u.grain,rattachement:u.rattachement,zones:u.zones.map(z=>z.libelle)});}
 catch(e){report(name,{throws:e.message});}
}
for(const [name,details] of [['detail en panne',null],['metadonnees vides',{}],['statut legal absent',{effectiveStatus:'EN_VIGUEUR'}],['hors vigueur',{effectiveStatus:'HORS_VIGUEUR',legalStatus:'APPROVED'}]]){
 const u=lireUrbanisme({...base,details:{[doc]:details}});const html=render(u);writeFileSync(out+'/'+name.replaceAll(' ','-')+'.html',html);
 report(name,{statut:u.statut,vigueur:u.documents[0].vigueur,ambiguites:u.ambiguites,visibleText:text(html.split('<details')[0])});
}
const two=lireUrbanisme({...base,zones:[feat(rect(0,0,40,100),{libelle:'UA'}),feat(rect(40,0,100,100),{libelle:'UB'})]});
result.geometry.push({name:'deux zones',zones:two.zones.map(x=>[x.libelle,x.part])});
const originalFetch=globalThis.fetch;
const {findCadastreParcelWithGeometry}=await import(pathToFileURL(root+'/src/lib/cadastre.ts'));
let calls=[];
const cad=(idu,contenance,geometry)=>({geometry,properties:{idu,code_insee:'99999',section:'AA',numero:idu,contenance}});
globalThis.fetch=async(url)=>{calls.push(String(url));return Response.json({features:calls.length===1?[]:[cad('proche',5000,rect(0,0,100,100)),cad('petite-voisine',100,rect(-2,0,-1,2))]});};
const lu=await findCadastreParcelWithGeometry(...xy(0,50));
globalThis.fetch=originalFetch;
const fallback=lireUrbanisme({...base,parcelle:{geometry:lu.geometry,contenance:lu.parcel.contenance,rattachement:lu.parcel.rattachement,distanceM:lu.parcel.distanceRepliM},zones:[feat(lu.geometry,{libelle:'ZONE-VOISIN'})],prescriptions:{surface:[feat(lu.geometry,{typepsc:'05',libelle:'Réserve chez le voisin'})],ligne:[],point:[]}});
const fh=render(fallback,true);writeFileSync(out+'/repli.html',fh);
report('repli selectionne la plus petite, pas la plus proche',{parcel:lu.parcel,statut:fallback.statut,ambiguites:fallback.ambiguites,rattachement:fallback.rattachement,visibleText:text(fh.split('<details')[0])});
const known=lireUrbanisme({...base,prescriptions:{surface:[feat(p,{typepsc:'05',libelle:'Réserve connue'})],ligne:[],point:[]}});
const lost=lireUrbanisme({...base,prescriptions:{surface:null,ligne:[],point:[]}});
const r=(u)=>({address:{label:'Test',latitude:46,longitude:2},urbanisme:u});
const old={report:r(known),reportHash:'old',sourcesAbsentes:sourcesAbsentes(r(known)),numero:1};
report('actualisation perd la source prescriptions',{oldAbsent:old.sourcesAbsentes,newAbsent:sourcesAbsentes(r(lost)),newPrescriptionsStatut:lost.prescriptionsStatut,issue:issueActualisation(r(lost),'new',old)});
report('actualisation : prescriptions officiellement retirees (evolution legitime)',{issue:issueActualisation(r(lireUrbanisme({...base})),'new2',old)});
report('actualisation : detail en panne apres un detail lu',{issue:issueActualisation(r(lireUrbanisme({...base,details:{[doc]:null}})),'new3',{...old,report:r(lireUrbanisme({...base}))})});
report('actualisation : dossier historique sans urbanisme, Geoportail en panne',{issue:issueActualisation(r(lireUrbanisme({...base,documents:null})),'new4',{report:{address:{label:'Test',latitude:46,longitude:2}},reportHash:'h',sourcesAbsentes:[],numero:1})});
for(const [subcode,label] of [['05','Emplacement réservé logement social/mixité sociale'],['07','Secteur de projet en attente d’un projet d’aménagement global']]) {
 const u=lireUrbanisme({...base,prescriptions:{surface:[feat(p,{typepsc:'05',stypepsc:subcode,libelle:label})],ligne:[],point:[]}});
 report('nomenclature 05-'+subcode,{prescriptions:u.prescriptions.map(x=>({categorie:x.categorie,code:x.code,sousCode:x.sousCode})),visibleText:text(render(u).split('<details')[0])});
}
for(const c of ['lyon-croix-rousse','six-fours-emplacement-reserve','merignac-deux-zones','la-rochelle-psmv','vauquois-carte-communale','chatelard-rnu','grandvals-sans-document']){
 const x=JSON.parse(readFileSync('src/lib/__fixtures__/fut81/'+c+'.json','utf8'));
 const u=lireUrbanisme({point:[x.ban.lon,x.ban.lat],parcelle:x.parcelle?{geometry:x.parcelle.geometry,contenance:x.parcelle.properties.contenance,rattachement:x.parcelle.rattachement}:null,municipality:x.municipality.features,documents:x.document.features,zones:x.zone.features,secteurs:x.secteur.features,prescriptions:{surface:x.prescriptionSurf.features,ligne:x.prescriptionLin.features,point:x.prescriptionPct.features},details:x.details,fichiers:x.files});
 result.witnesses.push({name:c,statut:u.statut,ambiguites:u.ambiguites,grain:u.grain,rattachement:u.rattachement,zones:u.zones.map(z=>[z.libelle,z.part,z.surfaceM2]),enLimite:u.zonesEnLimite,prescriptions:u.prescriptions.map(x=>[x.categorie,x.etendue,x.part,x.surfaceM2,x.libelle]),contact:u.prescriptionsContact,vigueur:u.documents.map(d=>d.vigueur)});
}
writeFileSync(out+'/reproductions.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if (process.argv.includes('--live') || process.argv.includes('--live-psmv')) {
 const {urlRechercheBan}=await import(pathToFileURL(root+'/src/lib/geocodeur-ban.ts'));
 const {fetchUrbanismeParcelle}=await import(pathToFileURL(root+'/src/lib/gpu.ts'));
 const live=[];
 const queries=process.argv.includes('--live-psmv')?['10 rue des Granges 25000 Besançon']:['10 rue des Granges 25000 Besançon','50 rue Royale 59000 Lille','13 avenue des Myosotis 94370 Sucy-en-Brie'];
 for (const q of queries) {
  const trace=[];
  globalThis.fetch=async(url,init)=>{const entry={url:String(url)};trace.push(entry);try{const r=await originalFetch(url,init);entry.status=r.status;if(String(url).endsWith('/prescription-surf')){entry.properties=(await r.clone().json()).features?.map(f=>f.properties);}return r;}catch(e){entry.error=e.message;throw e;}};
  try {
   const res=await fetch(urlRechercheBan({q,limit:1}),{signal:AbortSignal.timeout(15000)});
   const b=(await res.json()).features[0]; const [lon,lat]=b.geometry.coordinates;
   const parcel=await findCadastreParcelWithGeometry(lon,lat);
   const u=await fetchUrbanismeParcelle(lat,lon,parcel?{geometry:parcel.geometry,contenance:parcel.parcel.contenance,rattachement:parcel.parcel.rattachement,candidatsAuPoint:parcel.parcel.candidatsAuPoint,distanceM:parcel.parcel.distanceRepliM??null}:null);
   if(process.argv.includes('--live-psmv'))writeFileSync(out+'/psmv-besancon.html',render(u));
   const links=[];
   for (const z of u.zones) if(z.reglement.statut==='publie'&&!links.some(x=>x.url===z.reglement.url)) {
    const response=await fetch(z.reglement.url,{method:'GET',signal:AbortSignal.timeout(20000)});
    links.push({url:z.reglement.url,finalUrl:response.url,status:response.status,contentType:response.headers.get('content-type')});
    await response.body?.cancel();
   }
   live.push({q,ban:b.properties,parcel:parcel?.parcel,urbanisme:u,links,trace});
  } catch(e){live.push({q,error:e.message,trace});}
  finally{globalThis.fetch=originalFetch;}
  writeFileSync(out+(process.argv.includes('--live-psmv')?'/live-psmv.json':'/live.json'),JSON.stringify(live,null,2));
  console.log('LIVE',JSON.stringify(live.at(-1)));
 }
}
