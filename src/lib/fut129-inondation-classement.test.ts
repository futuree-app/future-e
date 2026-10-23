import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-129 : L'INONDATION DANS LE CLASSEMENT DU COMPARATEUR, SUR L'INDEX ENTIER.
//
// Ce qui est vérifié ici, et que le porteur a demandé (23/10/2026) :
//   1. À préférences identiques, l'historique ONRN ne fait JAMAIS monter une commune par rapport à une
//      recherche où l'inondation est neutralisée (propriété vérifiée sur les 34 788 communes).
//   2. Une recherche SANS cette priorité a exactement le score d'avant (aucun autre critère ne bouge).
//   3. Seules les classes 5 ‰ et plus, avec un échantillon suffisant, font reculer ; le recul suit le
//      poids déclaré et reste modéré (jamais une exclusion).
//   4. Faible fréquence, aucun sinistre répertorié, échantillon trop partiel : trois états distincts, et
//      aucune phrase ne présente l'un d'eux comme un faible risque.
// Aucun réseau, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
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
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let H: M;
let COMMUNES: M[];

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  H = await import("./comparateur/inondation-historique.ts");
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
});

const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const PROFILS: Record<string, M[]> = {
  "inondation 3 + soins 2": [{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }],
  "inondation 2 + nature 2 + étés frais 2": [{ key: "faible_risque_inondation", weight: 2 }, { key: "nature", weight: 2 }, { key: "faible_chaleur", weight: 2 }],
  "inondation 1 + vie locale 3 + train 2": [{ key: "faible_risque_inondation", weight: 1 }, { key: "vie_locale", weight: 3 }, { key: "acces_transports", weight: 2 }],
  "inondation 3 seule": [{ key: "faible_risque_inondation", weight: 3 }],
};
const sansInondation = (prefs: M[]) => prefs.filter((p) => p.key !== "faible_risque_inondation");
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;

for (const nom of ["inondation-soins", "inondation-seule"]) {
  test(`${nom} : les communes, scores, raisons et faits restent ceux de l'entrée figée`, async () => {
    const s = JSON.parse(readFileSync(`docs/audits/2026-10-23-revue-finale/${nom}-session.json`, "utf8"));
    const r = await V.matchProjects(s.parsed);
    const extraire = (x: M) => ({ insee: x.insee, compatibility: x.compatibility, reasons: x.reasons, inondation: x.inondation });
    assert.deepEqual(r.results.slice(0, 3).map(extraire), s.outcome.results.map(extraire));
    assert.deepEqual(r.inondation, s.outcome.inondation);
  });
}

test("l'index porte l'historique ONRN pour presque toutes les communes, labels verbatim", () => {
  const avec = COMMUNES.filter((c) => c.historiqueInondation);
  assert.ok(avec.length >= 34700, `${avec.length}`);
  for (const c of avec) {
    assert.ok(H.CLASSES_FREQUENCE.includes(c.historiqueInondation.frequence), c.insee);
    assert.ok(H.CLASSES_REPRESENTATIVITE.includes(c.historiqueInondation.representativite), c.insee);
  }
});

test("trois situations distinctes, aucune présentée comme un faible risque", () => {
  const etats = new Map<string, number>();
  for (const c of COMMUNES) {
    const e = H.historiqueInondation(c.historiqueInondation).etat;
    etats.set(e, (etats.get(e) ?? 0) + 1);
  }
  // Les effectifs mesurés le 23/10/2026 (index courant, ONRN millésime 2025).
  assert.equal(etats.get("sinistres_frequents"), 1536);
  assert.ok((etats.get("aucun_sinistre") ?? 0) > 17000);
  assert.ok((etats.get("representativite_insuffisante") ?? 0) > 2500);
  assert.ok((etats.get("frequence_mesuree") ?? 0) > 10000);
  const exemples = [
    { frequence: "Entre 0 et 1 ‰", representativite: "> 50%" },
    { frequence: "Pas de sinistre ou de risque répertoriés à CCR", representativite: "Pas de sinistre répertorié à CCR" },
    { frequence: "Entre 0 et 1 ‰", representativite: "Pas de sinistre répertorié à CCR" },
    { frequence: "Entre 2 et 5 ‰", representativite: "< 15%" },
    { frequence: "Plus de 10 ‰", representativite: "Entre 15 et 30%" },
    { frequence: "Plus de 10 ‰", representativite: "Pas de sinistre répertorié à CCR" },
    null,
  ];
  const attendus = ["frequence_mesuree", "aucun_sinistre", "aucun_sinistre", "representativite_insuffisante", "representativite_insuffisante", "representativite_insuffisante", "indisponible"];
  exemples.forEach((x, i) => assert.equal(H.historiqueInondation(x).etat, attendus[i], JSON.stringify(x)));
  const phrases = new Set(exemples.map((x) => H.phraseHistorique(H.historiqueInondation(x))));
  assert.ok(phrases.size >= 4, "chaque situation a sa phrase");
  for (const x of exemples) {
    const h = H.historiqueInondation(x);
    const t = `${H.phraseHistorique(h)} ${H.limiteHistorique(h)}`;
    assert.doesNotMatch(t, /faible risque d'inondation|risque (?:d'inondation )?faible|peu exposée|à l'abri|sans risque/i, t);
    if (h.etat !== "indisponible") assert.match(H.phraseHistorique(h), /1995 à 2021/);
  }
  assert.match(H.PHRASE_TRANSPARENCE, /sinistres passés, pas la probabilité d'une inondation à venir/);
});

test("seules les classes 5 ‰ et plus, échantillon suffisant, font reculer ; le recul suit le poids", () => {
  const h = (frequence: string, representativite = "> 50%") => H.historiqueInondation({ frequence, representativite });
  for (const f of ["Entre 0 et 1 ‰", "Entre 1 et 2 ‰", "Entre 2 et 5 ‰"]) {
    assert.equal(H.reculInondation({ historique: h(f), poidsInondation: 3, poidsAutres: 3 }), 0, f);
  }
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰", "Entre 15 et 30%"), poidsInondation: 3, poidsAutres: 3 }), 0);
  const r1 = H.reculInondation({ historique: h("Entre 5 et 10 ‰"), poidsInondation: 1, poidsAutres: 6 });
  const r3 = H.reculInondation({ historique: h("Entre 5 et 10 ‰"), poidsInondation: 3, poidsAutres: 3 });
  assert.ok(r1 > 0 && r3 > r1, `${r1} < ${r3}`);
  // Le même recul pour les deux classes : une convention de prudence, pas une échelle de danger.
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰"), poidsInondation: 3, poidsAutres: 3 }), r3);
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰"), poidsInondation: 0, poidsAutres: 3 }), 0);
  assert.equal(H.scoreAvecRecul(4, 10), 0, "jamais sous zéro");
});

test("PROPRIÉTÉ, index entier : avec l'historique ONRN, aucune commune ne monte par rapport à l'inondation neutralisée", () => {
  let reculees = 0;
  for (const [nom, prefs] of Object.entries(PROFILS)) {
    const avec = [...prefs, ...BASE];
    const sans = [...sansInondation(prefs), ...BASE];
    for (const c of COMMUNES) {
      const a = V.scorePreferences(c, avec);
      const n = V.scorePreferences(c, sans);
      assert.ok(a.base <= n.base + 1e-9, `${nom} · ${c.insee} : ${a.base} > ${n.base}`);
      assert.ok(Math.abs(a.reference - n.base) < 1e-9, `${nom} · ${c.insee} : la référence est le score neutralisé`);
      if (a.base < n.base) reculees++;
    }
  }
  assert.ok(reculees > 0, "le recul s'applique bien quelque part");
});

test("NON-RÉGRESSION, index entier : une recherche sans priorité inondation garde exactement son score d'avant", () => {
  const ancien = (c: M, prefs: M[]) => {
    const totalW = prefs.reduce((s, p) => s + p.weight, 0) || 1;
    return prefs.reduce((s, p) => { const v = V.subScore(p.key, c); return v == null ? s : s + p.weight * v; }, 0) / totalW;
  };
  for (const prefs of [
    [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }],
    [{ key: "vie_locale", weight: 3 }, { key: "acces_transports", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  ]) {
    const p = [...prefs, ...BASE];
    for (const c of COMMUNES) assert.ok(Math.abs(V.scorePreferences(c, p).base - ancien(c, p)) < 1e-9, c.insee);
  }
});

test("le recul reste modéré : jamais une exclusion de fait", () => {
  // Poids 3 sur un projet de poids total 6 : 10 points sur 100 à l'intensité proposée (0,2).
  const charron = commune("17091");
  assert.equal(H.historiqueInondation(charron.historiqueInondation).etat, "sinistres_frequents");
  const prefs = [...PROFILS["inondation 3 + soins 2"]!, ...BASE];
  const r = V.scorePreferences(charron, prefs);
  assert.ok(Math.abs(r.recul - 10) < 1e-9, `${r.recul}`);
  // Le recul maximal, priorité seule au poids 3 sur les critères de base : 15 points.
  const seul = V.scorePreferences(charron, [...PROFILS["inondation 3 seule"]!, ...BASE]);
  assert.ok(seul.recul <= 15 + 1e-9, `${seul.recul}`);
});

test("Charron recule, La Rochelle et Grenoble non (aucune ne devient favorable)", () => {
  const prefs = [...PROFILS["inondation 3 + soins 2"]!, ...BASE];
  const neutre = [...sansInondation(PROFILS["inondation 3 + soins 2"]!), ...BASE];
  for (const [insee, recule] of [["17091", true], ["17300", false], ["38185", false], ["17094", false]] as [string, boolean][]) {
    const c = commune(insee);
    const a = V.scorePreferences(c, prefs).base;
    const n = V.scorePreferences(c, neutre).base;
    assert.equal(a < n, recule, `${insee} (${c.historiqueInondation?.frequence})`);
    assert.ok(a <= n, `${insee} ne monte jamais`);
  }
});

// ═══════════════════════════════════ LES SURFACES DU COMPARATEUR ═══════════════════════════════════

const INTERDIT = /faible risque d'inondation|risque d'inondation faible|risque faible|peu exposée?|à l'abri|sans risque d'inondation|épargnée?|Peu d'inondations recensées|reconnaissances CatNat/i;
const projet = (preferences: M[], hardConstraints: M = {}) => ({ reformulation: "test", hardConstraints, preferences });

test("plus aucun sous-score inondation : aucune surface ne lit le rang CatNat comme un niveau de risque", () => {
  for (const c of COMMUNES) assert.equal(V.subScore("faible_risque_inondation", c), null, c.insee);
});

test("index entier : aucun texte d'inondation ne rassure (cellule, signal, ligne de carte, plans)", () => {
  const etatsPlans = new Set<string>();
  for (const c of COMMUNES) {
    const h = H.historiqueInondation(c.historiqueInondation);
    const cellule = H.celluleInondation(h, c.plansInondation);
    const textes = [cellule.palier, cellule.qualifier ?? "", H.signalInondation(h), H.ligneCarteInondation(h, c.plansInondation), H.phrasePlans(c.plansInondation) ?? "", H.phraseHistorique(h)];
    for (const t of textes) assert.doesNotMatch(t, INTERDIT, `${c.insee} : ${t}`);
    assert.equal(cellule.alerte, h.etat === "sinistres_frequents", c.insee);
    for (const p of c.plansInondation ?? []) etatsPlans.add(p.statut);
  }
  assert.deepEqual([...etatsPlans].sort(), ["anticipe", "approuve", "prescrit"], "les trois statuts sont présents dans l'index");
  // Les trois statuts restent distincts dans les mots.
  assert.match(H.phrasePlans([{ statut: "approuve", aleas: ["Par submersion marine"] }]), /approuvé \(submersion marine\)/);
  assert.match(H.phrasePlans([{ statut: "anticipe", aleas: [] }]), /appliqué par anticipation/);
  assert.match(H.phrasePlans([{ statut: "prescrit", aleas: [] }]), /en préparation, zones pas encore fixées/);
  assert.equal(H.phrasePlans(null), null, "table non lue : on ne dit pas « aucun plan »");
});

test("comparaison de 3 communes : la ligne Inondation est une ligne de faits, sans gagnant", async () => {
  const s = await V.seedComparaison(["17091", "17300", "38185"]);
  const ligne = s.comparaison.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "inondation");
  assert.deepEqual(ligne.avantage, { type: "neutre" });
  const parInsee = Object.fromEntries(ligne.cellules.map((x: M) => [x.insee, x]));
  assert.match(parInsee["17091"].palier, /^Sinistres fréquents : plus de 10 pour 1 000 biens par an$/);
  assert.equal(parInsee["17091"].alerte, true);
  assert.equal(parInsee["17091"].qualifier, "plan de prévention approuvé");
  assert.equal(parInsee["17300"].palier, "1 à 2 sinistres pour 1 000 biens par an");
  assert.equal(parInsee["17300"].alerte, false);
  assert.equal(parInsee["38185"].palier, "Aucun sinistre répertorié", "Grenoble : une absence, jamais un « faible risque »");
  assert.equal(parInsee["38185"].qualifier, "plan de prévention approuvé");
  assert.match(ligne.aide, /pas une probabilité/);
  // La ligne de fracture ne porte jamais l'inondation.
  assert.ok(!s.comparaison.divergence || !/inondation/i.test(JSON.stringify(s.comparaison.divergence)));
  assert.doesNotMatch(JSON.stringify(ligne), INTERDIT);
  // Le résumé et l'arbitrage ne prêtent plus d'avantage sur l'inondation (« se distingue sur les risques
  // naturels (inondation, …) » pour une commune qui ne menait que sur le feu).
  for (const phrase of [...s.comparaison.resume, s.comparaison.arbitrage ?? "", ...s.comparaison.themes.map((t: M) => t.synthese)]) {
    assert.doesNotMatch(phrase, /inondation/i, phrase);
  }
});

test("recherche avec un autre critère : l'explication est donnée, chaque carte porte son fait, rien ne rassure", async () => {
  const o = await V.matchProjects(projet([{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }], { departements: ["17"] }));
  assert.equal(o.inondation.exploration, false);
  assert.match(o.inondation.transparence, /sinistres passés, pas la probabilité d'une inondation à venir/);
  assert.ok(o.results.length >= 3);
  for (const r of o.results.slice(0, 3)) {
    assert.ok(r.inondation?.ligne.startsWith("Inondation : "), r.nom);
    assert.equal(r.inondation.sinistresFrequents, false, `${r.nom} ne devrait pas être en tête avec des sinistres fréquents`);
    assert.doesNotMatch(JSON.stringify(r), INTERDIT);
    assert.ok(r.signaux?.inondation, `${r.nom} : le signal factuel d'AskFuture`);
  }
  // Yves, l'Île-d'Aix, La Couarde-sur-Mer : plus de 10 ‰, en tête de l'ancien classement, plus dans le trio.
  assert.ok(!o.results.slice(0, 3).some((r: M) => ["17483", "17004", "17121"].includes(r.insee)));
});

test("recherche sans la priorité inondation : aucun fait ni explication ajoutés, classement inchangé", async () => {
  const o = await V.matchProjects(projet([{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 2 }], { departements: ["17"] }));
  assert.equal(o.inondation, undefined);
  for (const r of o.results) assert.equal(r.inondation, undefined);
});

test("inondation seule demande classable : exploration annoncée, pas de palmarès, ordre dit", async () => {
  for (const hc of [{}, { departements: ["30"] }, { zones: [{ zone: "bretagne", strength: "hard" }] }]) {
    const o = await V.matchProjects(projet([{ key: "faible_risque_inondation", weight: 3 }], hc));
    assert.equal(o.inondation.exploration, true, JSON.stringify(hc));
    assert.match(o.inondation.ordre, /nous ne classons pas les communes sur cette seule demande/);
    assert.equal(o.message, null, "pas de « moins de compromis » : rien n'a été classé");
    // L'ordre annoncé : les sinistres fréquents en dernier, puis le nombre d'habitants.
    const rs = o.results;
    const premierFrequent = rs.findIndex((r: M) => r.inondation.sinistresFrequents);
    if (premierFrequent >= 0) assert.ok(rs.slice(premierFrequent).every((r: M) => r.inondation.sinistresFrequents), JSON.stringify(hc));
    const pop = (r: M) => commune(r.insee).population ?? 0;
    const sansFrequents = rs.filter((r: M) => !r.inondation.sinistresFrequents);
    for (let i = 1; i < Math.min(3, sansFrequents.length); i++) {
      assert.ok(pop(sansFrequents[i - 1]) >= pop(sansFrequents[i]), JSON.stringify(hc));
    }
  }
});

test("une orientation géographique souple reste une demande classable : pas d'exploration", async () => {
  const o = await V.matchProjects(projet([{ key: "faible_risque_inondation", weight: 3 }], { zones: [{ zone: "bretagne", strength: "preferred" }] }));
  assert.equal(o.inondation.exploration, false);
});

test("phrase climatique : plus jamais « peu d'inondations recensées »", async () => {
  const o = await V.matchProjects(projet([{ key: "faible_risque_inondation", weight: 3 }, { key: "nature", weight: 2 }], { departements: ["30"] }));
  for (const r of [...o.results, ...o.pistes]) {
    if (r.climatInondation) assert.doesNotMatch(r.climatInondation, /Peu d'inondations recensées/);
  }
});

test("synthèse rédigée : elle ne reçoit que les faits, filtrés, et le mode exploration (sans appel Anthropic)", () => {
  assert.deepEqual(H.champInondationSynthese({ historique: "De 1995 à 2021, …", plans: "Plan de prévention des inondations approuvé." }),
    { historique: "De 1995 à 2021, …", plans: "Plan de prévention des inondations approuvé." });
  assert.equal(H.champInondationSynthese({ historique: "Commune à faible risque d'inondation", plans: 42 }), null, "une phrase rassurante injectée est rejetée");
  assert.equal(H.champInondationSynthese(null), null);
  const route = readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8");
  assert.match(route, /historique_inondation: inondationDemandee \? champInondationSynthese\(r\.inondation\) : null/);
  assert.match(route, /exploration_sans_classement: inondationDemandee && body\.outcome\?\.exploration === true/);
  assert.match(route, /ne présentez JAMAIS une commune comme\s+« peu exposée »/);
});

test("comparatifs vendus : le trio acheté prime sur le classement recalculé, et le changement est dit", async () => {
  const p = projet([{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }], { departements: ["17"] });
  const o = await V.matchProjects(p);
  const tete = o.results.slice(0, 3).map((r: M) => r.insee);
  const meme = await V.rejouerPack(p, tete);
  assert.equal(meme.trioRecompose, false);
  assert.deepEqual(meme.trio.map((r: M) => r.insee), tete);
  // Un trio acheté sous l'ancien classement (Yves, l'Île-d'Aix, La Couarde-sur-Mer) : il est conservé.
  const ancien = ["17483", "17004", "17121"];
  const r = await V.rejouerPack(p, ancien);
  assert.equal(r.trioRecompose, true);
  assert.deepEqual(r.trio.map((x: M) => x.insee), ancien);
  assert.deepEqual(r.pistes, []);
  assert.match(H.AVERTISSEMENT_TRIO_RECOMPOSE, /reste celui des communes que vous avez achetées/);
  // L'avertissement daté : seulement pour un achat antérieur à la nouvelle lecture.
  assert.match(H.avertissementPackAnterieur("2026-09-01T10:00:00Z", "2026-11-01"), /ne classe plus les communes d'après le nombre de catastrophes naturelles reconnues/);
  assert.equal(H.avertissementPackAnterieur("2026-11-01T08:00:00Z", "2026-11-01"), null);
  assert.equal(H.avertissementPackAnterieur(null), null);
});


test("bascule : date de livraison fournie, préparation sans date fictive, après et avant", () => {
  assert.equal(H.avertissementPackAnterieur("2026-10-01T00:00:00Z", null), null);
  assert.ok(H.avertissementPackAnterieur("2026-10-31T23:59:59Z", "2026-11-01"));
  assert.equal(H.avertissementPackAnterieur("2026-11-02T00:00:00Z", "2026-11-01"), null);
  assert.equal(H.avertissementPackAnterieur("invalide", "2026-11-01"), null);
});
