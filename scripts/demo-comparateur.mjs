#!/usr/bin/env node
/**
 * demo-comparateur.mjs — DÉMO jetable (pas la lib finale).
 * V4 : ajout santé environnementale (air_sain) + vivabilité (acces_soins,
 * acces_services), tous nationaux. 10 projets thématiques santé/vivabilité.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const POP_FLOOR = 1500, PERFECT_THRESHOLD = 80, VIABILITY_BASELINE_W = 1;

function lerp(a, x){ if(x==null) return null; if(x<=a[0][0]) return a[0][1]; const l=a[a.length-1]; if(x>=l[0]) return l[1];
  for(let i=1;i<a.length;i++){ if(x<=a[i][0]){ const [x0,y0]=a[i-1],[x1,y1]=a[i]; return y0+((y1-y0)*(x-x0))/(x1-x0);} } return l[1]; }
const ISOLEMENT=[[0,0],[1000,5],[2000,15],[5000,45],[10000,65],[20000,80],[50000,92],[100000,97],[300000,100]];
const CALME=[[0,55],[30,65],[80,85],[150,95],[400,100],[800,95],[1500,80],[3000,55],[6000,30],[12000,12],[30000,3]];
const WINTER_MILD=[[-3,5],[1,30],[4,60],[7,88],[9,100],[12,95],[16,80]];
const VILLE_SIZE={petite:{min:5000,max:25000},moyenne:{min:25000,max:100000},grande:{min:100000,max:null}};

const PREF_DEFS={
  faible_chaleur:{kind:'clim',fields:['NORTX30D_yr','NORTX35D_yr','NORTR_yr','NORTMm_seas_JJA'],dir:'lower'},
  douceur_climat:{kind:'douceur'}, ensoleillement_recherche:{kind:'soleil'},
  faible_secheresse:{kind:'clim',fields:['NORSWI04_yr'],dir:'lower'},
  faible_risque_feu:{kind:'clim',fields:['NORIFM40_yr'],dir:'lower'},
  faible_precip_extremes:{kind:'clim',fields:['NORRRq99_yr','NORRx1d_yr'],dir:'lower'},
  proximite_mer:{kind:'coast'}, cadre_calme:{kind:'calme'}, eviter_isolement:{kind:'isolement'},
  air_sain:{kind:'air'}, acces_soins:{kind:'soins'}, acces_services:{kind:'services'},
};
const POS={ faible_chaleur:'étés plus frais', douceur_climat:'climat doux',
  ensoleillement_recherche:'plus chaud et ensoleillé', faible_secheresse:'sols peu exposés à la sécheresse',
  faible_risque_feu:'faible risque de feu', faible_precip_extremes:'pluies extrêmes rares',
  proximite_mer:(c)=>`à ${c.distance_cote_km} km de la côte`, cadre_calme:'cadre calme et habitable',
  eviter_isolement:(c)=>`vie locale réelle (${c.population?.toLocaleString('fr-FR')} hab.)`,
  air_sain:'air de fond plus pur', acces_soins:'bon accès aux médecins', acces_services:'services à proximité' };
const NEG={ faible_chaleur:'chaleur en hausse', douceur_climat:'hivers rudes ou étés marqués',
  ensoleillement_recherche:'plus frais et humide', faible_secheresse:'sols exposés à la sécheresse',
  faible_risque_feu:'risque de feu notable', faible_precip_extremes:'pluies intenses fréquentes',
  proximite_mer:'éloignée du littoral', cadre_calme:'plus dense que recherché', eviter_isolement:'commune de petite taille',
  air_sain:'air plus chargé en particules', acces_soins:'zone sous-dotée en médecins', acces_services:'services parfois éloignés' };

function pctClim(c,f){ const v=f.map(k=>c.pct?.[k]).filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
function subScore(key,c){
  const d=PREF_DEFS[key]; if(!d) return null;
  if(d.kind==='clim'){ const p=pctClim(c,d.fields); return p==null?null:(d.dir==='lower'?100-p:p); }
  if(d.kind==='coast') return clamp(100-c.distance_cote_km/1.5,0,100);
  if(d.kind==='calme') return lerp(CALME,c.densite);
  if(d.kind==='isolement') return lerp(ISOLEMENT,c.population);
  if(d.kind==='douceur'){ const w=lerp(WINTER_MILD,c.clim.NORTMm_seas_DJF); if(w==null) return null;
    const s=c.pct.NORTX35D_yr==null?50:100-c.pct.NORTX35D_yr; return Math.round(0.6*w+0.4*s); }
  if(d.kind==='soleil'){ const su=c.pct.NORTMm_seas_JJA; if(su==null) return null;
    const dry=c.pct.NORRR_yr==null?50:100-c.pct.NORRR_yr; return Math.round(0.45*su+0.55*dry); }
  if(d.kind==='air'){ const pm=c.vivpct?.pm25; if(pm==null) return null;
    const no2=c.vivpct.no2==null?pm:c.vivpct.no2; return Math.round(0.7*(100-pm)+0.3*(100-no2)); } // PM2.5 > NO2
  if(d.kind==='soins'){ return c.vivpct?.apl==null?null:c.vivpct.apl; }
  if(d.kind==='services'){ return c.vivpct?.eloignement==null?null:100-c.vivpct.eloignement; }
  return null;
}
function passesHard(c,hc){
  if(c.population!=null && c.population<POP_FLOOR) return false;
  if(hc.region && c.region!==hc.region) return false;
  if(hc.nearSea?.active && c.distance_cote_km>(hc.nearSea.maxKm??30)) return false;
  if(hc.communeSize){ if(hc.communeSize.min!=null && (c.population??0)<hc.communeSize.min) return false;
    if(hc.communeSize.max!=null && (c.population??Infinity)>hc.communeSize.max) return false; }
  return true;
}
function reason(k,c){ const r=POS[k]; return typeof r==='function'?r(c):r; }
function run(index,parsed){
  const prefs=[...parsed.preferences];
  if(!prefs.some(p=>p.key==='eviter_isolement')) prefs.push({key:'eviter_isolement',weight:VIABILITY_BASELINE_W,baseline:true});
  const totalW=prefs.reduce((s,p)=>s+p.weight,0)||1;
  const cand=index.communes.filter(c=>passesHard(c,parsed.hardConstraints));
  const scored=cand.map(c=>{
    const subs=[]; for(const p of prefs){ const s=subScore(p.key,c); if(s!=null) subs.push({...p,s}); }
    const compatibility=Math.round(subs.reduce((s,x)=>s+x.weight*x.s,0)/totalW);
    const vis=subs.filter(x=>!x.baseline);
    const reasons=[...vis].sort((a,b)=>b.weight*b.s-a.weight*a.s).slice(0,3).filter(x=>x.s>=55).map(x=>reason(x.key,c));
    const worst=[...vis].sort((a,b)=>a.weight*a.s-b.weight*b.s)[0];
    const tradeoff=worst&&worst.s<50?NEG[worst.key]:null;
    return {nom:c.nom,dept:c.dept,pop:c.population,pm25:c.viv?.pm25,apl:c.viv?.apl,j30:c.clim.NORTX30D_yr,cote:c.distance_cote_km,compatibility,reasons,tradeoff};
  }).sort((a,b)=>b.compatibility-a.compatibility);
  const seen=new Set(),out=[];
  for(const s of scored){ const k=/^751\d\d$/.test('')?'':s.nom; if(seen.has(k)) continue; seen.add(k); out.push(s); if(out.length>=3) break; }
  return {candidates:cand.length,top:out};
}
const P=[
  {t:'1. Famille enfant, ville moyenne, air sain, proche océan',hardConstraints:{communeSize:VILLE_SIZE.moyenne},
   preferences:[{key:'air_sain',weight:3},{key:'proximite_mer',weight:2},{key:'faible_chaleur',weight:1}]},
  {t:'2. Territoire sain, peu de pollution (pesticides = hors score, note synthèse)',hardConstraints:{},
   preferences:[{key:'air_sain',weight:3},{key:'eviter_isolement',weight:2}]},
  {t:'3. Bonne qualité de l’air avant tout',hardConstraints:{},preferences:[{key:'air_sain',weight:3}]},
  {t:'4. Environnement sain + services accessibles (eau = synthèse)',hardConstraints:{},
   preferences:[{key:'air_sain',weight:2},{key:'acces_services',weight:2}]},
  {t:'5. Retraite, bord de mer, douceur, bon accès aux soins',hardConstraints:{},
   preferences:[{key:'douceur_climat',weight:3},{key:'proximite_mer',weight:2},{key:'acces_soins',weight:2}]},
  {t:'6. Télétravail nature calme MAIS soins+services accessibles',hardConstraints:{},
   preferences:[{key:'cadre_calme',weight:3},{key:'acces_soins',weight:2},{key:'acces_services',weight:2}]},
  {t:'7. Littoral, ville moyenne, air sain',hardConstraints:{communeSize:VILLE_SIZE.moyenne,nearSea:{active:true,maxKm:20}},
   preferences:[{key:'air_sain',weight:2},{key:'eviter_isolement',weight:2}]},
  {t:'8. Ville moyenne, services complets, peu de chaleur',hardConstraints:{communeSize:VILLE_SIZE.moyenne},
   preferences:[{key:'acces_services',weight:3},{key:'faible_chaleur',weight:2}]},
  {t:'9. Éviter l’isolement, bon accès aux soins',hardConstraints:{},
   preferences:[{key:'acces_soins',weight:3},{key:'eviter_isolement',weight:3}]},
  {t:'10. Famille, air pur, services proches, pas trop chaud',hardConstraints:{},
   preferences:[{key:'air_sain',weight:3},{key:'acces_services',weight:2},{key:'faible_chaleur',weight:2}]},
];
const index=JSON.parse(await fs.readFile(path.join(process.cwd(),'data','comparateur-index.json'),'utf8'));
for(const p of P){ const o=run(index,p);
  console.log(`\n${p.t}  [${o.candidates} cand.]`);
  for(const r of o.top){
    console.log(`   ${r.compatibility}  ${r.nom} (${r.dept}) — ${r.pop?.toLocaleString('fr-FR')} hab, PM2.5 ${r.pm25?.toFixed?.(1)??'?'}, APL ${r.apl??'?'}, ${r.j30}j>30°, ${r.cote}km`);
    console.log(`        + ${r.reasons.join(' · ')||'—'}${r.tradeoff?`  | compromis : ${r.tradeoff}`:''}`); } }
