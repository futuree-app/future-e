// La vraie route est exécutée ; seul le fournisseur payant et les compteurs
// externes sont remplacés dans ce processus de test. Aucun réseau.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { repliInondation } from '../../src/lib/comparateur/synthese-repli.ts';

const racine = pathToFileURL(`${process.cwd()}/`).href;
const fauxSdk = `export function streamText(options) {
 globalThis.__fut129Envois.push(options);
 return { textStream: (async function* () { yield 'Réponse simulée, aucun modèle appelé.'; })() };
}`;
const hook = `
export async function resolve(spec, ctx, next) {
 const mocks = {
  'ai': ${JSON.stringify(fauxSdk)},
  '@ai-sdk/anthropic': 'export const anthropic = id => id;',
  'next/server': 'export class NextRequest extends Request {}',
  '@/lib/server/garde-appels-modele': 'export const limiteParAdresse = () => null; export const reserverBudgetModele = async () => null;',
 };
 if (spec in mocks) return {url: 'data:text/javascript,' + encodeURIComponent(mocks[spec]), shortCircuit:true};
 if (spec.startsWith('@/')) return next(${JSON.stringify(racine)} + 'src/' + spec.slice(2) + '.ts',ctx);
 return next(spec,ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);
globalThis.__fut129Envois = [];
const { POST } = await import('../../src/app/api/comparateur-vie/synthesize/route.ts');
const dossier = 'docs/audits/2026-10-23-revue-finale';

for (const nom of ['inondation-soins', 'inondation-seule']) {
 const body = JSON.parse(readFileSync(`${dossier}/${nom}-payload.json`, 'utf8'));
 test(`${nom} : la vraie route transmet les faits, leur échelle et le rôle non favorable`, async () => {
  const avant = JSON.stringify(body);
  const response = await POST(new Request('http://localhost/api/comparateur-vie/synthesize', {
   method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body),
  }));
  assert.equal(response.status,200);
  assert.equal(await response.text(),'Réponse simulée, aucun modèle appelé.');
  const { system, prompt, model } = globalThis.__fut129Envois.at(-1);
  assert.equal(model,'claude-sonnet-4-6');
  const p = JSON.parse(prompt.split('DONNÉES :\n')[1]);
  assert.equal(p.role_inondation,'recul documenté uniquement, jamais favorable');
  assert.equal(p.reference_prix_logement,'France');
  assert.equal(p.exploration_sans_classement,nom==='inondation-seule');
  assert.deepEqual(p.territoires.map(r=>r.commune),body.results.map(r=>r.nom));
  for (const [i,r] of p.territoires.entries()) {
   assert.deepEqual(r.raisons,body.results[i].reasons);
   assert.equal(r.logement,body.results[i].logement);
   assert.equal(r.historique_inondation.historique,body.results[i].inondation.historique);
   assert.equal(r.historique_inondation.plans,body.results[i].inondation.plans);
   assert.equal(r.evolution_demographique,null); // non demandée, même si disponible
   assert.equal(r.exposition_industrielle,null);
   assert.ok(!r.raisons.some(x=>/inondation/i.test(x)));
  }
  const regles = system.replace(/\s+/g,' ');
  assert.match(regles,/Les critères ordinaires peuvent expliquer la sélection quand les "raisons" du moteur l'établissent/);
  assert.match(regles,/inondation ne contribue JAMAIS favorablement au classement/);
  assert.match(regles,/seulement entraîner un recul documenté/);
  assert.match(regles,/Aucune causalité entre critères, localisation, prix ou caractéristiques territoriales sans relation effectivement établie/);
  assert.match(regles,/portée et son échelle de comparaison inchangées/);
  assert.match(regles,/France ne devient pas relatif au département/);
  assert.match(regles,/Ne reconstituez pas après coup une explication de la sélection/);
  assert.match(regles,/Un compromis seulement s'il est explicitement fourni/);
  assert.match(regles,/Une même classe historique signifie seulement une même plage de sinistres passés, jamais une exposition équivalente/);
  assert.doesNotMatch(regles,/ET utilisé au classement|les critères demandés expliquent POURQUOI|dites honnêtement que les profils sont proches/);
  assert.equal(JSON.stringify(body),avant); // pas de réécriture des entrées
 });
 test(`${nom} : repli déterministe sans justification inventée ni équivalence d'exposition`, () => {
  const text = repliInondation(body.preferences,body.results,body.outcome.exploration);
  for (const r of body.results) assert.ok(text.includes(r.nom));
  assert.match(text,/Une même classe historique ne signifie pas une exposition équivalente/);
  assert.match(text,/La situation d'un bien se vérifie à son adresse/);
  assert.match(text,/Ces faits ne démontrent pas un faible risque/);
  assert.doesNotMatch(text,/Aucun ne réunit tout|arbitrage différent|prix|département|ce qui explique/);
  if (body.outcome.exploration) assert.match(text,/sans classement favorable/);
  else assert.match(text,/ne favorise aucune commune/);
 });
}
test('hors priorité inondation : aucun repli inondation introduit',()=>{
 assert.equal(repliInondation([{key:'acces_soins'}],[{nom:'Aytré'}],false),null);
});
test('hors priorité inondation : les faits historiques ne sont pas introduits dans la vraie route',async()=>{
 const body=JSON.parse(readFileSync(`${dossier}/inondation-soins-payload.json`,'utf8'));
 body.preferences=body.preferences.filter(p=>p.key!=='faible_risque_inondation');
 body.outcome.exploration=true; // le flag seul ne suffit pas à introduire ce thème
 const response=await POST(new Request('http://localhost/api/comparateur-vie/synthesize',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),
 }));
 await response.text();
 const p=JSON.parse(globalThis.__fut129Envois.at(-1).prompt.split('DONNÉES :\n')[1]);
 assert.equal(p.role_inondation,null);
 assert.equal(p.exploration_sans_classement,false);
 assert.ok(p.territoires.every(r=>r.historique_inondation===null));
 assert.equal(p.reference_prix_logement,'France');
});
