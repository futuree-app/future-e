// FUT-140 · UN ARRONDISSEMENT DE PARIS, LYON OU MARSEILLE N'EST PAS UNE COMMUNE PÉRIURBAINE.
//
// L'index range ces trois villes par arrondissement. La règle « périurbain » (commune de moins de 25 000 habitants
// dans une unité urbaine d'au moins 100 000) lisait la population de l'ARRONDISSEMENT : Paris 1er (15 919), Paris 2e,
// Marseille 2e et Marseille 16e recevaient « Pour vivre aux portes d'une grande ville, sans en habiter le centre ».
// Dans « Où vivre », la carte « Paris » portait cette phrase dès que Paris 1er représentait la ville.
//
// Correction narrative seulement : l'arrondissement est exclu de cette identité, la règle des communes ne change
// pas. Population, taille de ville, scores, couverture et rangs restent ceux de `main` (9866489e), figés ici.
//
// Réserve de la contre-revue (08/11/2026) : « Pour une ville étudiante à taille humaine » contredisait la taille de
// Paris, Bordeaux, Nantes, Toulouse. Le libellé devient « Pour profiter d'une vie étudiante bien présente ». Les
// conditions FUT-135 / FUT-141, l'ordre des candidats et la déduplication ne changent pas.
// Index réel et vrai moteur ; la route de synthèse reçoit un modèle simulé, aucun appel réseau ni Anthropic.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const racine = pathToFileURL(`${process.cwd()}/`).href;
// Doublures de FUT-155 : la route `synthesize-choix` s'importe sans modèle, sans PostHog ni Supabase réels.
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "ai": "export function streamText(a) { return globalThis.__fut140.stream(a); }",
  "@ai-sdk/anthropic": "export function anthropic(m) { return m; }",
  "@/lib/posthog-server": "export function getPostHogClient() { return { capture() {}, async shutdown() {} }; }",
  "@supabase/supabase-js": "export function createClient() { return { rpc: async () => ({ data: false, error: null }) }; }",
};
const hook = `
const doubles = ${JSON.stringify(doubles)};
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (doubles[spec] != null) return { url: "data:text/javascript," + encodeURIComponent(doubles[spec]), shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
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
let CHOIX: (r: unknown) => Promise<Response>;
let NextRequest: new (url: string, init: M) => unknown;
const appels: M[] = [];
(globalThis as M).__fut140 = {
  stream: (a: M) => { appels.push(a); return { textStream: (async function* () { yield "Synthèse simulée."; })() }; },
};
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  ({ POST: CHOIX } = await import("../app/api/comparateur-vie/synthesize-choix/route.ts"));
  ({ NextRequest } = await import("next/server.js" as string));
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines (taille de ville)
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
});
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;
const candidats = (insee: string): string[] => V.buildIdentiteCandidates(commune(insee));

const PERI = "Pour vivre aux portes d'une grande ville, sans en habiter le centre.";
const ETUDIANTE = "Pour profiter d'une vie étudiante bien présente.";
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
  // FUT-176 : et aux quatre villes-centres Insee de la règle (Audincourt, Nogent-sur-Oise, Béthune, Bruay-la-Buissière).
  assert.deepEqual(retires.sort(), ["13202", "13216", "25031", "60463", "62119", "62178", "75101", "75102"]);
  const gardes = COMMUNES.filter((c) => V.buildIdentiteCandidates(c).includes(PERI));
  // 1 788 sur main, moins les quatre arrondissements. FUT-176 : plus Porte des Pierres Dorées (69114, 4 185 habitants),
  // enfin rangée dans l'agglomération de Lyon, dont l'Insee la classe en banlieue (elle était « hors unité urbaine » faute
  // de figurer dans l'ancien fichier) ; moins quatre villes-centres au sens de l'Insee, où « sans en habiter le centre »
  // était faux (Audincourt, Nogent-sur-Oise, Béthune, Bruay-la-Buissière).
  assert.equal(gardes.length, 1781);
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

// ── Réserve de la contre-revue : le libellé étudiant ne parle plus de taille ─────────────────────────────────────

const ANCIEN_ETUDIANTE = "Pour une ville étudiante à taille humaine.";
const DOUX = "Pour des hivers parmi les plus doux du pays.";
const MONTAGNE = "Pour vivre en montagne, dans un climat plus supportable l'été.";
const GRANDE_VILLE = "Pour la vie d'une grande ville et tous ses services.";
const perms = (a: string[]): string[][] =>
  a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
const identites = async (insees: string[]) =>
  Object.fromEntries((await V.seedComparaison(insees)).trio.map((x: M) => [x.insee, x.identite]));

test("libellé : l'ancien n'existe plus nulle part, le nouveau garde exactement les 134 porteuses de FUT-141", () => {
  let porteuses = 0;
  for (const c of COMMUNES) {
    const cands: string[] = V.buildIdentiteCandidates(c);
    assert.equal(cands.includes(ANCIEN_ETUDIANTE), false, c.insee);
    if (cands.includes(ETUDIANTE)) porteuses += 1;
  }
  assert.equal(porteuses, 134); // même effectif que la règle FUT-141 : seul le texte a changé
  // Grandes villes : la phrase ne prête plus aucune taille. Position inchangée (après les hivers doux).
  for (const insee of ["33063", "44109", "31555"]) {
    assert.deepEqual(candidats(insee).slice(0, 4), [DOUX, ETUDIANTE, CROISSANCE, GRANDE_VILLE], insee);
  }
  // Témoins de tailles très différentes : Poitiers (pôle universitaire moyen), Corte (5 000 habitants, montagne).
  assert.deepEqual(candidats("86194").slice(0, 2), [ETUDIANTE, CROISSANCE]);
  assert.deepEqual(candidats("2B096").slice(0, 4), [MONTAGNE, "Pour vivre en montagne, au grand air.", "Pour chercher davantage de fraîcheur et un rythme plus posé.", ETUDIANTE]);
});

test("libellé : les exclusions FUT-135 / FUT-141 tiennent, sans tester une phrase que le moteur ne produirait plus", () => {
  // Le libellé testé est bien celui que le moteur rend (sinon toute assertion négative passerait dans le vide).
  assert.ok(candidats("86194").includes(ETUDIANTE));
  // Part étudiante du bassin inconnue : jamais l'identité, quel que soit le score.
  const sansPart = COMMUNES.filter((c) => c.etudes_dyn == null);
  assert.ok(sansPart.length > 0);
  for (const c of sansPart) assert.equal(V.buildIdentiteCandidates(c).includes(ETUDIANTE), false, c.insee);
  // Part intermédiaire (Montluçon 63, Gap 60, Vichy 62, Toulon 62) : exclues malgré un score de 68 à 75.
  for (const insee of ["03185", "05061", "03310", "83137"]) {
    assert.ok(commune(insee).etudes_dyn < 66 && V.subScore("vie_etudiante", commune(insee)) >= 55, insee);
    assert.equal(candidats(insee).includes(ETUDIANTE), false, insee);
  }
});

test("affichage : Paris, Bordeaux, Toulouse dans « Où vivre », Nantes en trio, rangs et scores figés", async () => {
  const projetEtudes = (dep: string) => projet([dep], [{ key: "vie_etudiante", weight: 3 }]);
  const paris = await V.matchProjects(projetEtudes("75"));
  assert.deepEqual([paris.results[0].nom, paris.results[0].identite], ["Paris", ETUDIANTE]);
  const gironde = await V.matchProjects(projetEtudes("33"));
  assert.deepEqual(gironde.results.slice(0, 3).map(ligne), [["33039", 96, "complete"], ["33063", 96, "complete"], ["33069", 96, "complete"]]);
  assert.equal(gironde.results[1].identite, ETUDIANTE); // Bordeaux
  const hg = await V.matchProjects(projetEtudes("31"));
  assert.deepEqual(hg.results.slice(0, 3).map(ligne), [["31035", 97, "complete"], ["31446", 97, "complete"], ["31555", 97, "complete"]]);
  assert.equal(hg.results[2].identite, ETUDIANTE); // Toulouse
  // Nantes : elle prend « hivers doux » en tête de trio, la phrase étudiante quand Bordeaux l'a prise avant elle.
  assert.equal((await identites(["44109", "75101"]))["44109"], DOUX);
  assert.equal((await identites(["33063", "44109"]))["44109"], ETUDIANTE);
  for (const r of [...paris.results, ...gironde.results, ...hg.results]) assert.notEqual(r.identite, ANCIEN_ETUDIANTE, r.insee);
});

test("permutations : six ordres par trio, l'attribution suit l'ordre d'affichage comme avant", async () => {
  // Paris 1er · Sceaux · Écully : Paris 1er a toujours la phrase étudiante, jamais « aux portes » ; celle-ci va à la
  // première des deux vraies périurbaines dans l'ordre d'affichage.
  for (const p of perms(["75101", "92071", "69081"])) {
    const id = await identites(p);
    assert.equal(id["75101"], ETUDIANTE, p.join(","));
    assert.equal(id[p.find((x) => x !== "75101")!], PERI, p.join(","));
    assert.equal(new Set(Object.values(id)).size, 3, p.join(","));
  }
  // Bordeaux · Nantes · Toulouse : mêmes candidats en tête, donc la position décide (1re « doux », 2e étudiante).
  for (const p of perms(["33063", "44109", "31555"])) {
    const r = (await V.seedComparaison(p)).trio.map((x: M) => x.identite);
    assert.deepEqual(r, [DOUX, ETUDIANTE, CROISSANCE], p.join(","));
  }
  // Poitiers · Corte · Paris 15e : Corte garde la montagne, la phrase étudiante va à la première qui la porte.
  for (const p of perms(["86194", "2B096", "75115"])) {
    const id = await identites(p);
    assert.equal(id["2B096"], MONTAGNE, p.join(","));
    assert.equal(id[p.find((x) => x !== "2B096")!], ETUDIANTE, p.join(","));
    assert.equal(new Set(Object.values(id)).size, 3, p.join(","));
  }
  // Trois arrondissements du centre : quand Paris 2e passe en tête, Paris 1er et Paris 3e n'ont plus de candidat libre
  // et prennent tous deux le repli neutre (comportement prévu d'`assignIdentite`, documenté dans l'audit FUT-140).
  const ordre = async (insees: string[]) => (await V.seedComparaison(insees)).trio.map((x: M) => x.identite);
  assert.deepEqual(await ordre(["75102", "75101", "75103"]), [ETUDIANTE, EQUILIBRE, EQUILIBRE]);
  assert.deepEqual(await ordre(["75101", "75102", "75103"]), [ETUDIANTE, CROISSANCE, EQUILIBRE]);
});

test("cohérence : la carte, le Pack et le champ transmis à synthesize-choix portent la même identité", async () => {
  const parsed = projet(["33"], [{ key: "vie_etudiante", weight: 3 }]);
  const o = await V.matchProjects(parsed);
  const tete = o.results.slice(0, 3);
  // Pack rejoué sur le même projet : même trio, mêmes identités que les cartes.
  const pack = await V.rejouerPack(parsed, tete.map((r: M) => r.insee));
  assert.equal(pack.trioRecompose, false);
  assert.deepEqual(pack.trio.map((r: M) => [r.insee, r.identite]), tete.map((r: M) => [r.insee, r.identite]));
  // Pack recomposé (communes achetées hors classement) : identités de la comparaison nommée.
  const nomme = ["33063", "44109", "31555"];
  const recompose = await V.rejouerPack(parsed, nomme);
  assert.equal(recompose.trioRecompose, true);
  const seed = await V.seedComparaison(nomme);
  assert.deepEqual(recompose.trio.map((r: M) => r.identite), seed.trio.map((r: M) => r.identite));
  // La route reçoit le trio tel que la page le tient : le champ part au modèle sans être réécrit.
  appels.length = 0;
  const corps = { communes: seed.trio.map((r: M) => ({ nom: r.nom, region: r.region, identite: r.identite, compromis: r.compromis, distinctive: r.distinctive })), divergence: { domine: false, dominatorInsee: null } };
  const res = await CHOIX(new NextRequest("http://localhost/api/comparateur-vie/synthesize-choix", {
    method: "POST", body: JSON.stringify(corps), headers: { "content-type": "application/json", "x-forwarded-for": "10.140.0.1" },
  }));
  assert.equal(res.status, 200);
  const donnees = JSON.parse(appels.at(-1)!.prompt.split("DONNÉES :\n")[1]);
  assert.deepEqual(donnees.communes.map((c: M) => c.identite), [DOUX, ETUDIANTE, CROISSANCE]);
  assert.equal(JSON.stringify(donnees).includes("taille humaine"), false);
});
