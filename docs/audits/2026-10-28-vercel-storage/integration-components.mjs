// Contre-épreuve des composants réels après résolution des six conflits.
// Aucun compte, API externe, navigateur ou modèle ; interactions React en mémoire.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
const root = pathToFileURL(process.cwd() + "/").href;
const hook = `
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ts=createRequire(${JSON.stringify(root)}+'package.json')('typescript');
async function first(xs,ctx,next){for(const x of xs.slice(0,-1)){try{return await next(x,ctx)}catch{}}return next(xs.at(-1),ctx)}
export async function resolve(s,ctx,next){
 if(s==='server-only')return {url:'data:text/javascript,export{}',shortCircuit:true};
 if(s.startsWith('@/')){const b=${JSON.stringify(root)}+'src/'+s.slice(2);return first([b+'.ts',b+'.tsx',b],ctx,next)}
 if((s.startsWith('./')||s.startsWith('../'))&&!/\\.[cm]?[jt]sx?$|\\.json$/.test(s))return first([s+'.ts',s+'.tsx',s],ctx,next);
 return next(s,ctx);
}
export async function load(url,ctx,next){if(!url.endsWith('.tsx'))return next(url,ctx);const f=fileURLToPath(url);return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(f,'utf8'),{fileName:f,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText}}
`;
register('data:text/javascript,' + encodeURIComponent(hook));
const React = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const { createElement: h } = React;
const { create, act } = await import('react-test-renderer');
const { QuartierAside } = await import(root+'src/components/report/QuartierClimatData.tsx');
const { MetricDrawer } = await import(root+'src/components/MetricDrawer.tsx');
const { SinistraliteBlock } = await import(root+'src/components/report/logement/SinistraliteSection.tsx');
const { getMemoireIncendies } = await import(root+'src/lib/bdiff-incendies-commune.ts');
const { getFibreCommune } = await import(root+'src/lib/fibre-commune.ts');
const { texteFibre } = await import(root+'src/lib/fibre-texte.ts');
const { getClimatDataCommune } = await import(root+'src/lib/drias-json.ts');
const { getOnrnSinistralite } = await import(root+'src/lib/onrn-sinistralite.ts');
const clean = s => s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');
const results=[];
const data = JSON.parse(readFileSync('data/arcep-fibre.json','utf8'));
assert.ok(data);
const props={communeName:'Brasparts',scenarios:(await getClimatDataCommune('29016')).commune.s,georisques:null,territoire:null,vigieau:null,drought:null,
 incendies:await getMemoireIncendies('29016'),fibre:{texte:texteFibre(await getFibreCommune('29016'),{pourLeProjet:true}),pourLeProjet:true}};
const html=renderToStaticMarkup(h(QuartierAside,props));
assert.match(html,/Fibre optique/);assert.match(html,/Conditions favorables au feu/);assert.match(html,/97/);
results.push('Territoire : deux cartes réelles présentes simultanément, fibre Brasparts97%');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const values=new Map();
globalThis.window={location:{hash:''},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},addEventListener(){},removeEventListener(){}};
globalThis.document={body:{style:{overflow:''},setAttribute(){},removeAttribute(){}}};
let tree;
await act(()=>{tree=create(h(QuartierAside,props))});
const text=n=>typeof n==='string'?n:(n?.children??[]).map(text).join(' ');
for(const [card,expected] of [['Conditions favorables au feu',/1[\s\u00a0]?917/],['Fibre optique',/97/]]){
 const clickable=tree.root.findAll(n=>n.props.role==='button'&&text(n).includes(card));
 assert.equal(clickable.length,1,card);
 await act(()=>clickable[0].props.onClick());
 const drawer=tree.root.findByType(MetricDrawer);
 const markup=renderToStaticMarkup(h(MetricDrawer,{detail:drawer.props.detail,onClose(){}}));
 assert.match(clean(markup),expected);
 if(card==='Conditions favorables au feu'){
   assert.match(markup,/Les incendies enregistrés depuis 2006/);assert.match(clean(markup),/surface|Surface/);
   assert.match(markup,/bdiff/);
 }else{
   assert.match(markup,/cartefibre.arcep.fr/);assert.match(clean(markup),/ne garantit pas/);
   assert.ok(!drawer.props.detail.sections,'la fibre ne récupère pas les sections feu');
 }
 results.push('Volet réel ouvert en mémoire : '+card);
 await act(()=>drawer.props.onClose());
}
await act(()=>tree.unmount());
const onrn=await getOnrnSinistralite('31555');assert.equal(onrn.secheresse.kind,'lecture');assert.equal(onrn.inondation.kind,'lecture');
const logement=clean(renderToStaticMarkup(h(SinistraliteBlock,{sinistralite:onrn,commune:'Toulouse'})));
assert.match(logement,/sécheresse/i);assert.match(logement,/inondation/i);assert.ok(!/indisponible/.test(logement));
results.push('Logement : deux périls ONRN Toulouse rendus par le bloc réel sans indisponible');
const out={date:new Date().toISOString(),checks:results,pass:true,scope:'SSR et interactions React des vrais composants, pas une recette navigateur/pixels ni une session de production'};
writeFileSync('docs/audits/2026-10-28-vercel-storage/integration-components.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
