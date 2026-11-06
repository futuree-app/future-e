// FUT-140 · UN ARRONDISSEMENT DE PARIS, LYON OU MARSEILLE N'EST PAS UNE COMMUNE PÉRIURBAINE.
//
// L'index range ces trois villes par arrondissement. La règle « périurbain » (commune de moins de 25 000 habitants
// dans une unité urbaine d'au moins 100 000) lisait la population de l'ARRONDISSEMENT : Paris 1er (15 919), Paris 2e,
// Marseille 2e et Marseille 16e recevaient « Pour vivre aux portes d'une grande ville, sans en habiter le centre ».
// Dans « Où vivre », la carte « Paris » portait cette phrase dès que Paris 1er représentait la ville.
//
// Correction narrative seulement : l'arrondissement est exclu de cette identité, la règle des communes ne change
// pas. Population, taille de ville, scores, couverture et rangs restent ceux de `main` (9866489e), figés ici.
// Index réel et vrai moteur, sans réseau ni modèle.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let COMMUNES: M[];
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines (taille de ville)
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
});
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;
const candidats = (insee: string): string[] => V.buildIdentiteCandidates(commune(insee));

const PERI = "Pour vivre aux portes d'une grande ville, sans en habiter le centre.";
const ETUDIANTE = "Pour une ville étudiante à taille humaine.";
const CROISSANCE = "Pour s'installer dans une commune qui gagne des habitants.";
const EQUILIBRE = "Pour un cadre de vie équilibré, sans excès.";
const ARRONDISSEMENTS = [
  ...Array.from({ length: 20 }, (_, i) => String(75101 + i)),
  ...Array.from({ length: 9 }, (_, i) => String(69381 + i)),
  ...Array.from({ length: 16 }, (_, i) => String(13201 + i)),
];
// La règle des communes, telle qu'elle est écrite (population communale et taille de l'unité urbaine).
const reglePeriurbaine = (c: M) => {
  const uu = V.tailleVilleOf(c);
  return c.population != null && uu != null && uu >= 100000 && c.population < 25000;
};

test("candidats : aucun des 45 arrondissements PLM ne propose « aux portes d'une grande ville »", () => {
  for (const insee of ARRONDISSEMENTS) assert.equal(candidats(insee).includes(PERI), false, insee);
  // Les quatre qui la recevaient : population d'arrondissement sous 25 000, unité urbaine de la ville-centre.
  const vises: Record<string, [number, string]> = {
    "75101": [15919, "00851"], "75102": [21119, "00851"], "13202": [23627, "00759"], "13216": [15487, "00759"],
  };
  for (const [insee, [pop, uu]] of Object.entries(vises)) {
    const c = commune(insee);
    assert.deepEqual([c.population, c.uu, reglePeriurbaine(c)], [pop, uu, true], insee); // donnée inchangée
  }
  // Paris 1er et 2e : la liste exacte qui reste (FUT-141 et FUT-36 inchangés).
  assert.deepEqual(candidats("75101"), [ETUDIANTE, EQUILIBRE]);
  assert.deepEqual(candidats("75102"), [ETUDIANTE, CROISSANCE, EQUILIBRE]);
  // Marseille 2e et 16e gardent leur identité littorale en tête ; seul le candidat périurbain disparaît.
  for (const insee of ["13202", "13216"]) {
    assert.deepEqual(candidats(insee), [
      "Pour un quotidien méditerranéen, les pieds près de l'eau.",
      "Pour un quotidien tourné vers la mer, à un rythme plus posé.",
      "Pour des hivers parmi les plus doux du pays.",
      ETUDIANTE,
      EQUILIBRE,
    ], insee);
  }
  // Lyon : aucun arrondissement sous 25 000, aucun n'était concerné ; 1er arrondissement inchangé.
  for (const insee of ARRONDISSEMENTS.filter((x) => x.startsWith("6938"))) assert.ok(commune(insee).population >= 25000, insee);
  assert.deepEqual(candidats("69381"), [ETUDIANTE, EQUILIBRE]);
});

test("candidats : l'exclusion ne retire l'identité qu'aux quatre arrondissements, sur tout l'index", () => {
  const retires = COMMUNES.filter((c) => reglePeriurbaine(c) && !V.buildIdentiteCandidates(c).includes(PERI)).map((c) => c.insee);
  assert.deepEqual(retires.sort(), ["13202", "13216", "75101", "75102"]);
  const gardes = COMMUNES.filter((c) => V.buildIdentiteCandidates(c).includes(PERI));
  assert.equal(gardes.length, 1784); // 1 788 sur main, moins les quatre arrondissements
  for (const c of gardes) assert.ok(reglePeriurbaine(c), c.insee); // aucune identité ajoutée par la correction
});

test("candidats : les vraies communes périurbaines de Paris, Lyon et Marseille la gardent", () => {
  // Sceaux (Hauts-de-Seine), Écully (Rhône), Allauch et Les Pennes-Mirabeau (Bouches-du-Rhône).
  const periph: Record<string, string> = { "92071": "00851", "69081": "00760", "13002": "00759", "13071": "00759" };
  for (const [insee, uu] of Object.entries(periph)) {
    const c = commune(insee);
    assert.equal(c.uu, uu, insee);
    assert.ok(c.population < 25000, insee);
    assert.equal(candidats(insee)[0], PERI, insee);
  }
});

test("candidats : petite commune hors unité urbaine et population absente, sans identité périurbaine", () => {
  // Allanche (Cantal) : hors unité urbaine, 794 habitants. Le récit de petite commune reste disponible.
  const allanche = commune("15001");
  assert.deepEqual([allanche.uu ?? null, allanche.population], [null, 794]);
  assert.equal(candidats("15001").includes(PERI), false);
  assert.ok(candidats("15001").includes("Pour la tranquillité d'une commune à taille humaine."));
  // Beaumont-en-Verdunois (Meuse) : commune « morte pour la France », population absente. Rien n'établit la règle.
  assert.equal(commune("55039").population ?? null, null);
  assert.equal(candidats("55039").includes(PERI), false);
  assert.equal(candidats("55039").at(-1), EQUILIBRE);
});

test("comparateur : trio nommé, l'identité affichée après assignIdentite", async () => {
  // Paris 1er avec deux vraies périurbaines : la phrase va à Sceaux, plus à Paris.
  const mixte = await V.seedComparaison(["75101", "92071", "69081"]);
  assert.deepEqual(mixte.trio.map((x: M) => [x.insee, x.identite]), [
    ["75101", ETUDIANTE],
    ["92071", PERI],
    ["69081", CROISSANCE],
  ]);
  // Trois arrondissements du centre de Paris : aucun ne la porte, et les trois identités restent distinctes.
  const centre = await V.seedComparaison(["75101", "75102", "75103"]);
  const ids = centre.trio.map((x: M) => x.identite);
  assert.deepEqual(ids, [ETUDIANTE, CROISSANCE, EQUILIBRE]);
  assert.equal(new Set(ids).size, 3);
  // Marseille 16e à côté d'Allauch : seule Allauch est « aux portes » de Marseille.
  const marseille = await V.seedComparaison(["13002", "13216", "13071"]);
  assert.deepEqual(marseille.trio.map((x: M) => [x.insee, x.identite]), [
    ["13002", PERI],
    ["13216", "Pour un quotidien méditerranéen, les pieds près de l'eau."],
    ["13071", "Pour des hivers parmi les plus doux du pays."],
  ]);
});

const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const projet = (departements: string[], preferences: M[]) =>
  ({ reformulation: "FUT-140", hardConstraints: { departements }, preferences: [...preferences, ...BASE] });
const ligne = (r: M) => [r.insee, r.compatibility, r.couverture?.etat ?? null];

test("Où vivre : la carte « Paris » ne dit plus « aux portes », rangs et scores identiques à main", async () => {
  const paris = await V.matchProjects(projet(["75"], [{ key: "vie_etudiante", weight: 3 }]));
  assert.deepEqual(paris.results.map(ligne), [["75101", 92, "complete"]]); // figé sur main
  assert.equal(paris.results[0].nom, "Paris");
  assert.equal(paris.results[0].identite, ETUDIANTE); // main : PERI
});

test("Où vivre : petite couronne, les vraies périurbaines gardent la phrase, classement inchangé", async () => {
  const o = await V.matchProjects(projet(["75", "92", "94"], [{ key: "acces_transports", weight: 3 }, { key: "cadre_calme", weight: 2 }]));
  // Résultats et pistes figés sur main (rang, commune, score, couverture), identités comprises : rien ne change ici.
  assert.deepEqual(o.results.map(ligne), [
    ["92047", 99, "complete"], ["94070", 99, "complete"], ["94056", 96, "complete"], ["94048", 96, "complete"], ["94053", 96, "complete"],
  ]);
  assert.deepEqual(o.pistes.map(ligne), [["94048", 96, "complete"], ["94053", 96, "complete"]]);
  assert.deepEqual(o.results.filter((r: M) => r.identite === PERI).map((r: M) => r.insee), ["92047", "94048"]);
  // Marseille et le littoral : mêmes rangs, mêmes scores, Châteauneuf-les-Martigues et Gignac-la-Nerthe restent « aux portes » de Marseille.
  const mer = await V.matchProjects(projet(["13"], [{ key: "proximite_mer", weight: 3 }]));
  assert.deepEqual(mer.results.map(ligne), [
    ["13202", 97, "complete"], ["13028", 97, "complete"], ["13026", 97, "complete"], ["13043", 97, "complete"], ["13081", 97, "complete"],
  ]);
  assert.deepEqual(mer.results.filter((r: M) => r.identite === PERI).map((r: M) => r.insee), ["13026", "13043"]);
});
