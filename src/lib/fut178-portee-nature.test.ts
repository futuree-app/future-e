// FUT-178 : LE SIGNAL DE NATURE ENVIRONNANTE DIT SA PORTÉE RÉELLE.
//
// `nature.score` / `nature.radius_pct` (scripts/populate-nature.py, OSO 2023) agrègent le couvert naturel d'un
// SECTEUR : la commune et, quand elles sont retenues, des communes voisines ENTIÈRES dont le centre (lat/lon de
// l'index) est à 15 km au plus du sien. Ce n'est ni la commune seule (`nature.brut_pct`), ni un cercle de 15 km, ni
// les abords d'une adresse. Recalcul du 09/11/2026 (docs/audits/2026-11-09-fut178-verif-nature.py, référence figée
// dans __fixtures__/fut178-selection-nature.json) : 0 écart sur 34 743 communes ; 3 communes n'ont qu'elles-mêmes
// dans leur secteur ; la grille du précalcul omet des voisines à ≤ 15 km pour 2 465 communes (FUT-182 corrigera).
// L'eau y est comptée (FUT-175 ne l'a retirée que des parts communales de Territoire).
//
// On vérifie ce que les surfaces RACONTENT (pas seulement qu'elles apparaissent), sur l'index réel. Aucun appel au modèle.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { MISMATCH_RULES } from "./decision/mismatch-rules.ts";
import { ALIGNMENT_RULES } from "./decision/alignment-rules.ts";
import { MISMATCH_LABELS, ALIGNMENT_LABELS } from "./decision/mismatch-facts.ts";
import { getCommuneDistinctive } from "./trait-distinctif.ts";
import { synthesisFacts, type FactsSnapshot } from "./facts/contract.ts";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./territoire/facts.ts";
import { factOf } from "./facts/contract.ts";
import { buildTerritoryCards } from "./territory-identity.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import type { ModuleFacts } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
type Moteur = {
  seedComparaison: (i: string[]) => Promise<{ trio: any[]; comparaison: any } | null>;
  getCommuneEntry: (insee: string) => Promise<any>;
  buildTerritorySignals: (c: unknown) => Record<string, any>;
  DIMENSIONS: any[];
};
const moteur = async () => (await import(`${racine}src/lib/comparateur-vie.ts`)) as Moteur;
/* eslint-enable @typescript-eslint/no-explicit-any */

type Selection = {
  communes: number; ecart_index: number;
  seules: { insee: string; nom: string; radius_pct: number; brut_pct: number }[];
  selection_incomplete: { total: number; ecart_median_pts: number; ecart_max_pts: number; echantillon: { insee: string; nom: string; retenues: number; a_15_km: number; radius_pct: number; radius_pct_complet: number }[] };
};
const SELECTION = JSON.parse(readFileSync("src/lib/__fixtures__/fut178-selection-nature.json", "utf8")) as Selection;

// Ce qu'aucune phrase de la nature environnante ne doit plus dire : une commune « entourée », un « alentour » ou un
// « autour » qu'une sélection vide dément, un cercle, des forêts, un accès, une urbanisation, une affirmation sur les cultures.
const INTERDIT = /territoire peu naturel|caractère naturel|rayon de 15 km|dans un rayon|cercle exact|grands espaces|accès aux espaces naturels|forêts et espaces|lieu de vie|urbanisée?s?\b|alentour|entourée|\bautour\b|tient le plus souvent|le plus souvent des cultures/i;
// Ce qu'une phrase sur un niveau BAS ne peut pas affirmer : une ville, ou une cause certaine.
const BAS_INTERDIT = /\bville\b|urbain|bâti|béton|artificialis|cultures, pas|signifie/i;

const CHATELAILLON = "17094", BONY = "02100", JANVILLE = "28199", CORTE = "2B096", BORDEAUX = "33063", LILLE = "59350";
const SAINTES_MARIES = "13096", SETE = "34301", ARLES = "13004", YEU = "85113";

/** Tout le texte d'un signal transmis au modèle de /qna. */
const texteSignal = (s: Record<string, string>) => Object.values(s).join(" ");

test("la référence de sélection est celle du recalcul : 3 communes seules, 2 465 sélections incomplètes, 0 écart", () => {
  assert.equal(SELECTION.communes, 34743);
  assert.equal(SELECTION.ecart_index, 0);
  assert.deepEqual(SELECTION.seules.map((s) => s.insee), [ARLES, SAINTES_MARIES, YEU]);
  assert.equal(SELECTION.selection_incomplete.total, 2465);
  assert.ok(SELECTION.selection_incomplete.ecart_max_pts <= 5);
  assert.equal(SELECTION.selection_incomplete.echantillon.length, 24);
});

test("Châtelaillon-Plage : 36,5 % (index, eau comprise), 36,4 % des terres (Territoire, FUT-175), 27,9 % du secteur ; le signal ne prend que le rang du dernier, sans chiffre", async () => {
  const m = await moteur();
  const c = await m.getCommuneEntry(CHATELAILLON);
  // Trois mesures distinctes, jamais confondues : l'index (eau comprise), Territoire (terres, eau à part), le secteur.
  assert.equal(c.nature.brut_pct, 36.5);
  assert.equal(c.nature.radius_pct, 27.9);
  assert.equal(c.nature.score, 8);
  const i: TerritoireInputs = chatelaillonInputs();
  i.entry = { ...i.entry!, nature: { brut_pct: c.nature.brut_pct, radius_pct: c.nature.radius_pct, composition: c.nature.composition } };
  const snap = buildTerritoireSnapshot(i, "2026-11-09T00:00:00.000Z");
  assert.equal(factOf(snap, "land.natural_share")!.value, 36.4, "Territoire lit la part des TERRES, pas le brut_pct de l'index");
  const carte = buildTerritoryCards(snap).couvertNaturel!;
  // FUT-183 : au dixième, la précision de la catégorie.
  assert.equal(carte.naturelTerresPct, 36.4);
  assert.equal(carte.radiusPct, 27.9);

  const s = m.buildTerritorySignals(c);
  assert.equal(s.nature, undefined, "l'ancien signal sans périmètre ne part plus au modèle");
  assert.equal(s.espaces_naturels_alentour, undefined, "ni la version « alentour » de la première revue");
  const sig = s.espaces_naturels_secteur;
  assert.equal(sig.niveau, "peu d'espaces naturels ou d'eau dans le secteur");
  assert.match(sig.perimetre, /^le secteur : la commune et, quand elles sont retenues, des communes voisines entières dont le centre est à moins d'une quinzaine de kilomètres du sien ; la sélection peut en oublier, et certaines communes n'en ont aucune$/);
  assert.match(sig.composition, /aussi l'eau \(mer, étangs, lacs, rivières\)/);
  assert.match(sig.ne_dit_pas, /ni la commune seule, ni les abords d'une adresse, ni des espaces uniquement terrestres ou végétalisés/);
  // Aucun chiffre : ni 36,5, ni 36,4, ni 27,9 ne peuvent être attribués à la mauvaise échelle, et le contrôle de /qna
  // rejetterait un « 15 km » non sourcé.
  assert.doesNotMatch(JSON.stringify(sig), /\d/);
  assert.doesNotMatch(texteSignal(sig), INTERDIT);
});

test("Arles, Saintes-Maries-de-la-Mer, L'Île-d'Yeu : un secteur réduit à la commune n'est jamais dit « alentour » ni « entouré »", async () => {
  const m = await moteur();
  for (const { insee, nom, radius_pct, brut_pct } of SELECTION.seules) {
    const c = await m.getCommuneEntry(insee);
    // Le chiffre publié est celui de la commune seule : secteur = commune.
    assert.equal(c.nature.radius_pct, radius_pct, nom);
    assert.equal(radius_pct, brut_pct, nom);
    const sig = m.buildTerritorySignals(c).espaces_naturels_secteur;
    assert.match(sig.niveau, /dans le secteur$/, nom);
    assert.match(sig.perimetre, /certaines communes n'en ont aucune/, nom);
    assert.doesNotMatch(texteSignal(sig), INTERDIT, nom);
  }
  // Saintes-Maries : 91,3 %, surtout de l'eau. Le niveau haut nomme l'eau ; le trait aussi.
  const sm = await m.getCommuneEntry(SAINTES_MARIES);
  assert.ok(sm.nature.composition.eau > 40, "Saintes-Maries : l'eau domine le couvert compté");
  assert.equal(m.buildTerritorySignals(sm).espaces_naturels_secteur.niveau, "beaucoup d'espaces naturels ou d'eau dans le secteur");
});

test("sélection incomplète (échantillon de 24 des 2 465 communes) : l'index publie bien la sélection partielle, et les phrases ne promettent ni toutes les voisines ni un cercle", async () => {
  const m = await moteur();
  for (const e of SELECTION.selection_incomplete.echantillon) {
    const c = await m.getCommuneEntry(e.insee);
    assert.ok(c?.nature, e.nom);
    assert.ok(e.a_15_km > e.retenues, e.nom);
    // Le chiffre publié est celui des communes RETENUES, pas de toutes celles à 15 km : d'où « la sélection peut en oublier ».
    assert.equal(c.nature.radius_pct, e.radius_pct, e.nom);
    const sig = m.buildTerritorySignals(c).espaces_naturels_secteur;
    assert.match(sig.perimetre, /quand elles sont retenues/, e.nom);
    assert.match(sig.perimetre, /la sélection peut en oublier/, e.nom);
    assert.doesNotMatch(texteSignal(sig), INTERDIT, e.nom);
  }
});

test("Sète et Saintes-Maries : l'eau est nommée partout où le rang du secteur est dit", async () => {
  const m = await moteur();
  for (const insee of [SETE, SAINTES_MARIES]) {
    const c = await m.getCommuneEntry(insee);
    assert.ok(c.nature.composition.eau >= 20, `${c.nom} : une part d'eau importante dans le couvert compté`);
    const sig = m.buildTerritorySignals(c).espaces_naturels_secteur;
    assert.match(sig.niveau, /ou d'eau|ou eau/, c.nom);
    assert.match(sig.composition, /l'eau/, c.nom);
  }
  const dim = m.DIMENSIONS.find((d) => d.id === "nature");
  assert.match(dim.aide, /Espaces naturels et eau/);
});

test("Bony et Janville-en-Beauce : peu d'espaces naturels dans le secteur, jamais une urbanisation, et les cultures comme explication possible, pas certaine", async () => {
  const m = await moteur();
  for (const insee of [BONY, JANVILLE]) {
    const c = await m.getCommuneEntry(insee);
    // Ce qui n'est pas naturel dans la commune, ce sont des cultures (≈ 90 %), dans une commune peu dense.
    assert.ok(c.nature.composition.agricole >= 89, c.nom);
    assert.ok(c.densite < 100, c.nom);
    const sig = m.buildTerritorySignals(c).espaces_naturels_secteur;
    assert.equal(sig.niveau, "peu d'espaces naturels ou d'eau dans le secteur", c.nom);
    assert.doesNotMatch(sig.niveau + sig.perimetre, BAS_INTERDIT, c.nom);
    assert.doesNotMatch(texteSignal(sig), INTERDIT, c.nom);
    assert.match(sig.ne_dit_pas, /une faible part d'espaces naturels ne prouve pas une forte urbanisation : elle peut notamment s'expliquer par les terres agricoles$/);
    // FUT-34 : le bas du couvert n'a pas de trait (Janville garde son trait démographique, Bony n'en a aucun).
    assert.doesNotMatch(getCommuneDistinctive(c) ?? "", /espaces naturels|urbanis/, c.nom);
  }
});

test("des environnements contrastés reçoivent chacun le niveau de leur rang, toujours « dans le secteur »", async () => {
  const m = await moteur();
  const attendu: Record<string, string> = {
    [CORTE]: "beaucoup d'espaces naturels ou d'eau dans le secteur", // 99,6 % (surtout des landes : ni « forêts »)
    [BORDEAUX]: "espaces naturels ou eau présents dans le secteur", // 54 % du secteur, 36,4 % dans la commune
    [LILLE]: "peu d'espaces naturels ou d'eau dans le secteur", // 27 % du secteur
    [SETE]: "espaces naturels ou eau présents dans le secteur", // rang 45 ; la moitié du couvert compté dans la commune est de l'eau
  };
  for (const [insee, niveau] of Object.entries(attendu)) {
    const sig = m.buildTerritorySignals(await m.getCommuneEntry(insee)).espaces_naturels_secteur;
    assert.equal(sig.niveau, niveau, insee);
    assert.doesNotMatch(texteSignal(sig).replace(/forêts, prairies/, ""), /forêt/i, insee);
    assert.doesNotMatch(texteSignal(sig), INTERDIT, insee);
  }
});

test("le modèle de /qna reçoit la règle de lecture du signal : secteur, sélection incomplète, eau comptée, terres agricoles", () => {
  const qna = readFileSync("src/lib/accueil/qna.ts", "utf8");
  assert.doesNotMatch(qna, /espaces_naturels_alentour/);
  assert.match(qna, /territory_signals\.espaces_naturels_secteur/);
  assert.match(qna, /a selection that may be incomplete or empty/);
  assert.match(qna, /as an exact circle around it, and never say the commune is surrounded by them/);
  assert.match(qna, /Water is counted with them \("composition"\): never present them as land or green areas only/);
  assert.match(qna, /A low share does not prove strong urbanisation; it may notably be explained by farmland/);
});

test("la carte « Espaces naturels » garde FUT-175 (terres, eau à part) et dit le secteur sans cercle ni promesse de complétude", () => {
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8");
  assert.doesNotMatch(src, /Dans un rayon de 15 km/);
  assert.doesNotMatch(src, /En comptant aussi les communes voisines/);
  assert.match(src, /Sur son secteur \(la commune et, s'il y en a, des communes voisines retenues\), espaces naturels et eau confondus : \$\{pctOso\(couvertNaturel\.radiusPct\)\} %\./);
  // FUT-175, intact : la part des terres, l'eau à part, la ventilation des terres, la réserve de couverture.
  assert.match(src, /headline: `\$\{pctOso\(couvertNaturel\.naturelTerresPct\)\} % de ses terres en espaces naturels`/);
  assert.match(src, /Ni les cultures ni l'eau n'en font partie\./);
  assert.match(src, /L'eau \(mer, étangs, lacs, rivières\) occupe par ailleurs/);
  assert.match(src, /breakdownLabel: "Ce qui couvre ses terres"/);
  assert.match(src, /pixels non classés, de part non mesurée/);
  // La méthode du secteur va au pied du volet.
  assert.match(src, /Le secteur réunit des communes entières dont le centre est à moins de 15 km de celui de la commune ; la sélection peut en oublier/);
});

// ── Dossier : écart au projet et point fort sur la priorité « nature » ─────────────────────────────────────────────
function facts(insee: string, nom: string, low: number, high: number): ModuleFacts {
  return {
    insee, nom, dept: insee.slice(0, 2), lat: 46, lon: 2, uu: null,
    tailleVille: 500, tailleVilleSource: "commune", reliefProximite: 0, merCentreKm: 200, population: 200, altitude: 100,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,
    rankBands: { nature: { low, high } }, scores: {}, hasAddress: false,
  } as unknown as ModuleFacts;
}
const projet: UserProject = {
  posture: "recherche", intent: null, rawText: null,
  parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "nature", weight: 3 }] } as unknown as UserProject["parsed"],
  updatedAt: "1970-01-01T00:00:00.000Z",
};

test("dossier, Bony : l'écart sur la nature dit le secteur, l'eau comprise, et pas une urbanisation", () => {
  const r = MISMATCH_RULES.find((x) => x.id === "territoire.mismatch-nature")!.evaluate(facts(BONY, "Bony", 0, 0.01), projet, undefined as never);
  assert.equal(r.outcome, "mismatch");
  const f = r.facts[0]!;
  assert.match(f.statement, /^Vous avez placé la proximité des espaces naturels parmi vos priorités\. Sur la part d'espaces naturels et d'eau dans le secteur, Bony se situe parmi les .+ de communes les moins favorables de France\.$/);
  assert.equal(f.headlineSubject, "les espaces naturels (eau comprise)"); // le titre de l'écart reprend le `subject` court
  assert.equal(f.topic, "les espaces naturels du secteur (eau comprise)");
  assert.match(f.limitation!, /eau comprise \(mer, étangs, lacs\)/);
  assert.match(f.limitation!, /elle-même et, quand elles sont retenues, des communes voisines entières dont le centre est à moins de 15 km du sien, sélection parfois incomplète/);
  assert.match(f.limitation!, /ni la commune seule, ni les abords d'une adresse/);
  assert.match(f.limitation!, /Une faible part d'espaces naturels ne prouve pas une forte urbanisation : elle peut notamment s'expliquer par les terres agricoles\.$/);
  for (const t of [f.statement, f.topic, f.headlineSubject ?? ""]) assert.doesNotMatch(t, INTERDIT);
  assert.doesNotMatch(f.limitation!.replace("ne prouve pas une forte urbanisation", ""), INTERDIT);
});

test("dossier, Corte et Saintes-Maries : le point fort dit le secteur et l'eau, plus « entourées »", () => {
  for (const [insee, nom] of [[CORTE, "Corte"], [SAINTES_MARIES, "Saintes-Maries-de-la-Mer"]]) {
    const r = ALIGNMENT_RULES.find((x) => x.id === "territoire.alignment-nature")!.evaluate(facts(insee, nom, 0.97, 0.99), projet, undefined as never);
    assert.equal(r.outcome, "satisfied");
    const f = r.facts[0]!;
    assert.match(f.statement, new RegExp(`^Pour les espaces naturels du secteur \\(eau comprise\\), ${nom} se situe parmi les .+ de communes dont le secteur compte le plus d'espaces naturels ou d'eau en France\\.$`));
    assert.match(f.limitation!, /quand elles sont retenues/);
    assert.doesNotMatch(f.statement, INTERDIT);
  }
});

test("les libellés du dossier pour la nature ne promettent ni un accès, ni une mesure communale, ni des voisines", () => {
  const lab = MISMATCH_LABELS.nature!;
  assert.ok(lab.subject.length <= 45);
  for (const t of [lab.topic, lab.indicator, lab.subject, ALIGNMENT_LABELS.nature!.headlineSubject, ALIGNMENT_LABELS.nature!.favorableStatusTemplate]) {
    assert.doesNotMatch(t, INTERDIT, t);
  }
  assert.match(ALIGNMENT_LABELS.nature!.favorableStatusTemplate, /\{rank\} de communes/);
});

// ── Comparateur ────────────────────────────────────────────────────────────────────────────────────────────────────
test("comparateur : la ligne, les paliers, les raisons, le point fort et les signaux ambiants disent le secteur et l'eau", async () => {
  const m = await moteur();
  const dim = m.DIMENSIONS.find((d) => d.id === "nature");
  assert.equal(dim.aide, "Espaces naturels et eau, dans la commune et les communes voisines retenues (centres à moins de 15 km, liste parfois incomplète). Pas les abords d'une adresse.");
  assert.equal(dim.forte, "les espaces naturels et l'eau de son secteur");
  assert.deepEqual(dim.paliers, ["Beaucoup d'espaces naturels ou d'eau dans le secteur", "Espaces naturels ou eau présents", "Peu d'espaces naturels ou d'eau dans le secteur"]);
  assert.equal(dim.label, "Espaces naturels", "la ligne garde le nom de la préférence ; ses paliers disent la mesure");
  const src = readFileSync("src/lib/comparateur-vie.ts", "utf8");
  assert.match(src, /label: "la plus riche\{n\} en espaces naturels ou en eau dans son secteur", key: "nature"/);
  assert.match(src, /\n {2}nature: "beaucoup d'espaces naturels ou d'eau dans le secteur",/);
  assert.match(src, /\n {2}nature: "peu d'espaces naturels ou d'eau dans le secteur",/);
  assert.match(src, /\n {2}nature: "espaces naturels ou eau présents dans le secteur, sans abonder",/);
  assert.match(src, /bands: \["davantage d'espaces naturels ou d'eau dans le secteur", "présence intermédiaire d'espaces naturels ou d'eau dans le secteur", "moins d'espaces naturels ou d'eau dans le secteur"\]/);
  // Corte face à Bony et Janville, puis Saintes-Maries face à Arles et L'Île-d'Yeu : ce que le comparateur écrit réellement.
  for (const trio of [[CORTE, BONY, JANVILLE], [SAINTES_MARIES, ARLES, YEU]]) {
    const seed = await m.seedComparaison(trio);
    assert.ok(seed);
    const texte = JSON.stringify(seed);
    // (« alentour » reste légitime ailleurs, p. ex. « collèges et lycées alentour » : on ne le cherche que côté nature.)
    assert.doesNotMatch(texte, /territoire peu naturel|grands espaces naturels|forêts et espaces naturels|ses espaces naturels|autour du lieu de vie|nature autour|nature alentour|naturels alentour|entourée|urbanis/);
    assert.doesNotMatch(texte, /\{n\}/, "le gabarit du point fort est toujours rempli");
  }
});

// ── Le trait national laissé volontairement (cf. trait-distinctif.ts) ─────────────────────────────────────────────
test("le trait national « entourées d'espaces naturels » reste invisible : aucune carte, aucune synthèse ne le lit", () => {
  const i: TerritoireInputs = chatelaillonInputs();
  i.distinctiveTrait = "compte parmi les communes les plus entourées d'espaces naturels";
  const snap = buildTerritoireSnapshot(i, "2026-11-09T00:00:00.000Z") as FactsSnapshot;
  const f = factOf(snap, "place.distinctive_trait")!;
  assert.equal(f.value, i.distinctiveTrait);
  assert.match(JSON.stringify(f), /"noCard":\{"reason":"other"/, "aucune carte");
  assert.ok(!synthesisFacts(snap).facts.some((x) => x.key === "place.distinctive_trait"), "jamais transmis au modèle");
  const vus = readFileSync("src/lib/territory-identity.ts", "utf8") + readFileSync("src/components/report/QuartierClimatData.tsx", "utf8");
  assert.doesNotMatch(vus, /distinctive_trait|getCommuneDistinctive/, "aucune surface lue par le lecteur ne l'affiche");
});

// ── Dernier correctif : les étiquettes visibles disent « espaces naturels ou eau », jamais « nature » seule ────────
test("comparateur : les trois paliers et la raison intermédiaire nomment l'eau ; Saintes-Maries et Sète les reçoivent", async () => {
  const m = await moteur();
  const dim = m.DIMENSIONS.find((d) => d.id === "nature");
  for (const p of dim.paliers) {
    assert.match(p, /espaces naturels ou (d')?eau/i, p);
    assert.doesNotMatch(p, /\bnature\b/i, p);
  }
  const src = readFileSync("src/lib/comparateur-vie.ts", "utf8");
  const inter = /\n {2}nature: "([^"]+)",\n {2}proximite_mer: "rivage marin à distance"/.exec(src)?.[1];
  assert.equal(inter, "espaces naturels ou eau présents dans le secteur, sans abonder");
  // Les cellules réellement rendues pour Saintes-Maries (rang 87, 69 % d'eau) et Sète (rang 45, 51 % d'eau).
  const seed = await m.seedComparaison([SAINTES_MARIES, SETE, LILLE]);
  assert.ok(seed);
  const ligne = seed.comparaison.themes.flatMap((t: { lignes: { id: string }[] }) => t.lignes).find((l: { id: string }) => l.id === "nature") as { cellules: { insee: string; palier: string }[] };
  const palier = (insee: string) => ligne.cellules.find((c) => c.insee === insee)!.palier;
  assert.equal(palier(SAINTES_MARIES), "Beaucoup d'espaces naturels ou d'eau dans le secteur");
  assert.equal(palier(SETE), "Espaces naturels ou eau présents");
  assert.equal(palier(LILLE), "Peu d'espaces naturels ou d'eau dans le secteur");
  assert.doesNotMatch(JSON.stringify(seed), /de nature dans le secteur|"Nature présente"|nature présente dans le secteur/);
});

test("dossier : les intitulés courts nomment la mesure (espaces naturels et eau), la priorité garde son nom", () => {
  const lab = MISMATCH_LABELS.nature!;
  assert.equal(lab.subject, "les espaces naturels (eau comprise)");
  assert.equal(lab.topic, "les espaces naturels du secteur (eau comprise)");
  assert.equal(ALIGNMENT_LABELS.nature!.headlineSubject, "les espaces naturels du secteur (eau comprise)");
  assert.equal(lab.projectPhrase, "la proximité des espaces naturels", "la priorité du lecteur n'est pas une priorité pour les plans d'eau");
  // Saintes-Maries (rang 87, surtout de l'eau) : le point fort du dossier titre « espaces naturels et eau ».
  // Sète (rang 45) ne déclenche ni écart ni point fort : ses paliers visibles sont testés côté comparateur.
  const r = ALIGNMENT_RULES.find((x) => x.id === "territoire.alignment-nature")!.evaluate(facts(SAINTES_MARIES, "Saintes-Maries-de-la-Mer", 0.85, 0.88), projet, undefined as never);
  assert.equal(r.outcome, "satisfied");
  const f = r.facts[0]!;
  assert.equal(f.headlineSubject, "les espaces naturels du secteur (eau comprise)");
  assert.equal(f.topic, "les espaces naturels du secteur (eau comprise)");
  assert.match(f.statement, /^Pour les espaces naturels du secteur \(eau comprise\), Saintes-Maries-de-la-Mer se situe parmi/);
});
