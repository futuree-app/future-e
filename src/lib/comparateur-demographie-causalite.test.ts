// FUT-36 (06/10/2026) : LE COMPARATEUR DÉCRIT LA DÉMOGRAPHIE, IL NE LUI PRÊTE PAS DE CAUSE.
//
// Reproduit sur main 7ea64dca, moteur lancé sur l'index réel, sans aucun appel au modèle :
//   - Belley (01034) : la carte affichait « Pour s'installer dans un territoire qui attire. »
//     (comparaison gratuite, Pack, Où vivre ; et le texte partait dans `synthesize-choix`) ;
//   - Ambérieu-en-Bugey, Belley, Cessy : `demographie` valait « gagne des habitants et attire de
//     nouveaux arrivants », envoyé au modèle de la synthèse d'Où vivre quand la croissance est demandée,
//     sous un prompt qui donnait lui-même « attire de nouveaux arrivants » en exemple.
// Une croissance et une part d'arrivants récents dans le tercile haut national ne disent pas POURQUOI
// des gens arrivent. FUT-6 l'avait corrigé côté Territoire ; le comparateur gardait sa propre copie.
//
// Contrairement à ce que note `comparaison-cardinal.test.ts`, le moteur s'importe ici : un hook de
// résolution fournit `server-only` et les alias `@/` (même patron que `logement-sources-bornees.test.ts`),
// et l'index est versionné (`data/comparateur-index.json.gz`). Les cas sont de vraies communes.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { DEMOGRAPHY_PHRASE } from "./territoire/facts.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;
before(() => { register(`data:text/javascript,${encodeURIComponent(hook)}`); });

/** Une causalité d'attraction, sous toutes ses formes. */
const CAUSAL = /\battir(e|ent|er|ait|ant|é|ée|és|ées)?\b|\battracti(f|fs|ve|ves|vité|vités)\b/i;

type Resultat = { insee: string; nom: string; identite: string; demographie: string | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Moteur = { seedComparaison: (i: string[]) => Promise<{ trio: Resultat[]; comparaison: any } | null>; subScore: (k: string, c: unknown) => number | null; RECIT_DEMOGRAPHIE: Record<string, string> };
const moteur = async () => (await import(`${racine}src/lib/comparateur-vie.ts`)) as Moteur;
const groupe = async (insees: string[]) => (await (await moteur()).seedComparaison(insees))!;

// Communes témoins, relevées dans l'index le 06/10/2026 (code `demographie.recit`).
const BELLEY = "01034";                         // gagne_attire, croissance ≥ 62 : portait « qui attire »
const AMBERIEU = "01004", CESSY = "01071";      // gagne_attire
const BOURG = "01053";                          // gagne_sans_renouv
const GAP = "05061", CUSSET = "03095";          // stable, stable_renouv
const LAON = "02408";                           // perd

test("D1. forte arrivée récente : le fait, la position relative, aucune cause", async () => {
  const r = await groupe([AMBERIEU, BELLEY, CESSY]);
  for (const c of r.trio) {
    assert.equal(c.demographie, "gagne des habitants, avec une part d'arrivants récents parmi les plus élevées", c.nom);
    assert.doesNotMatch(c.demographie!, CAUSAL);
  }
  // Même phrase, mot pour mot, que Territoire (FUT-6) : un même fait ne se dit pas de deux façons.
  assert.equal((await moteur()).RECIT_DEMOGRAPHIE.gagne_attire, DEMOGRAPHY_PHRASE.gagne_attire);
});

test("D2. croissance démographique : la carte de Belley dit la croissance, sans « qui attire »", async () => {
  const r = await groupe([AMBERIEU, BELLEY, CESSY]);
  const belley = r.trio.find((c) => c.insee === BELLEY)!;
  assert.equal(belley.identite, "Pour s'installer dans une commune qui gagne des habitants.");
  for (const c of r.trio) assert.doesNotMatch(c.identite, CAUSAL, c.nom);
});

test("D3. cas intermédiaires : croissance sans renouvellement, population stable", async () => {
  const r = await groupe([BOURG, GAP, CUSSET]);
  const par = Object.fromEntries(r.trio.map((c) => [c.insee, c.demographie]));
  assert.equal(par[BOURG], "gagne des habitants sans fort renouvellement récent");
  assert.equal(par[GAP], "population globalement stable");
  assert.equal(par[CUSSET], "population stable, mais renouvellement résidentiel marqué");
  for (const c of r.trio) assert.doesNotMatch(`${c.identite} ${c.demographie}`, CAUSAL, c.nom);
});

test("D4. baisse : décrite, jamais jugée", async () => {
  const r = await groupe([LAON, BELLEY]);
  const laon = r.trio.find((c) => c.insee === LAON)!;
  assert.equal(laon.demographie, "perd des habitants");
  assert.doesNotMatch(`${laon.identite} ${laon.demographie}`, CAUSAL);
});

test("D5. aucun récit démographique du comparateur ne contient de causalité, quel que soit le code", async () => {
  const { RECIT_DEMOGRAPHIE } = await moteur();
  assert.deepEqual(Object.keys(RECIT_DEMOGRAPHIE).sort(), ["gagne_attire", "gagne_sans_renouv", "perd", "stable", "stable_renouv"]);
  for (const [code, phrase] of Object.entries(RECIT_DEMOGRAPHIE)) assert.doesNotMatch(phrase, CAUSAL, code);
  // Les phrases « Pour qui » du moteur non plus (sources, commentaires retirés).
  const code = readFileSync("src/lib/comparateur-vie.ts", "utf8").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  for (const m of code.matchAll(/push\("([^"]+)"\)/g)) assert.doesNotMatch(m[1], CAUSAL, m[1]);
});

test("D6. sur tout l'index, aucune commune à forte croissance ne reçoit une identité causale", async () => {
  const { subScore } = await moteur();
  const brut = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString());
  const communes: { insee: string; population?: number; demographie?: { recit?: string } }[] = Array.isArray(brut) ? brut : brut.communes ?? Object.values(brut);
  const fortes = communes.filter((c) => (subScore("croissance_demographique", c) ?? 0) >= 62 && (c.population ?? 0) > 20000);
  assert.ok(fortes.length >= 6, `${fortes.length} communes témoins`);
  for (let i = 0; i + 3 <= 12 && i + 3 <= fortes.length; i += 3) {
    const r = await groupe(fortes.slice(i, i + 3).map((c) => c.insee));
    for (const c of r.trio) assert.doesNotMatch(`${c.identite} ${c.demographie ?? ""}`, CAUSAL, c.nom);
  }
});

test("D7. vues à deux et à trois communes : phrases naturelles, cardinalité FUT-32 intacte", async () => {
  const deux = await groupe([BELLEY, LAON]);
  const trois = await groupe([BELLEY, LAON, GAP]);
  assert.equal(deux.trio.length, 2);
  assert.equal(trois.trio.length, 3);
  for (const r of [deux, trois]) {
    // Chaque identité reste une phrase complète, unique dans le groupe affiché.
    const ids = r.trio.map((c) => c.identite);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^Pour [^.]+\.$/);
    // Le texte comparatif du moteur ne prête pas de cause non plus.
    assert.doesNotMatch(JSON.stringify(r.comparaison), CAUSAL);
  }
  assert.doesNotMatch(JSON.stringify(deux.comparaison), /\btrois\b/i, "deux communes ne se disent jamais « trois »");
});

test("D8. le prompt de synthèse interdit la causalité et ne la donne plus en exemple", () => {
  const prompt = readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8");
  assert.doesNotMatch(prompt, /attire de nouveaux arrivants/);
  assert.match(prompt, /n'écrivez jamais qu'un territoire « attire », qu'il est « attractif » ni qu'il a une\n« attractivité » : une part d'arrivants récents ne dit pas pourquoi ils sont venus ;/);
});
