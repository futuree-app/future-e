// FUT-147 · NON-RÉGRESSION. Ajouter la mémoire des incendies ne change :
//   - ni les communes, ni les scores, raisons, compromis, couvertures et paliers du comparateur : les mêmes
//     projets et les mêmes trios, rejoués sur la branche, rendent EXACTEMENT la référence capturée sur `main`
//     avant le chantier (`scripts/fut147/capturer-reference.mjs`, commit 4d75603f). Seuls diffèrent la ligne
//     « Incendies observés » du Dossier comparatif et le champ `incendiesObserves` des cartes ;
//   - ni l'empreinte du snapshot Territoire, donc ni la clé du cache de la synthèse rédigée (arbitrage C6) :
//     une synthèse encore valide est servie sans aucun appel au modèle ;
//   - ni ce que reçoivent la synthèse rédigée et AskFuture.
// Aucun appel réseau, aucun appel à un modèle : le générateur est un espion qui échoue s'il est appelé.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { buildTerritoireSnapshot } from "./territoire/facts.ts";
import { withHash } from "./facts/hash.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import { synthesisCacheKey } from "./territoire/synthesis-cache.ts";
import { ensureTerritoireSynthesis } from "./territoire/synthesis-ensure.ts";
import type { TerritoireStore } from "./server/territoire-facts-store.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type M = any;
let V: M;
let L: M;

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

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  L = await import("./comparateur/lecture-ask.ts");
});

// FUT-138 : le trait distinctif des prix dit un fait (« les prix de vente les plus bas »), plus une accessibilité
// (« le marché immobilier le plus accessible ») : seul ce libellé change dans la référence, ni commune, ni score, ni ordre.
// FUT-176 : la dimension « Isolement » mesure la population de l'agglomération, pas un « bassin de vie » (un autre zonage
// Insee) ni une offre de services. Seuls ses libellés changent (paliers, raison, aide) ; ni commune, ni score, ni ordre.
// « bassin de vie de proximité » n'y désigne que La Broque (67066), dans une unité urbaine : « dans une petite agglomération ».
const REF = JSON.parse(
  readFileSync("src/lib/__fixtures__/fut147-reference-comparateur.json", "utf8")
    .replaceAll("le marché immobilier le plus accessible", "les prix de vente les plus bas")
    .replaceAll("Bassin de vie étendu", "Grande agglomération")
    .replaceAll("Bassin de proximité", "Agglomération moyenne")
    .replaceAll("Bassin de vie restreint", "Petite agglomération ou commune")
    .replaceAll("au cœur d'un vaste bassin de vie", "dans une grande agglomération")
    .replaceAll("bassin de vie bien pourvu", "dans une agglomération de taille moyenne")
    .replaceAll("bassin de vie de proximité", "dans une petite agglomération")
    .replaceAll("La taille du bassin de vie qui dessert le territoire.", "Le nombre d'habitants de l'agglomération, ou de la commune quand elle est hors agglomération. Il ne mesure pas à lui seul l'accès aux services ni aux transports.")
    // FUT-178 : les libellés de la nature disent le SECTEUR (la commune et ses voisines retenues, parfois aucune), eau
    // comprise, ni « forêts », ni « grands espaces », ni « autour », ni un « lieu de vie ». Seuls ces libellés changent.
    .replace(/la plus proche de grands espaces naturels des (deux|trois)/g, "la plus riche des $1 en espaces naturels ou en eau dans son secteur")
    .replaceAll("forêts et espaces naturels à proximité", "beaucoup d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("peu d'espaces naturels à proximité", "peu d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("nature présente, sans abonder", "espaces naturels ou eau présents dans le secteur, sans abonder")
    .replaceAll("se distingue par ses espaces naturels", "se distingue par les espaces naturels et l'eau de son secteur")
    .replaceAll("Beaucoup de nature autour", "Beaucoup d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("Peu de nature autour", "Peu d'espaces naturels ou d'eau dans le secteur")
    .replaceAll('"Nature présente"', '"Espaces naturels ou eau présents"')
    .replaceAll("davantage de nature autour", "davantage d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("présence de nature intermédiaire", "présence intermédiaire d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("moins de nature autour", "moins d'espaces naturels ou d'eau dans le secteur")
    .replaceAll("La présence d'espaces naturels autour du lieu de vie.", "Espaces naturels et eau, dans la commune et les communes voisines retenues (centres à moins de 15 km, liste parfois incomplète). Pas les abords d'une adresse."),
);
const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
// Les mêmes entrées que la capture (scripts/fut147/capturer-reference.mjs), recopiées : la référence ne
// dépend pas du code testé.
const PROJETS: Record<string, M[]> = {
  "feu 3 + nature 2 + cadre calme 2": [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
  "feu 2 + soins 2 + étés frais 1": [{ key: "faible_risque_feu", weight: 2 }, { key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  "feu 3 seule": [{ key: "faible_risque_feu", weight: 3 }],
  "nature 2 + calme 2 (sans feu)": [{ key: "nature", weight: 2 }, { key: "calme_sonore", weight: 2 }],
  "mer 3 + feu 1": [{ key: "proximite_mer", weight: 3 }, { key: "faible_risque_feu", weight: 1 }],
};
const TRIOS: Record<string, string[]> = {
  "Finistère intérieur": ["29016", "29162", "29103"],
  "Maures": ["83067", "83063", "83148"],
  "Marseille, Aix, Toulon": ["13208", "13001", "83137"],
  "Lyon, Brasparts": ["69383", "29016"],
};
const extraire = (r: M) => ({
  insee: r.insee, compatibility: r.compatibility, reasons: r.reasons, tradeoff: r.tradeoff, compromis: r.compromis,
  decouverte: r.decouverte, distinctive: r.distinctive, identite: r.identite, couverture: r.couverture ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false, signaux: r.signaux, inondation: r.inondation ?? null,
});
/** Le Dossier comparatif SANS la ligne ajoutée : ce qui doit rester identique à la référence. */
const sansIncendies = (cc: M) => ({ ...cc, themes: cc.themes.map((t: M) => ({ ...t, lignes: t.lignes.filter((l: M) => l.id !== "incendies_observes") })) });
const ligneIncendies = (cc: M) => cc.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "incendies_observes");

for (const [nom, prefs] of Object.entries(PROJETS)) {
  test(`comparateur « ${nom} » : communes, scores, raisons, compromis et Dossier comparatif identiques à main`, async () => {
    const o = await V.matchProjects({ reformulation: nom, preferences: [...prefs, ...BASE], hardConstraints: {} });
    const ref = REF.projets[nom];
    assert.equal(o.candidates, ref.candidates);
    assert.deepEqual(o.results.map(extraire), ref.results);
    assert.deepEqual(o.pistes.map(extraire), ref.pistes);
    assert.deepEqual(sansIncendies(o.comparaisonComplete), ref.comparaisonComplete);
    // La ligne de carte n'existe qu'avec la priorité feu, et seulement pour un feu d'au moins 10 ha.
    const feu = prefs.some((p) => p.key === "faible_risque_feu");
    for (const r of [...o.results, ...o.pistes]) {
      if (!feu) assert.equal(r.incendiesObserves, undefined, r.insee);
      if (r.incendiesObserves) assert.match(r.incendiesObserves, /^Incendies observés : un incendie dont le départ a été enregistré .* ha au total en \d{4}\.$/);
    }
    // Le Dossier comparatif n'a aucun gagnant sur cette ligne, quand elle existe.
    const l = ligneIncendies(o.comparaisonComplete);
    if (l) assert.deepEqual(l.avantage, { type: "neutre" });
  });
}

for (const [nom, insees] of Object.entries(TRIOS)) {
  test(`Dossier comparatif « ${nom} » : tout est identique à main hors « Incendies observés »`, async () => {
    const s = await V.seedComparaison(insees);
    assert.deepEqual(s.trio.map(extraire), REF.trios[nom].trio);
    assert.deepEqual(sansIncendies(s.comparaison), REF.trios[nom].comparaison);
  });
}

test("Dossier comparatif : la ligne « Incendies observés » suit « Météo propice aux feux », sans gagnant ni alerte", async () => {
  const s = await V.seedComparaison(TRIOS["Finistère intérieur"]);
  const risques = s.comparaison.themes.find((t: M) => t.id === "risques");
  const ids = risques.lignes.map((l: M) => l.id);
  assert.equal(ids[ids.indexOf("feu") + 1], "incendies_observes");
  const l = ligneIncendies(s.comparaison);
  assert.equal(l.label, "Incendies observés");
  assert.deepEqual(l.avantage, { type: "neutre" });
  assert.deepEqual(l.cellules.map((c: M) => c.palier), [
    "Un feu de 1 917 ha au total en 2022",
    "Pas de feu de 10 ha ou plus enregistré au départ de la commune",
    "Pas de feu de 10 ha ou plus enregistré au départ de la commune",
  ]);
  assert.ok(l.cellules.every((c: M) => c.alerte === false));
  // La ligne météo ne reçoit rien : son qualificatif est celui de main.
  const feuRef = REF.trios["Finistère intérieur"].comparaison.themes.flatMap((t: M) => t.lignes).find((x: M) => x.id === "feu");
  assert.deepEqual(risques.lignes.find((x: M) => x.id === "feu"), feuRef);
});

test("Dossier comparatif : pas de ligne quand aucune commune du trio n'a de feu de 10 ha (Marseille compris, à 1 065 ha, l'a)", async () => {
  const m = await V.seedComparaison(TRIOS["Marseille, Aix, Toulon"]);
  const l = ligneIncendies(m.comparaison);
  assert.equal(l.cellules[0].qualifier, "parti de Marseille, toute la ville");
  const sans = await V.seedComparaison(["69383", "69384"]);
  assert.equal(ligneIncendies(sans.comparaison), undefined);
});

test("AskFuture du comparateur : le contexte transmis ne porte pas les incendies observés", async () => {
  const o = await V.matchProjects({ reformulation: "x", preferences: [...PROJETS["feu 3 seule"]!, ...BASE], hardConstraints: {} });
  const top = o.results.slice(0, 3).map((r: M) => ({ ...r, incendiesObserves: r.incendiesObserves ?? "Incendies observés : TEST" }));
  const ctx = L.contexteAsk({ reformulation: "x", criteres: [], inondationDeclaree: false, outcome: o, synthese: "", top });
  assert.doesNotMatch(JSON.stringify(ctx), /Incendies observés|incendiesObserves/);
});

test("synthèse rédigée du comparateur : la charge du navigateur ne liste pas le champ", () => {
  const src = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  const charge = src.slice(src.indexOf("results: top.map((r) => ({"), src.indexOf("outcome: { perfectMatch"));
  assert.ok(charge.length > 100);
  assert.doesNotMatch(charge, /incendies/i);
  assert.doesNotMatch(readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8"), /incendies|bdiff/i);
});

// ── Territoire : l'empreinte et le cache de la synthèse ─────────────────────────────────────

// Calculés sur `main` (4d75603f) avant FUT-147, avec la même entrée et la même date :
//   empreinte cc3ac648613039db2c467665f3cb3102cf4097490b6884da6b1f3731aa93b53f,
//   clé       7f7921d5b9e6f3060e3e327655130e9a808dfefd97d7cac576c43c5833adc5f9.
// FUT-175 (09/11/2026) les change VOLONTAIREMENT : registre `territoire-facts@2` (parts OSO rapportées aux terres,
// eau à part, limites de couverture OSO) et contrat `territoire-synthese@5`. Recalculées sur la branche FUT-175
// (reprise du 09/11/2026, après contre-revue), même entrée, même date ; première version de la PR #140 :
// c9bd9012e1b50deaf3e8fface6f31287bf3fcaf38945c1bb5dcec6df5fdab91a / 9129dcc2076e342f060140436f220ba14c805bd3a97e4ceb304a923b9544d39d. Ce que
// ces deux tests gardent ne change pas : aucun fait BDIFF dans le snapshot, et une synthèse valide servie sans appel.
const HASH_MAIN = "6f4c52b2c81966ef93cadeba5803cf1b118b262eae2b62b9e4a46c792a3468d3";
// Convergence FUT-175 + FUT-176 : l'empreinte est celle de FUT-175 (registre `territoire-facts@2`, FUT-176 ne change que
// le type du rôle) ; la clé suit le contrat commun `territoire-synthese@6`. Clé de la PR #140 seule (@5) :
// de0d9de4af59732e9f99f23c8fefa61b59530ac1ec3812eae40c06cd592d0930.
// FUT-177 (09/11/2026) : l'empreinte ne bouge pas (registre intact) ; la clé suit le contrat `territoire-synthese@7`.
// Clé de main au contrat @6 : 5b0eb94cfecef936cb0ba4abb7d72a93e48a86df3e5ddcbe6056b14672e96c72.
const CLE_MAIN = "fd9b97308224b1cef6dbf86d637d8f316b5f1741d77c0fc16aba121115135b4b";

/**
 * FUT-175 · RÉFÉRENCE FIGÉE (reprise après contre-revue du 09/11/2026). Les lignes que ce chantier change dans le
 * contrat et le registre, par rapport à 4d75603f, sont écrites UNE FOIS dans `__fixtures__/fut175-lignes-admises.json`.
 * Elles ne sont plus relues sur un diff vivant : une modification future, même sans rapport avec les feux, y est
 * étrangère et fait échouer la garde. Chaque ligne admise ne couvre qu'UNE occurrence (multiensemble), et une
 * ligne admise que le diff ne contient plus fait aussi échouer : la référence ne survit pas à une retouche.
 * Pour la changer, un ticket la régénère explicitement et le dit dans ce commentaire.
 * Convergence FUT-176 (09/11/2026) : la ligne « +… territoire-synthese@5 » en est retirée ; la version commune @6 est
 * admise avec les lignes de FUT-176 (`LIGNES_CONTRAT_FUT176`). Le « -… @4 » retiré y reste.
 */
const FUT175_ADMISES = JSON.parse(readFileSync("src/lib/__fixtures__/fut175-lignes-admises.json", "utf8")) as Record<string, string[]>;
const FEUX = /bdiff|incendi|feux? de for|MemoireIncendies/i;

function lignesDiff(base: string, f: string): string[] {
  const diff = execFileSync("git", ["diff", "--no-color", "-U0", base, "--", f], { encoding: "utf8", maxBuffer: 1 << 26 });
  return diff.split("\n").filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
}

/** Retire de `lignes` une occurrence de chaque ligne admise ; rend le reste et les admises restées sans emploi. */
function retirerAdmises(lignes: readonly string[], admises: readonly string[]): { reste: string[]; orphelines: string[] } {
  const stock = new Map<string, number>();
  for (const a of admises) stock.set(a, (stock.get(a) ?? 0) + 1);
  const reste: string[] = [];
  for (const l of lignes) {
    const n = stock.get(l) ?? 0;
    if (n > 0) stock.set(l, n - 1);
    else reste.push(l);
  }
  const orphelines = [...stock].flatMap(([l, n]) => Array<string>(n).fill(l));
  return { reste, orphelines };
}

/** Les lignes changées depuis 4d75603f, moins EXACTEMENT celles de FUT-175 ; échoue si la référence est périmée. */
function horsFut175(f: string, lignes: readonly string[]): string[] {
  const admises = FUT175_ADMISES[f];
  assert.ok(admises?.length, `aucune référence FUT-175 pour ${f}`);
  for (const l of admises) assert.doesNotMatch(l, FEUX, l);
  const { reste, orphelines } = retirerAdmises(lignes, admises);
  assert.deepEqual(orphelines, [], `référence FUT-175 périmée pour ${f} : ces lignes admises ne sont plus dans le diff`);
  return reste;
}

const CONTRAT = "src/lib/territoire/synthesis-contract.ts";
const REGISTRE = "src/lib/territoire/facts.ts";

/**
 * FUT-177 · RÉFÉRENCE FIGÉE, même principe que FUT-175. Les lignes que FUT-177 change dans le contrat par rapport à
 * bab5eb49 (main, après FUT-175 + FUT-176) sont écrites UNE FOIS dans `__fixtures__/fut177-lignes-admises.json`, au
 * format `git diff -U0`, en-têtes « @@ » compris. `avantFut177` les annule sur le diff depuis 4d75603f : une ligne « + » de FUT-177 est
 * retirée (une occurrence) ; une ligne « - » de FUT-177 restaure la ligne « + » que main avait ajoutée, ou retire la
 * ligne « - » d'origine. Une ligne admise introuvable fait échouer : la référence ne survit pas à une retouche.
 * Aucune ligne FUT-177 ne parle des feux ; le registre (facts.ts) n'est pas touché par FUT-177.
 */
const FUT177_ADMISES = JSON.parse(readFileSync("src/lib/__fixtures__/fut177-lignes-admises.json", "utf8")) as Record<string, string[]>;

function avantFut177(f: string, lignes: readonly string[]): string[] {
  const delta = FUT177_ADMISES[f] ?? [];
  const reste = [...lignes];
  // Le delta, au format `git diff -U0`, garde ses en-têtes « @@ » : chaque bloc a ses lignes « - » puis ses lignes « + ».
  // La ligne restaurée reprend la place du bloc : la garde du contrat compare des listes ORDONNÉES.
  const blocs: { moins: string[]; plus: string[] }[] = [];
  for (const l of delta) {
    assert.doesNotMatch(l, FEUX, l);
    if (l.startsWith("@@")) blocs.push({ moins: [], plus: [] });
    else if (l.startsWith("-")) blocs.at(-1)!.moins.push(l);
    else blocs.at(-1)!.plus.push(l);
  }
  for (const { moins, plus } of blocs) {
    // Les lignes « + » d'un bloc se cherchent comme une SÉQUENCE contiguë : « /** », « */ » ou une ligne vide
    // existent ailleurs dans le diff, une recherche ligne à ligne retirerait celles d'un autre ticket.
    let place = -1;
    if (plus.length > 0) {
      for (let i = 0; i + plus.length <= reste.length && place === -1; i++) {
        if (plus.every((l, k) => reste[i + k] === l)) place = i;
      }
      assert.ok(place !== -1, `référence FUT-177 périmée pour ${f} : ${plus[0]}`);
      reste.splice(place, plus.length);
    }
    const restaurees: string[] = [];
    for (const l of moins) {
      const i = reste.indexOf(l);
      if (i !== -1) reste.splice(i, 1); // une ligne d'origine (4d75603f) que FUT-177 retire
      else restaurees.push(`+${l.slice(1)}`); // une ligne que main avait ajoutée et que FUT-177 remplace
    }
    reste.splice(place === -1 ? reste.length : place, 0, ...restaurees);
  }
  return reste;
}

/** La garde du contrat de synthèse, sur une liste de lignes changées depuis 4d75603f. */
function verifierContrat(lignes: readonly string[]): void {
  const changees = horsFut175(CONTRAT, avantFut177(CONTRAT, lignes));
  // Convergence FUT-175 + FUT-176 : la version commune @6 et les lignes du rôle territorial sont celles de FUT-176
  // (`LIGNES_CONTRAT_FUT176`) ; la ligne « @5 » de FUT-175 a été retirée de sa référence figée, qui garde le « @4 » retiré.
  assert.deepEqual(changees.filter((l) => FUT163.includes(l)), FUT163);
  assert.deepEqual(changees.filter((l) => !FUT163.includes(l)), LIGNES_CONTRAT_FUT176);
  for (const l of changees) assert.doesNotMatch(l, FEUX, l);
}

const FUT163 = [
    '+import { lireEcoulement } from "../eaufrance-ecoulement.ts";',
    "-    cours_eau_a_sec_observe: river?.isDry ? { nom: river.riverName ?? null } : null,",
    "+    // FUT-163 (01/11/2026) : l'état BRUT décide, jamais `isDry`. Un snapshot enregistré garde le booléen du jour de",
    "+    // sa collecte ; « Ecoulement non visible » avec `isDry: true` n'y est pas un assec.",
    '+    cours_eau_a_sec_observe: river && lireEcoulement(river).etat === "assec" ? { nom: river.riverName ?? null } : null,',
];
const LIGNES_CONTRAT_FUT176: string[] = [
  "+import { normaliserRoleUrbain, type RoleUrbain } from \"./statut-urbain.ts\";",
  "+// @6 (FUT-175 + FUT-176) : parts OSO rapportées aux terres, eau à part (FUT-175) ; rôle territorial lu au statut Insee,",
  "+// arrondissements, consigne et contrôle contre sa surinterprétation (FUT-176). Les deux @5 de branche ne sont jamais sortis.",
  "+export const SYNTHESIS_CONTRACT_VERSION = `territoire-synthese@6:${SYNTHESIS_MODEL}`;",
  "-const ROLE_TEXT: Record<UrbanRole[\"role\"], string> = {",
  "-  isolee: \"commune isolée, hors agglomération\",",
  "-  pole: \"principal pôle de son agglomération\",",
  "-  agglo: \"commune d'une agglomération\",",
  "+// FUT-176 : le rôle dit au modèle (et au patron déterministe), en mots courants, au statut Insee. Jamais",
  "+// « isolée » (le terme Insee « ville isolée » veut dire « agglomération d'une seule commune »), jamais « pôle »,",
  "+// jamais « ville » (une commune de banlieue de 171 habitants n'en est pas une). Statut inconnu : aucun rôle.",
  "+export const ROLE_TEXT: Record<RoleUrbain, string | null> = {",
  "+  ville_centre: \"au centre de son agglomération\",",
  "+  banlieue: \"commune de banlieue de son agglomération\",",
  "+  ville_isolee: \"seule commune de son agglomération\",",
  "+  hors_uu: \"hors de toute agglomération (aucun ensemble bâti continu de 2 000 habitants)\",",
  "+  dans_agglomeration: \"commune d'une agglomération\",",
  "+  inconnu: null,",
  "+/**",
  "+ * FUT-176 (contre-revue) : un arrondissement de Paris, Lyon ou Marseille n'a pas de statut Insee propre. L'index lui",
  "+ * prête celui de sa commune (ville-centre), mais Paris 20e n'est pas « au centre de son agglomération » : c'est Paris",
  "+ * qui l'est. Le rôle transmis dit donc l'appartenance à la commune, et le statut reste celui de la commune entière.",
  "+ * Les autres faits (population, densité…) restent ceux de l'arrondissement.",
  "+ */",
  "+export const ROLE_TEXT_ARRONDISSEMENT = \"arrondissement d'une commune qui est au centre de son agglomération (le statut est celui de la commune entière, pas de l'arrondissement)\";",
  "+",
  "+/** Le rôle territorial transmis au modèle, ou null quand on ne sait rien (aucun texte n'est alors produit). */",
  "+export function roleTerritorialPourSynthese(role: UrbanRole | null): Record<string, unknown> | null {",
  "+  if (!role) return null;",
  "+  const r = normaliserRoleUrbain(role.role);",
  "+  if (role.arrondissementDe) {",
  "+    // Seul un arrondissement d'une ville-centre est connu (Paris, Lyon, Marseille). Un autre rôle serait une incohérence.",
  "+    if (r !== \"ville_centre\") return null;",
  "+    return {",
  "+      role: ROLE_TEXT_ARRONDISSEMENT,",
  "+      commune: role.arrondissementDe,",
  "+      agglomeration: role.uuLabel,",
  "+      population_agglomeration: role.uuPop,",
  "+    };",
  "+  }",
  "+  const texte = ROLE_TEXT[r];",
  "+  if (!texte) return null;",
  "+  return {",
  "+    role: texte,",
  "+    agglomeration: r === \"hors_uu\" ? null : role.uuLabel,",
  "+    population_agglomeration: r === \"hors_uu\" ? null : role.uuPop,",
  "+  };",
  "+}",
  "+",
  "-      role_territorial: role",
  "-        ? { role: ROLE_TEXT[role.role], agglomeration: role.uuLabel, population_agglomeration: role.uuPop }",
  "-        : null,",
  "+      role_territorial: roleTerritorialPourSynthese(role),",
  "+- Rôle territorial (\"role_territorial\") : c'est un classement statistique de l'Insee, qui dit seulement si la commune fait partie d'un ensemble bâti continu d'au moins 2 000 habitants, et à quelle place. Reprenez-le tel quel. N'en déduisez jamais la présence de services ou de commerces, l'animation, l'isolement, ni un rôle de \"pôle\" ou de \"centre de vie\" pour les environs. N'écrivez jamais que la commune est \"isolée\", et n'appelez pas \"ville\" une commune que le payload ne présente pas comme telle. Quand le rôle présente un arrondissement, c'est la commune nommée (\"commune\"), pas l'arrondissement, qui est au centre de l'agglomération : n'écrivez jamais que l'arrondissement est une ville-centre ou au centre de l'agglomération. S'il est absent, n'en parlez pas.",
];

/** La garde du registre des faits, sur une liste de lignes changées depuis 4d75603f. */
function verifierRegistre(lignesChangees: readonly string[]): void {
  const lignes = horsFut175(REGISTRE, lignesChangees);
  // FUT-176 : le type du rôle territorial suit le statut Insee ; c'est la seule ligne retirée admise.
  const RETIREE_FUT176 = '-export type UrbanRole = { role: "isolee" | "pole" | "agglo"; uuLabel: string | null; uuPop: number | null };';
  assert.deepEqual(lignes.filter((l) => l.startsWith("-") && l !== RETIREE_FUT176), [], "aucune ligne retirée (hors le type du rôle, FUT-176)");
  const admises = [
    /^\+ {2}\/\*\*$/, /^\+ {3}\* FUT-160 · /, /^\+ {3}\* comme VigiEau, et plus `missing`\./, /^\+ {3}\*\/$/,
    /^\+ {2}georisquesIndisponible\?: boolean;$/, /^\+ {2}catnatIndisponible\?: boolean;$/,
    /^\+ {6}status: i\.georisques \? "ok" : i\.georisquesIndisponible \? "source_unavailable" : "missing",$/,
    /^\+ {6}status: i\.catnat \? "ok" : i\.catnatIndisponible \? "source_unavailable" : "missing",$/,
    /^\+ {2}\/\*\* FUT-165 : la lecture de l'écoulement a échoué ; le fait passe `source_unavailable`, jamais « aucune observation »\. \*\/$/,
    /^\+ {2}droughtIndisponible\?: boolean;$/,
    /^\+ {6}\.\.\.\(i\.drought == null && i\.droughtIndisponible \? \{ status: "source_unavailable" as const \} : \{\}\),$/,
    // FUT-12 : la provenance s'applique depuis `provenances.ts`, en une ligne, sans toucher un fait.
    /^\+import \{ avecProvenances \} from "\.\/provenances\.ts";$/,
    /^\+ {2}facts\.splice\(0, facts\.length, \.\.\.avecProvenances\(facts, i\)\); \/\/ FUT-12 : .*$/,
    // FUT-176 : le rôle territorial au statut Insee (type seulement ; le fait et sa source sont intacts).
    /^\+import type \{ RoleUrbain, RoleUrbainAncien \} from "\.\/statut-urbain\.ts";$/,
    /^\+\/\/ FUT-176 : le rôle suit le STATUT Insee/, /^\+\/\/ Un snapshot ancien peut encore porter/, /^\+\/\/ `normaliserRoleUrbain`\. `arrondissementDe` : la ville d'un arrondissement/,
    /^\+export type UrbanRole = \{ role: RoleUrbain \| RoleUrbainAncien; uuLabel: string \| null; uuPop: number \| null; arrondissementDe\?: string \};$/,
    /^-export type UrbanRole = \{ role: "isolee" \| "pole" \| "agglo"; uuLabel: string \| null; uuPop: number \| null \};$/,
  ];
  for (const l of lignes) assert.ok(admises.some((a) => a.test(l)), `ligne non admise dans ${REGISTRE} : ${l}`);
}

test("Territoire : l'empreinte du snapshot et la clé du cache de synthèse sont celles de main", () => {
  const s = withHash(buildTerritoireSnapshot(chatelaillonInputs(), "2026-10-01T00:00:00.000Z"));
  assert.equal(s.hash, HASH_MAIN);
  assert.equal(synthesisCacheKey(s.hash, "gwl20"), CLE_MAIN);
  assert.ok(!s.facts.some((f) => /incendie|bdiff|wildfire_history/i.test(f.key)), "aucun fait BDIFF dans le snapshot");
});

test("Territoire : une synthèse encore valide est servie sans AUCUN appel au modèle", async () => {
  const s = withHash(buildTerritoireSnapshot(chatelaillonInputs(), "2026-10-01T00:00:00.000Z"));
  let appels = 0;
  const store: TerritoireStore = {
    persistSnapshot: async () => true,
    readSnapshot: async () => s,
    readSynthesis: async (key) => (key === CLE_MAIN ? { status: "ready", text: "Synthèse déjà rédigée.", origin: "model" } : null),
    readSyntheses: async () => new Map(),
    claim: async () => { throw new Error("claim ne doit pas être appelé"); },
    complete: async () => { throw new Error("complete ne doit pas être appelé"); },
    fail: async () => { throw new Error("fail ne doit pas être appelé"); },
    release: async () => {},
  };
  const r = await ensureTerritoireSynthesis(s, "gwl20", {
    store,
    reserveBudget: async () => { appels++; return true; },
    generate: async () => { appels++; throw new Error("appel au modèle interdit"); },
  });
  assert.equal(r.status, "ready");
  assert.equal(r.status === "ready" && r.modelCalls, 0);
  assert.equal(appels, 0);
});

test("Territoire : la mémoire des incendies est lue à côté du snapshot, jamais dedans", () => {
  const page = readFileSync("src/app/(account)/rapport/quartier/page.tsx", "utf8");
  assert.match(page, /getMemoireIncendies\(inseeCode\)/);
  assert.match(page, /incendies=\{incendies\}/);
  for (const f of ["src/lib/server/territoire-snapshot.ts", "src/lib/territoire/facts.ts", "src/lib/territoire/synthesis-contract.ts", "src/lib/territoire/screen.ts"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /bdiff|incendies-observes|MemoireIncendies/i, f);
  }
});

// FUT-163 (01/11/2026, contre-revue de la PR #124) a dû toucher la projection : `cours_eau_a_sec_observe` lisait
// `isDry`, qu'un snapshot ancien peut porter à vrai pour « Ecoulement non visible ». Elle lit désormais l'état
// brut ONDE. Le contrat n'est donc plus identique à 4d75603f : ce test admet EXACTEMENT ces lignes, et aucune ne
// parle des feux. Toute autre modification du contrat le fait échouer.
// FUT-175 (09/11/2026) : la projection de l'occupation des sols (terres, eau à part) ; ses lignes exactes sont figées
// dans `__fixtures__/fut175-lignes-admises.json` (cf. `horsFut175`).
test("IA : le contrat de synthèse n'a changé que de la lecture ONDE (FUT-163), et rien sur les feux", () => {
  verifierContrat(lignesDiff("4d75603f", CONTRAT));
  assert.doesNotMatch(readFileSync(CONTRAT, "utf8"), /bdiff|incendies-observes|MemoireIncendies/i);
});

// FUT-164 (30/10/2026) a dû réécrire le bloc eau potable de l'assistant (lecture par réseau, FUT-152). Le prompt
// n'est donc plus identique à 4d75603f, mais aucune ligne changée ne parle des feux : c'est ce que ce test garde.
test("IA : le prompt de l'assistant n'a changé que de son bloc eau (FUT-164), et rien sur les feux", () => {
  const diff = execFileSync("git", ["diff", "--unified=0", "4d75603f", "--", "src/lib/ask/system-prompt.ts"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const changees = diff.split("\n").filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
  assert.ok(changees.length > 0);
  for (const l of changees) assert.doesNotMatch(l, /bdiff|incendi|feux? de for|MemoireIncendies/i, l);
  assert.match(readFileSync("src/lib/ask/system-prompt.ts", "utf8"), /export function formatEauPotableBlock/);
});

// FUT-155 (29/10/2026) a dû toucher les deux routes du comparateur et leur contrat : une couverture absente ou
// contredite y vaut « inconnue », et une carte marquée sans priorité favorable n'y transmet aucune raison
// (cf. `fut155-frontiere-confiance.test.ts`). Passe 2 : corps borné à 32 Kio (413) et sortie de la synthèse bornée.
// Passe 3 : question AskFuture bornée à 1 000 caractères (400 question_trop_longue).
// Rien d'autre n'a changé : seules ces lignes, et aucune ne parle des feux.
// FUT-138 (02/11/2026) : les prix immobiliers relus par la route /ask dans l'index (le navigateur n'envoie que le
// code INSEE de chaque carte), et la consigne qui permet enfin de répondre à une question de prix. Aucune ne
// parle des feux ; la synthèse rédigée n'a pas changé.
// FUT-181 (09/11/2026) : la route ne mesure plus que sur un identifiant de mesure consenti. Rien d'autre ne change :
// ni la lecture, ni le prompt, ni le quota.
const LIGNES_FUT181 = [
  `+import { identifiantMesureConsenti, MESURE_MUETTE } from "@/lib/posthog-identity";`,
  `-  const distinctId = typeof body.distinctId === "string" && body.distinctId ? body.distinctId : "anon";`,
  `+  // FUT-181 : mesuré seulement si le navigateur a consenti, donc transmis son identifiant de mesure.`,
  `+  // Plus de repli sur « anon » : sans identifiant, aucun événement.`,
  `+  const distinctId = identifiantMesureConsenti(body.distinctId) ?? "";`,
  `+  const clientMesure = () => (distinctId ? getPostHogClient() : MESURE_MUETTE);`,
  `-    const ph = getPostHogClient();`,
  `+    const ph = clientMesure();`,
  `-  const ph = getPostHogClient();`,
  `+  const ph = clientMesure();`,
];
const LIGNES_FUT138 = [
  "+import { getLecturesPrix } from \"@/lib/prix-immobiliers-commune\";",
  "+import { blocPrixPourModele, type LecturePrix } from \"@/lib/prix-immobiliers\";",
  "-sans chiffre, jamais le mot \"abordable\" ni un jugement d'accessibilité (vous ne",
  "-connaissez pas le budget du lecteur), jamais un verdict. Si la note est absente,",
  "-ne l'inventez pas (l'absence de donnée d'achat n'est pas un marché \"moyen\").",
  "+jamais le mot \"abordable\" ni un jugement d'accessibilité (vous ne connaissez pas",
  "+le budget du lecteur), jamais un verdict. Si la note est absente, ne l'inventez",
  "+pas (l'absence de donnée d'achat n'est pas un marché \"moyen\").",
  "+",
  "+SI LA QUESTION PORTE SUR LES PRIX IMMOBILIERS (achat, prix au m², loyers)",
  "+Répondez avec le champ \"prix_immobiliers\" de chaque territoire concerné : ce sont",
  "+les seuls chiffres de prix que vous pouvez citer, avec leur période, leur échelle",
  "+(commune, arrondissement, ville, intercommunalité) et leur source. Ce sont des",
  "+médianes de ventes passées et des loyers d'annonce : jamais la valeur d'un",
  "+logement précis ni une estimation, même si le lecteur donne une surface ; jamais",
  "+un prix futur ; achat et location séparés. Ces prix n'entrent pas dans l'ordre des",
  "+cartes : ne dites jamais qu'une commune est classée ou recommandée parce qu'elle",
  "+est moins chère. Si le champ est absent, dites que le prix n'est pas disponible.",
  "-Prix de l'immobilier, écoles, vie nocturne, politique : ramenez brièvement vers ce",
  "+Écoles (au-delà de l'accès), vie nocturne, politique : ramenez brièvement vers ce",
  "-    \"logement\", \"signaux\", \"littoral\", \"trait_distinctif\", \"pression_climatique_economie\", \"heritage_industriel\",",
  "+    \"logement\", \"prix_immobiliers\", \"signaux\", \"littoral\", \"trait_distinctif\", \"pression_climatique_economie\", \"heritage_industriel\",",
  "+// FUT-138 : un code INSEE de commune ou d'arrondissement (métropole, Corse). Tout le reste est ignoré.",
  "+const CODE_INSEE = /^(?:\\d{5}|2[AB]\\d{3})$/;",
  "+  prix: Record<string, string> = {},",
  "+    // FUT-138 : relus dans l'index par la route, jamais pris dans le corps de la requête.",
  "+    prix_immobiliers: (t.insee && prix[t.insee]) || null,",
  "+  // FUT-138 : les prix immobiliers de chaque carte, relus dans l'index à partir de son code (aucun chiffre",
  "+  // du navigateur). Une lecture locale, sans appel externe.",
  "+  const codes = (ctx.territoires ?? []).flatMap((t) => (typeof t.insee === \"string\" && CODE_INSEE.test(t.insee) ? [{ insee: t.insee, nom: t.nom }] : []));",
  "+  const lectures: Record<string, LecturePrix> = codes.length ? await getLecturesPrix(codes).catch(() => ({})) : {};",
  "+  const prix = Object.fromEntries(Object.entries(lectures).map(([k, l]) => [k, blocPrixPourModele(l)]));",
  "-    { role: \"user\" as const, content: `${buildContextBlock(ctx, lecture, focusRang, alertes)}\\n\\nQUESTION : ${question}` },",
  "+    { role: \"user\" as const, content: `${buildContextBlock(ctx, lecture, focusRang, alertes, prix)}\\n\\nQUESTION : ${question}` },",
  "+  // FUT-138 : le code de la commune. La route relit ELLE-MÊME ses prix immobiliers dans l'index : aucun chiffre",
  "+  // de prix ne vient du navigateur.",
  "+  insee?: string;",
  "+      insee: r.insee,",
];

test("IA : les routes du comparateur n'ont changé que de la frontière de confiance (FUT-155)", () => {
  const admises = new Set([
    `-import { contexteIrrecevable, lectureDuContexte, type ContexteAsk, type LectureAsk } from "@/lib/comparateur/lecture-ask";`,
    `+import { contexteIrrecevable, lectureDuContexte, longueurQuestion, MAX_QUESTION_ASK, type ContexteAsk, type LectureAsk } from "@/lib/comparateur/lecture-ask";`,
    `-import { porteeSansFavorable } from "@/lib/comparateur/portee-favorable";`,
    `+import { porteeSansFavorable, raisonsSousReserve } from "@/lib/comparateur/portee-favorable";`,
    `+import { lireCorpsBorne } from "@/lib/server/corps-borne";`,
    `-    raisons: t.raisons ?? [],`,
    `+    raisons: raisonsSousReserve(t.raisons, t.aucune_priorite_favorable), // FUT-155 : jamais à côté de la réserve`,
    `+  // FUT-155 : les octets réellement reçus, bornés avant tout budget et tout appel au modèle.`,
    `+  const corps = await lireCorpsBorne(request);`,
    `+  if ("tropGros" in corps) return NextResponse.json({ error: "Corps trop volumineux." }, { status: 413 });`,
    `-    body = (await request.json()) as Body;`,
    `+    body = JSON.parse(corps.texte) as Body;`,
    `+  // FUT-155 : refusée, jamais tronquée. La page bloque l'envoi au-delà ; ce contrôle ne dépend pas d'elle.`,
    `+  if (longueurQuestion(question) > MAX_QUESTION_ASK) {`,
    `+    return NextResponse.json({ error: "Votre question dépasse 1 000 caractères.", code: "question_trop_longue" }, { status: 400 });`,
    `+  }`,
    `+import { couvertureGlobaleLue, MAX_TERRITOIRES_ASK } from "@/lib/comparateur/lecture-ask";`,
    `-"partielle", ne dites pas que l'ensemble correspond au projet : dites ce qui est mesuré.`,
    `+"partielle" ou "inconnue", ne dites pas que l'ensemble correspond au projet : dites ce qui est mesuré.`,
    `+  if ("tropGros" in corps) return new Response("Corps trop volumineux.", { status: 413 });`,
    `-    body = await request.json();`,
    `+    body = JSON.parse(corps.texte);`,
    `+  // FUT-155 : la page n'envoie jamais plus de trois cartes, ni une carte sans nom (même contrat que /ask).`,
    `+  if (results.length > MAX_TERRITOIRES_ASK || results.some((r) => !r || typeof r.nom !== "string" || !r.nom.trim())) {`,
    `+    return new Response("Résultats invalides.", { status: 400 });`,
    `-    couverture_des_priorites: ["complete", "partielle", "aucune", "sans_priorite"].includes(body.outcome?.couverture ?? "") ? body.outcome!.couverture : "complete",`,
    `+    // FUT-155 : un état absent, illisible ou contredit par une carte vaut « inconnue », jamais « complete ».`,
    `+    // Inondation déclarée sans mode lisible : comme /ask, l'ordre n'est pas établi.`,
    `+    couverture_des_priorites: inondationDemandee && typeof body.outcome?.exploration !== "boolean"`,
    `+      ? "inconnue" : couvertureGlobaleLue(body.outcome?.couverture, results.map((r) => r.prioritesNonMesurees)),`,
    `-      raisons: r.reasons ?? [],`,
    `+      raisons: raisonsSousReserve(r.reasons, r.sansPrioriteFavorable), // FUT-155 : jamais à côté de la réserve`,
    `+    // FUT-155 : 110 à 170 mots attendus. Sans borne, le fournisseur appliquait celle du modèle (128 000 jetons).`,
    `+    maxOutputTokens: 1000,`,
    `+/** FUT-155 : une question AskFuture, 1 000 caractères au plus (validé par le porteur le 29/10/2026). */`,
    `+export const MAX_QUESTION_ASK = 1000;`,
    `+/** Les caractères tels que le lecteur les voit (un emoji compte pour un), espaces de bord retirés. Page et route. */`,
    `+export const longueurQuestion = (q: string) => [...q.trim()].length;`,
    `+`,
    `+/**`,
    `+ * FUT-155 : ce que la page dit d'un refus de taille, ou null. 413 : le corps entier (question et historique) dépasse`,
    `+ * 32 Kio. 400 \`question_trop_longue\` : la question seule dépasse la limite. La question n'est jamais tronquée.`,
    `+ */`,
    `+export function avisRefusAsk(status: number, code?: unknown): string | null {`,
    `+  if (status === 413) {`,
    `+    return "Votre question n'a pas pu être envoyée : avec les échanges précédents, l'ensemble dépasse la taille acceptée. Raccourcissez-la, ou relancez une recherche pour repartir d'une conversation vide.";`,
    `+  if (status === 400 && code === "question_trop_longue") {`,
    `+    return "Votre question dépasse 1 000 caractères. Raccourcissez-la pour l'envoyer.";`,
    `+  return null;`,
    `+}`,
    `+ * FUT-155 : la couverture globale que /synthesize peut redire, avec la règle de /ask. Absente ou illisible, elle est`,
    `+ * « inconnue ». « complete » ne se croit pas si une carte déclare des priorités non mesurées, ou ne dit pas lesquelles.`,
    `+export function couvertureGlobaleLue(globale: unknown, nonMesureesParCarte: readonly unknown[]): EtatLu {`,
    `+  const e = etat(globale);`,
    `+  return e === "complete" && nonMesureesParCarte.some((n) => !Array.isArray(n) || n.length > 0) ? "inconnue" : e;`,
    ...LIGNES_FUT138,
    ...LIGNES_FUT181,
  ]);
  for (const f of ["src/lib/comparateur/lecture-ask.ts", "src/app/api/comparateur-vie/synthesize/route.ts", "src/app/api/comparateur-vie/ask/route.ts"]) {
    const diff = execFileSync("git", ["diff", "--no-color", "-U0", "4d75603f", "--", f], { encoding: "utf8", maxBuffer: 1 << 26 });
    for (const l of diff.split("\n").filter((x) => /^[+-]/.test(x) && !/^(\+\+\+|---) /.test(x))) {
      assert.ok(admises.has(l), `ligne non admise dans ${f} : ${l}`);
    }
    assert.doesNotMatch(readFileSync(f, "utf8"), /bdiff|incendies-observes|MemoireIncendies/i, f);
  }
});

// FUT-160 (28/10/2026) a dû toucher `facts.ts` : une panne Géorisques s'y enregistre `source_unavailable`. Ce
// statut n'atteint ni l'écran ni la synthèse (`valueOf` et `synthesisFacts` ne lisent que `ok`, cf.
// `territoire/fut160-statut-source.test.ts`). Le registre reste figé pour tout le reste : aucune ligne retirée,
// et seules ces lignes ajoutées.
// FUT-165 (30/10/2026) applique la même règle à l'écoulement des cours d'eau (ONDE) : une panne devient
// `source_unavailable`, plus « aucune observation ». Trois lignes ajoutées, aucune ne parle des feux.
// FUT-175 (09/11/2026) : les parts OSO lues sur les terres, l'eau à part ; ses lignes exactes sont figées dans
// `__fixtures__/fut175-lignes-admises.json` (cf. `horsFut175`).
test("IA : le registre des faits Territoire n'a changé que des statuts de panne Géorisques (FUT-160) et ONDE (FUT-165), et l'application de la provenance (FUT-12)", () => {
  verifierRegistre(lignesDiff("4d75603f", REGISTRE));
});

// Contre-épreuve : les deux gardes rejettent bien une modification étrangère à FUT-175, sans rapport avec les feux.
test("FUT-175 : une modification étrangère du contrat ou du registre fait échouer la garde", () => {
  const contrat = lignesDiff("4d75603f", CONTRAT);
  const registre = lignesDiff("4d75603f", REGISTRE);
  verifierContrat(contrat);
  verifierRegistre(registre);
  const etrangeres = [
    "+export const SEUIL_NOUVEAU = 42; // sans rapport avec FUT-175",
    '+      limits: "Une limite reformulée plus tard.",',
  ];
  for (const l of etrangeres) {
    assert.throws(() => verifierContrat([...contrat, l]), /deepStrictEqual|Expected values/, l);
    assert.throws(() => verifierRegistre([...registre, l]), /ligne non admise/, l);
  }
  // Une ligne retirée sans rapport, ou une ligne FUT-175 dupliquée (elle ne couvre qu'une occurrence).
  assert.throws(() => verifierRegistre([...registre, "-  const ancienne = true;"]), /aucune ligne retirée/);
  const dupliquee = FUT175_ADMISES[REGISTRE].find((l) => l.startsWith("+") && l.includes("landShares"))!;
  assert.ok(dupliquee);
  assert.throws(() => verifierRegistre([...registre, dupliquee]), /ligne non admise/);
  // Une ligne FUT-175 retouchée plus tard : la référence est périmée, la garde le dit.
  const sansUne = registre.filter((l) => l !== dupliquee);
  assert.throws(() => verifierRegistre(sansUne), /référence FUT-175 périmée/);
});

// FUT-177 : la référence figée du contrat ne couvre que ses propres lignes. Une ligne FUT-177 retouchée ou absente la
// rend périmée ; une ligne étrangère ajoutée à côté reste refusée par la garde.
test("FUT-177 : la référence figée du contrat est exacte, et ne couvre aucune ligne étrangère", () => {
  const contrat = lignesDiff("4d75603f", CONTRAT);
  verifierContrat(contrat);
  const ligne177 = FUT177_ADMISES[CONTRAT].find((l) => l.startsWith("+") && l.includes("territoire-synthese@7"))!;
  assert.ok(ligne177);
  assert.throws(() => verifierContrat(contrat.filter((l) => l !== ligne177)), /référence FUT-177 périmée/);
  assert.throws(() => verifierContrat([...contrat, "+  ce_que_dit_la_categorie_bis: null,"]), /deepStrictEqual|Expected values/);
});
