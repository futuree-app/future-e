import test from "node:test";
import assert from "node:assert/strict";
import { composeFacts } from "./fact-compositions.ts";
import { runRules, assertFactValid } from "./materiality-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";

// Les règles des CONTRAINTES DURES sont testées dans hard-constraint-rules.test.ts (la fabrique) et dans
// hard-constraints.test.ts (les évaluateurs). Ici, on teste les règles de PRÉFÉRENCE, et le fait que le
// registre les fasse tourner ensemble.

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6045, lon: 1.4442, uu: "31701",
    tailleVille: 1_060_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 1, population: 5000, altitude: 100,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null, scores: {}, hasAddress: false, ...over,
  };
}
function project(parsed: unknown, over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: parsed as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z", ...over };
}

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };

// Le contexte est HYDRATÉ à partir du projet, comme en production : les règles de contrainte dure y
// répondent réellement, et les règles de préférence l'ignorent (elles ne déclarent que deux paramètres).
function hard(p: UserProject, f: ModuleFacts): EvaluationContext {
  return {
    constraints: hydrateHardConstraints(p.parsed?.hardConstraints, DIR),
    point: f.lat != null && f.lon != null
      ? { lat: f.lat, lon: f.lon, grain: "commune_reference", source: "commune_centroid", label: f.nom }
      : null,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}
function run(f: ModuleFacts, p: UserProject) {
  return runRules(f, p, hard(p, f));
}

test("invariant : chaque fait porte ruleId + preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = run(facts({ distanceCoteKm: 42 }), p);
  assert.ok(r.facts.length > 0);
  for (const f of r.facts) {
    assert.ok(f.ruleId.length > 0);
    if (f.role !== "compromise") assert.ok(f.evidence.length >= 1);
  }
});

test("règle compromis : deux côtés, chacun sa preuve", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }, { key: "faible_chaleur", weight: 2 }] });
  const r = run(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.compromis-transport-chaleur");
  assert.ok(f && f.role === "compromise");
  assert.equal(f.sides.length, 2);
  assert.ok(f.sides[0].evidence.length >= 1 && f.sides[1].evidence.length >= 1);
  assert.equal(f.sides[0].evidence[0].observedValue, "80/100");
  assert.doesNotMatch(f.sides[0].statement + f.sides[1].statement, /meilleure|train/i);
});

test("règle compromis : rien si une seule dimension déclarée", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_transports", weight: 3 }] });
  const r = run(facts({ scores: { acces_transports: 80, faible_chaleur: 25 } }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.compromis-transport-chaleur"), false);
});

test("règle inondation : vérification si exposition notable, texte acheteur", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.ok(f.action.label.length > 0);
  assert.match(f.statement, /avant de vous engager/);
  assert.match(f.statement, /1982/);
});

test("règle inondation : la preuve est OPPOSABLE, jamais un score interne (100/100 illisible)", () => {
  // « 100/100 » pouvait se lire comme une probabilité ou une certitude. La preuve affiche la matière
  // que le lecteur peut vérifier (arrêtés CatNat) ; le score reste interne au moteur.
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const avec = run(facts({ inondationRisque: 80, catnatInondation: 6 }), p)
    .facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(avec && avec.role === "verification");
  assert.equal(avec.evidence[0]?.observedValue, "exposition élevée · 6 arrêtés CatNat depuis 1982");
  const sans = run(facts({ inondationRisque: 80, catnatInondation: null }), p)
    .facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(sans && sans.role === "verification");
  assert.equal(sans.evidence[0]?.observedValue, "exposition élevée");
});

test("règle inondation : posture habitant -> comprendre/surveiller, pas s'engager", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] }, { posture: "habitant" });
  const r = run(facts({ inondationRisque: 80, catnatInondation: 6 }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition");
  assert.ok(f && f.role === "verification");
  assert.doesNotMatch(f.statement, /avant de vous engager/);
  assert.match(f.statement, /surveiller/i);
});

test("règle inondation : exposition inconnue -> aucun fait", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: null }), p);
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.inondation-exposition"), false);
});

// ── Le contrat des outcomes (slice 2.1) ────────────────────────────────────────
// not_applicable = HORS SUJET. satisfied = déclaré, examiné, RIEN À REDIRE.
// Les confondre faisait compter une bonne nouvelle comme un trou de couverture.

test("règle inondation : exposition FAIBLE + priorité déclarée -> satisfied (examiné, rien à redire)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "satisfied");
  assert.deepEqual(ev?.facts, []); // silencieux : aucune carte, mais un point FAVORABLE
});

test("règle inondation : priorité NON déclarée -> not_applicable (hors sujet)", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] });
  const r = run(facts({ inondationRisque: 20 }), p);
  const ev = r.evaluations.find((e) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev?.outcome, "not_applicable");
});

// ── Le registre fait tourner les 11 contraintes dures, au-dessus de l'évaluateur partagé ──

test("le registre porte les 11 contraintes dures, et le dossier les examine", () => {
  const p = project({ reformulation: "x", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] });
  const r = run(facts({ distanceCoteKm: 42 }), p);
  const hardEvals = r.evaluations.filter((e) => e.ruleId.startsWith("territoire.hard."));
  assert.equal(hardEvals.length, 11);
  assert.equal(r.evaluations.find((e) => e.ruleId === "territoire.hard.nearSea")?.outcome, "incompatible");
  // Les dix autres ne sont pas déclarées : HORS SUJET, pas un trou de couverture.
  assert.equal(hardEvals.filter((e) => e.outcome === "not_applicable").length, 10);
});

// ── LES RÈGLES CLIMAT ────────────────────────────────────────────────────────

import { buildClimatFacts, type GwlScenarios } from "./climat-facts.ts";
import { buildCriteriaRegistry } from "./criteria-registry.ts";

// Une commune EXPOSÉE (des chiffres réalistes, du type de Nîmes) et une commune ÉPARGNÉE (type Brest).
const SC_EXPOSEE: GwlScenarios = {
  gwl15: { h: "2030", v: { NORTX35D_yr: 8, ATX35D_yr: 5, NORTR_yr: 48, ATR_yr: 15, NORIFM40_yr: 40, AIFM40_yr: 6, NORRx1d_yr: 70, ARRx1d_yr: 0.08 } },
  gwl20: { h: "2050", v: { NORTX35D_yr: 14, ATX35D_yr: 11, NORTR_yr: 69, ATR_yr: 36, NORIFM40_yr: 50, AIFM40_yr: 16, NORRx1d_yr: 74, ARRx1d_yr: 0.14 } },
  gwl30: { h: "2100", v: { NORTX35D_yr: 26, ATX35D_yr: 23, NORTR_yr: 95, ATR_yr: 62, NORIFM40_yr: 70, AIFM40_yr: 36, NORRx1d_yr: 84, ARRx1d_yr: 0.29 } },
};
const SC_EPARGNEE: GwlScenarios = {
  gwl20: { h: "2050", v: { NORTX35D_yr: 0, ATX35D_yr: 0, NORTR_yr: 3, ATR_yr: 3, NORIFM40_yr: 1, AIFM40_yr: 0, NORRx1d_yr: 43, ARRx1d_yr: 0.13 } },
};
const EXPOSEE = buildClimatFacts(SC_EXPOSEE)!;
const EPARGNEE = buildClimatFacts(SC_EPARGNEE)!;

const projetClimat = (key: string, weight = 3) =>
  project({ reformulation: "x", hardConstraints: {}, preferences: [{ key, weight }] });

test("CHALEUR, priorité déclarée + exposition notable : un MISMATCH chiffré, jamais « actuellement »", () => {
  // Le bug qui a déclenché le lot D : une priorité de faible chaleur défavorable est un ÉCART AU PROJET
  // (mismatch), pas un constat territorial « au-delà de vos priorités » (verification).
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-chaleur");
  assert.ok(f && f.role === "mismatch");
  // LE FONDEMENT est le seuil climatique multivarié (Task 0), pas une mesure aplatie.
  assert.equal(f.basis.kind, "climate_threshold");
  assert.equal(f.projectKey, "faible_chaleur");
  // Le héros NOMME la priorité du lecteur (« des étés supportables »), jamais l'indicateur défavorable.
  assert.equal(f.headlineSubject, "des étés supportables");
  // LE SUJET PORTE L'UNITÉ : la valeur projetée n'est plus suivie de « jours » (fini « jours jours jours »).
  assert.match(f.statement, /passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050/);
  assert.doesNotMatch(f.statement, /\d+ jours/); // aucun nombre suivi de « jours »
  // LA 2e TRAJECTOIRE HÉRITE DU CADRE : « de 33 à 69 par an », sans redire la période ni l'horizon.
  assert.match(f.statement, /Les nuits tropicales, elles, passeraient de 33 à 69 par an/);
  assert.match(f.statement, /des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer/);
  assert.doesNotMatch(f.statement, /ne récupère plus/); // l'absolu est tombé (invariant n°5)
  assert.doesNotMatch(f.statement, /actuellement|aujourd'hui/i);
  // UN MISMATCH N'A NI action NI signalConvention (champs absents du type) : le constat est établi (rien à
  // vérifier), et le renvoi logement est restauré par une composition (Task 2), pas porté par le fait.
  assert.equal("action" in f, false);
  assert.equal("signalConvention" in f, false);
  // LES CHIPS DISENT LA BONNE UNITÉ : « 69 nuits », jamais « 69 jours » (le bug d'unité).
  const nuitsChip = f.evidence.find((e) => e.factId === "climat.nuitsTropicales");
  assert.equal(nuitsChip?.observedValue, "69 nuits à l'horizon 2050");
  const joursChip = f.evidence.find((e) => e.factId === "climat.joursTresChauds");
  assert.equal(joursChip?.observedValue, "14 jours à l'horizon 2050");
  assert.ok(f.limitation?.includes("commune"));
});

test("CHALEUR, poids 1 + exposition défavorable : outcome mismatch, mais SILENCIEUX (aucun fait)", () => {
  // Déclarée faiblement (poids 1) : examinée, l'écart est réel, mais il ne mérite pas une carte. La table
  // de vérité du plan : outcome mismatch, facts vides.
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur", 1));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!;
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("CHALEUR, avec une ADRESSE : le critère est TOUJOURS examiné, en mismatch (le fil de ruleConfort est refermé)", () => {
  // ruleConfort désactivait faible_chaleur dès qu'une adresse existait : le critère cessait d'être examiné
  // au moment où le dossier devenait le plus riche.
  const r = run(facts({ climat: EXPOSEE, hasAddress: true }), projetClimat("faible_chaleur"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!;
  assert.equal(e.outcome, "mismatch");
  assert.equal(r.facts.find((x) => x.ruleId === "territoire.climat-chaleur")!.role, "mismatch");
});

test("ORIENTATION : la chaleur défavorable sur priorité déclarée bascule le dossier en arbitrage (le bug Toulouse)", () => {
  // Le cœur du lot D : avec le mismatch, criteria-registry compte faible_chaleur en mismatch (pas reserve),
  // et l'orientation devient « arbitration » — le verdict n'est plus « Correspondance favorable ».
  const p = projetClimat("faible_chaleur");
  const r = run(facts({ climat: EXPOSEE }), p);
  const summary = buildCriteriaRegistry(p, r);
  assert.equal(summary.orientation, "arbitration");
  const chaleur = summary.registry.find((c) => c.criterionKey === "faible_chaleur")!;
  assert.equal(chaleur.outcome, "mismatch");
});

test("CHALEUR, exposition faible : satisfied SILENCIEUX, et la couverture monte", () => {
  const r = run(facts({ climat: EPARGNEE }), projetClimat("faible_chaleur"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!;
  assert.equal(e.outcome, "satisfied"); // JAMAIS not_applicable : ce serait un trou de couverture
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.climat-chaleur"), false);
});

test("CHALEUR, UN AXE MANQUANT : uncertain, jamais « tout va bien »", () => {
  // 5 jours (sous le seuil) mais les nuits tropicales n'ont pas été lues : l'axe manquant POUVAIT être
  // celui qui déclenchait la réserve. Conclure `satisfied` serait le `?? 0` du chantier A, déguisé.
  const partiel = buildClimatFacts({ gwl20: { h: "2050", v: { NORTX35D_yr: 5 } } })!;
  const r = run(facts({ climat: partiel }), projetClimat("faible_chaleur"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!.outcome, "uncertain");
});

test("CHALEUR, climat indisponible : uncertain (une donnée absente n'est pas une exposition faible)", () => {
  const r = run(facts({ climat: null }), projetClimat("faible_chaleur"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!.outcome, "uncertain");
});

test("CHALEUR, critère non déclaré : not_applicable, aucune carte", () => {
  const r = run(facts({ climat: EXPOSEE }), project({ reformulation: "x", hardConstraints: {}, preferences: [] }));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!.outcome, "not_applicable");
});

// ── La verification AMBIANTE (chaleur non déclarée), règle séparée (lot D, Task 4) ────────────────

test("chaleur AMBIANTE : non déclarée + exposition notable -> une verification (grain commune) + action logement", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [] }); // faible_chaleur NON déclarée
  const r = run(facts({ climat: EXPOSEE }), p);
  const f = r.facts.find((x) => x.ruleId === "territoire.verification-chaleur-future");
  assert.ok(f && f.role === "verification");
  assert.match(f.statement, /Les jours au-dessus de 35 °C/);
  assert.match(f.statement, /Les nuits tropicales/);
  assert.equal(f.action?.type, "renseigner_adresse"); // sans adresse : la seule manœuvre dans le produit
  assert.ok(f.limitation?.includes("commune"));
  assert.equal(f.signalConvention, "futur•e signale cette exposition à partir de 8 jours par an au-dessus de 35 °C, ou de 25 nuits tropicales par an.");
  // UNE DIMENSION, UN SIGNAL : ruleChaleur ne dit rien (non déclarée), donc aucun mismatch chaleur.
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!.outcome, "not_applicable");
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.climat-chaleur"), false);
});

test("chaleur AMBIANTE : déclarée -> la règle ambiante rend not_applicable (une dimension, un signal)", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur")); // déclarée poids 3
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.verification-chaleur-future")!.outcome, "not_applicable");
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.verification-chaleur-future"), false);
  // C'est ruleChaleur qui porte le signal, en mismatch.
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.climat-chaleur" && x.role === "mismatch"), true);
});

test("chaleur AMBIANTE : la verification non déclarée ne touche NI couverture NI orientation (criteria-registry n'agrège que le déclaré)", () => {
  // faible_chaleur non déclarée (ambiante) ; une autre priorité satisfaite donne l'orientation.
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] });
  const r = run(facts({ climat: EXPOSEE, inondationRisque: 10 }), p);
  assert.ok(r.facts.some((x) => x.ruleId === "territoire.verification-chaleur-future" && x.role === "verification"));
  const summary = buildCriteriaRegistry(p, r);
  assert.equal(summary.registry.some((c) => c.criterionKey === "faible_chaleur"), false); // pas un critère
  assert.equal(summary.orientation, "favorable"); // la chaleur ambiante n'a pas dégradé le dossier en réserves
});

test("FEU, priorité déclarée + danger notable : un MISMATCH, plus une verification (lot feu)", () => {
  // Le pendant du lot D pour l'incendie : un danger qui s'aggrave et que le lecteur a placé parmi ses
  // priorités est un ÉCART AU PROJET, pas un constat territorial « au-delà de vos priorités ».
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_risque_feu"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.ok(f.role === "mismatch");
  assert.equal(f.projectKey, "faible_risque_feu");
  // Le fondement est MONO-AXE : une seule mesure, l'indice forêt-météo.
  assert.equal(f.basis.kind, "climate_threshold");
  assert.equal(f.basis.kind === "climate_threshold" && f.basis.measures.length, 1);
  assert.equal(f.basis.kind === "climate_threshold" && f.basis.measures[0]!.key, "fire_weather_days");
  // Le héros nomme l'OBJET DU PROJET, et reste MESURÉ : l'indice dit un danger météorologique, pas une
  // probabilité d'incendie — « à l'abri des feux » promettrait ce que la donnée ne sait pas dire.
  assert.equal(f.headlineSubject, "un environnement peu exposé aux incendies");
  assert.doesNotMatch(f.headlineSubject, /à l'abri|sûr|sans risque/);
  assert.match(f.statement, /indice forêt-météo/);
  assert.match(f.statement, /danger météorologique très sévère/);
  assert.match(f.statement, /à 50 à l'horizon 2050/); // le sujet porte « jours »
  assert.doesNotMatch(f.statement, /\d+ jours/);
  assert.doesNotMatch(f.statement, /futur•e signale/);
  // UN MISMATCH N'A NI action NI signalConvention : le constat est établi. Le renvoi au terrain est
  // restauré par la composition (cf. fact-compositions), jamais porté par le fait.
  assert.equal("action" in f, false);
  assert.equal("signalConvention" in f, false);
  assert.ok(f.limitation?.includes("commune"));
});

test("FEU, poids 1 + danger défavorable : outcome mismatch, mais SILENCIEUX (aucun fait)", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_risque_feu", 1));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("FEU, indice non lu : uncertain, JAMAIS « satisfied » (une donnée absente n'est pas une bonne nouvelle)", () => {
  const r = run(facts({ climat: EPARGNEE }), projetClimat("faible_risque_feu"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.ok(e.outcome === "satisfied" || e.outcome === "uncertain");
  assert.equal(e.facts.length, 0);
});

test("FEU AMBIANT : non déclaré, le constat existe quand même — en verification SECONDARY, avec son geste", () => {
  // Symétrique de la chaleur ambiante : un phénomène important du lieu se dit même sans avoir été
  // priorisé, mais il ne se mêle jamais aux écarts au projet.
  const r = run(facts({ climat: EXPOSEE, hasAddress: true }), project({ reformulation: "x", hardConstraints: {}, preferences: [] }));
  const f = r.facts.find((x) => x.ruleId === "territoire.verification-feu-futur")!;
  assert.ok(f && f.role === "verification");
  assert.equal(f.materialityTier, "secondary");
  assert.equal(f.signalConvention, "futur•e signale cette exposition à partir de 9 jours par an.");
  assert.match(f.action!.label, /^Regardez la végétation autour du terrain$/);
  assert.match(f.action!.detail!, /débroussaillement/);
  // Ses projectKeys sont VIDES : aucun effet sur la couverture ni sur l'orientation.
  const e = r.evaluations.find((x) => x.ruleId === "territoire.verification-feu-futur")!;
  assert.deepEqual(e.projectKeys, []);

  // SANS ADRESSE, le geste change de nature : on ne peut rien dire des abords d'un terrain inconnu.
  const sansAdresse = run(facts({ climat: EXPOSEE }), project({ reformulation: "x", hardConstraints: {}, preferences: [] }));
  const fSans = sansAdresse.facts.find((x) => x.ruleId === "territoire.verification-feu-futur")!;
  assert.equal(fSans.role === "verification" && fSans.action.type, "renseigner_adresse");
});

test("FEU : DÉCLARÉ, la règle ambiante se tait (une dimension, un signal)", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_risque_feu"));
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.verification-feu-futur"), false);
  // Même à poids 1, où ruleFeu est silencieuse : l'ambiante ne prend pas le relais, sinon le dossier
  // dirait en « constat du territoire » ce que le lecteur a explicitement priorisé.
  const r1 = run(facts({ climat: EXPOSEE }), projetClimat("faible_risque_feu", 1));
  assert.equal(r1.facts.some((x) => x.ruleId === "territoire.verification-feu-futur"), false);
});

// ── LE CAS LÈGE-CAP-FERRET (juillet 2026) ───────────────────────────────────────
//
// Le lecteur demande « à l'abri des risques d'incendie ». L'indice forêt-météo projeté vaut 4,5 jours/an
// à 2050 — sous notre seuil de 9. La règle concluait `satisfied` SILENCIEUX, et le dossier affichait
// « Bonne correspondance », pendant que la commune brûlait et que Géorisques y déclare « Feu de forêt ».
//
// Ces tests tiennent la règle générale : un risque PRIORISÉ ne se conclut jamais en silence sur le seul
// indicateur météo.

const CAP_FERRET = { ...facts({ nom: "Lège-Cap-Ferret", insee: "33236" }), risquesDeclares: { wildfire: true } };

test("FEU RECENSÉ + indice sous le seuil : un MISMATCH, jamais un « satisfait » silencieux", () => {
  // ET JAMAIS UNE VERIFICATION : la première version en émettait une, si bien que la carte tombait dans
  // « À contrôler avant de vous engager », dont l'intro dit « au-delà de vos priorités ». Or c'est
  // exactement une priorité — la seule que ce lecteur avait posée. La section mentait sur son contenu.
  const r = run({ ...CAP_FERRET, climat: EPARGNEE }, projetClimat("faible_risque_feu"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "mismatch");
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.ok(f.role === "mismatch");
  assert.equal(f.projectKey, "faible_risque_feu");
  assert.equal(f.headlineSubject, "un environnement peu exposé aux incendies");
  assert.match(f.statement, /officiellement recensé par l'État/);
  assert.equal(f.status, "Risque recensé");
  // LE FONDEMENT dit d'où vient la vérité — une reconnaissance officielle — plutôt que de se déguiser en
  // mesure qu'on n'a pas. Le libellé de la source est conservé : c'est ce qui rend le fait auditable.
  assert.equal(f.basis.kind, "declared_hazard");
  assert.equal(f.basis.kind === "declared_hazard" && f.basis.observedLabel, "Feu de forêt");
  assert.match(f.limitation!, /pas la présence d'un massif forestier/);
  // Un mismatch ne porte PAS d'action : le geste est restauré par la composition.
  assert.equal("action" in f, false);
});

test("FEU RECENSÉ : la composition restaure le geste que le mismatch ne peut pas porter", () => {
  const facts_ = { ...CAP_FERRET, climat: EPARGNEE, hasAddress: true };
  const p = projetClimat("faible_risque_feu");
  const r = run(facts_, p);
  const comps = composeFacts(r, facts_, p);
  const c = comps.find((x) => x.kind === "mismatch_with_action");
  assert.ok(c, "la composition doit absorber le mismatch recensé, comme elle absorbe le mismatch chiffré");
  assert.equal(c!.kind === "mismatch_with_action" && c!.action.label, "Regardez la végétation autour du terrain");
});

test("FEU DÉCLARÉ + indice AU-DESSUS du seuil : le mismatch reste prioritaire (le chiffre parle)", () => {
  const r = run({ ...CAP_FERRET, climat: EXPOSEE }, projetClimat("faible_risque_feu"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(f.role, "mismatch"); // pas la carte « risque déclaré » : l'écart chiffré prime
});

test("FEU NON recensé + indice sous le seuil + commune PEU boisée : satisfied silencieux, légitime", () => {
  const r = run(facts({ climat: EPARGNEE, risquesDeclares: { wildfire: false }, boisementPct: 12 }), projetClimat("faible_risque_feu"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "satisfied");
  assert.equal(e.facts.length, 0);
});

// ── LE BOISEMENT : un facteur de CONTEXTE, jamais une preuve de risque ───────────

test("BOISEMENT élevé sans risque recensé : une VERIFICATION, et plus aucun « satisfait »", () => {
  // GASPAR ne recense pas partout et notre indice météo est aveugle au massif : deux silences ne font
  // pas une bonne nouvelle. Le couvert forestier interdit de conclure, il n'établit rien.
  const r = run(facts({ climat: EPARGNEE, risquesDeclares: { wildfire: false }, boisementPct: 84.7 }), projetClimat("faible_risque_feu"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "verification");
  assert.notEqual(e.outcome, "satisfied");
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.ok(f.role === "verification");
  assert.equal(f.materialityTier, "secondary");
  assert.match(f.statement, /la forêt couvre 85 % du territoire communal/);
  assert.match(f.statement, /10 % de communes les plus boisées/);
  // JAMAIS un mismatch : un boisement élevé n'est pas un écart au projet établi.
  assert.notEqual(f.role, "mismatch");
  // LA LIMITE dit ce que la donnée ne dit pas — sans elle, le lecteur y lirait un risque établi.
  assert.match(f.limitation!, /ne suffit pas à établir un risque d'incendie/);
  assert.equal(f.signalConvention, "futur•e signale cet environnement à partir de 70 % de couvert forestier.");
});

test("BOISEMENT : sous le seuil, aucun signal sur cette seule base", () => {
  const r = run(facts({ climat: EPARGNEE, risquesDeclares: { wildfire: false }, boisementPct: 55 }), projetClimat("faible_risque_feu"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!.outcome, "satisfied");
});

test("BOISEMENT : le risque RECENSÉ prime — un seul signal feu, jamais deux", () => {
  const r = run({ ...CAP_FERRET, climat: EPARGNEE, boisementPct: 84.7 }, projetClimat("faible_risque_feu"));
  const feux = r.facts.filter((x) => x.ruleId === "territoire.climat-feu");
  assert.equal(feux.length, 1);
  assert.equal(feux[0]!.role, "mismatch"); // le recensement, pas le contexte
});

test("BOISEMENT élevé + indice INDISPONIBLE : la carte de contexte s'affiche quand même", () => {
  // Une donnée climatique absente ne doit pas faire disparaître le seul signal qui reste.
  const r = run(facts({ climat: null, risquesDeclares: { wildfire: false }, boisementPct: 84.7 }), projetClimat("faible_risque_feu"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!.outcome, "uncertain");
});

test("SOURCE MUETTE (null) : on ne conclut pas à sa place — le silence de Géorisques n'est pas un « non »", () => {
  // `null` = la source n'a pas répondu. Elle ne vaut pas `{ wildfire: false }` : sinon une panne
  // deviendrait une bonne nouvelle, exactement le piège que ce moteur ferme partout ailleurs.
  const r = run(facts({ climat: EPARGNEE, risquesDeclares: null }), projetClimat("faible_risque_feu"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "satisfied"); // comportement actuel, faute de mieux
  // MAIS le jour où l'on saura distinguer « pas de risque » de « pas de réponse », ce test devra changer.
  // Il documente une limite connue, il ne la bénit pas.
});

test("FEU RECENSÉ, poids 1 : VISIBLE quand même, mais en secondaire — le dossier ne bascule pas", () => {
  // La seule exception à la doctrine du silence à poids 1. Un écart GRADUÉ se tait légitimement ; un
  // risque RECENSÉ est binaire, et le taire cache un fait officiel à qui l'a nommé, même faiblement.
  // Vu à l'écran : « rien ne penche nettement pour ou contre », sur une commune qui brûlait.
  const r = run({ ...CAP_FERRET, climat: EPARGNEE }, projetClimat("faible_risque_feu", 1));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "mismatch");
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.ok(f, "le risque recensé doit produire une carte, même à poids 1");
  assert.equal(f.materialityTier, "secondary"); // la matérialité suit le poids déclaré
  // UN mismatch secondaire SEUL ne bascule pas le dossier : le lecteur a dit que ça comptait peu, on ne
  // réécrit pas son verdict pour autant (cf. criteria-registry : il en faut deux, ou un structurant).
  const summary = buildCriteriaRegistry(projetClimat("faible_risque_feu", 1), r);
  assert.notEqual(summary.orientation, "arbitration");
});

test("FEU, poids 1 SANS risque recensé : silencieux, la doctrine générale s'applique", () => {
  // L'exception ne vaut QUE pour un risque recensé. Un danger météo au-dessus du seuil, déclaré à poids
  // 1, reste silencieux comme la chaleur : c'est un écart gradué, et le lecteur a dit son importance.
  const r = run(facts({ climat: EXPOSEE, risquesDeclares: { wildfire: false } }), projetClimat("faible_risque_feu", 1));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.equal(e.outcome, "mismatch");
  assert.equal(e.facts.length, 0);
});

test("ORIENTATION : le danger d'incendie déclaré bascule le dossier en arbitrage", () => {
  const p = projetClimat("faible_risque_feu");
  const r = run(facts({ climat: EXPOSEE }), p);
  const summary = buildCriteriaRegistry(p, r);
  assert.equal(summary.orientation, "arbitration");
  const feu = summary.registry.find((c) => c.criterionKey === "faible_risque_feu")!;
  assert.equal(feu.outcome, "mismatch");
});

test("PLUIES : un cumul en 24 heures, jamais « par an » ; le « mm » reste (le sujet ne le porte pas)", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_precip_extremes"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-pluies")!;
  assert.ok(f.role === "verification");
  assert.match(f.statement, /74 mm/);
  assert.match(f.statement, /sur 24 heures/);
  assert.doesNotMatch(f.statement, /mm par an/);
  assert.doesNotMatch(f.statement, /futur•e signale/);
  assert.equal(f.signalConvention, "futur•e signale cette intensité à partir de 65 mm.");
});

test("PLUIES et INONDATION peuvent COEXISTER sans dire deux fois la même chose", () => {
  const p = project({
    reformulation: "x", hardConstraints: {},
    preferences: [{ key: "faible_precip_extremes", weight: 3 }, { key: "faible_risque_inondation", weight: 3 }],
  });
  const r = run(facts({ climat: EXPOSEE, inondationRisque: 80 }), p);
  const pluies = r.facts.find((x) => x.ruleId === "territoire.climat-pluies")!;
  const inond = r.facts.find((x) => x.ruleId === "territoire.inondation-exposition")!;
  assert.ok(pluies && inond);
  // Deux sujets DISTINCTS : ce que le ciel déverse, et ce que le territoire en fait.
  assert.notEqual(pluies.topic, inond.topic);
  assert.match(pluies.action!.label, /^Regardez où va l'eau autour de l'adresse$/);
  assert.match(pluies.action!.detail!, /réseaux d'évacuation/);
  assert.match(inond.action!.label, /état des risques/);
});

test("LA MATÉRIALITÉ SUIT LE POIDS DÉCLARÉ, jamais l'intensité seule", () => {
  const fort = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur", 3));
  const tiede = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur", 2));
  assert.equal(fort.facts.find((x) => x.ruleId === "territoire.climat-chaleur")!.materialityTier, "structuring");
  assert.equal(tiede.facts.find((x) => x.ruleId === "territoire.climat-chaleur")!.materialityTier, "secondary");
  // JAMAIS decision_critical : une préférence n'est pas une condition non négociable.
  for (const f of [...fort.facts, ...tiede.facts]) {
    if (f.ruleId.startsWith("territoire.climat-")) assert.notEqual(f.materialityTier, "decision_critical");
  }
});

// ── LES RÈGLES DE SANTÉ ENVIRONNEMENTALE ─────────────────────────────────────

import { buildSanteFacts } from "./sante-facts.ts";

// Des valeurs RÉELLES : Toulouse (PM2,5 8,65 ; NO2 14,46 ; un aéroport à 6,5 km ; un Seveso seuil haut).
const SANTE_EXPOSEE = buildSanteFacts({
  viv: { pm25: 8.65, no2: 14.46 },
  calmeSonore: { score: 18, sourceDominante: "auto", distanceKm: 0.8 },
  expoIndustrielle: { score: 44, sourceDominante: "seveso_haut" },
});
const SANTE_EPARGNEE = buildSanteFacts({
  viv: { pm25: 6.2, no2: 3.4 },
  calmeSonore: { score: 100, sourceDominante: null, distanceKm: null },
  expoIndustrielle: { score: 96, sourceDominante: "industrie" },
});

test("AIR : au-delà d'un seuil SANITAIRE OFFICIEL, une carte chiffrée et sourcée", () => {
  const r = run(facts({ sante: SANTE_EXPOSEE }), projetClimat("air_sain"));
  const f = r.facts.find((x) => x.ruleId === "territoire.sante-air")!;
  assert.equal(f.role, "verification");
  assert.match(f.statement, /14,5 µg\/m³/); // la valeur mesurée, pas un percentile
  assert.match(f.statement, /Organisation mondiale de la santé/);
  assert.match(f.statement, /10 µg\/m³/); // le seuil, nommé
  // LE GRAIN EST LA VRAIE LIMITE : le NO2 est le marqueur du trafic, il s'effondre à quelques dizaines
  // de mètres d'un axe. Une moyenne communale ne dit rien de la rue, et la carte le dit.
  assert.match(f.limitation!, /d'une rue à l'autre/);
});

test("AIR : la PREUVE suit le constat — le polluant en cause, jamais PM2,5 par défaut", () => {
  // Vu à l'écran sur Lille : le constat parlait du dioxyde d'azote (au-delà de la recommandation OMS) et
  // la chip affichait « PM2,5 9,9 µg/m³ » — une valeur qui ne dépasse rien, sur un polluant dont le
  // constat ne dit pas un mot. Même défaut que le « bug d'Antibes » pour la chaleur, jamais corrigé ici.
  const no2Seul = facts({ sante: { air: { no2: 15.9, pm25: 9.9, notable: true, complet: true } } as never });
  const r = run(no2Seul, projetClimat("air_sain"));
  const f = r.facts.find((x) => x.ruleId === "territoire.sante-air")!;
  assert.ok(f.role === "verification");
  assert.match(f.statement, /dioxyde d'azote/);
  assert.equal(f.statement.includes("particules fines"), false);
  // UNE seule preuve, celle du polluant qui a déclenché.
  assert.equal(f.evidence.length, 1);
  assert.equal(f.evidence[0]!.factId, "viv.no2");
  assert.match(f.evidence[0]!.observedValue!, /^NO₂ 15,9/);
});

test("AIR : les DEUX polluants en dépassement -> deux phrases, deux preuves, dans le même ordre", () => {
  const deux = facts({ sante: { air: { no2: 15.9, pm25: 12.4, notable: true, complet: true } } as never });
  const f = run(deux, projetClimat("air_sain")).facts.find((x) => x.ruleId === "territoire.sante-air")!;
  assert.ok(f.role === "verification");
  assert.deepEqual(f.evidence.map((e) => e.factId), ["viv.no2", "viv.pm25"]);
});

test("AIR : sous les seuils, satisfied SILENCIEUX (mais ce n'est PAS « l'air est pur »)", () => {
  // Aucune commune française ne descend sous la recommandation OMS pour les particules fines (5 µg/m³).
  // `satisfied` dit « aucun seuil officiel dépassé », jamais « l'air est pur » : la nuance appelle mismatch.
  const r = run(facts({ sante: SANTE_EPARGNEE }), projetClimat("air_sain"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.sante-air")!.outcome, "satisfied");
  assert.equal(r.facts.some((x) => x.ruleId === "territoire.sante-air"), false);
});

test("AIR : un polluant non lu -> uncertain, jamais « rien à signaler »", () => {
  const partiel = buildSanteFacts({ viv: { pm25: 7.1 } }); // pas de NO2
  const r = run(facts({ sante: partiel }), projetClimat("air_sain"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.sante-air")!.outcome, "uncertain");
});

test("BRUIT : le FAIT est absolu (une autoroute, une distance), le SCORE n'est jamais affiché", () => {
  const r = run(facts({ sante: SANTE_EXPOSEE }), projetClimat("calme_sonore"));
  const f = r.facts.find((x) => x.ruleId === "territoire.sante-bruit")!;
  assert.match(f.statement, /autoroute ou une voie rapide/);
  assert.match(f.statement, /800 mètres/); // sous le kilomètre, le mètre est l'unité qu'on habite
  assert.match(f.statement, /futur•e signale ce type de source à partir de 1 km/);
  assert.doesNotMatch(f.statement, /18|\/100|score/); // le score maison ne sort JAMAIS
  assert.match(f.action!.label, /^Écoutez sur place, à plusieurs heures$/);
  assert.match(f.action!.detail!, /carte de bruit de la commune/);
});

test("BRUIT : loin de toute infrastructure, c'est une BONNE NOUVELLE, pas une donnée manquante", () => {
  const r = run(facts({ sante: SANTE_EPARGNEE }), projetClimat("calme_sonore"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.sante-bruit")!.outcome, "satisfied");
});

test("INDUSTRIE : la phrase dit la CATÉGORIE LÉGALE, que le lecteur peut retrouver sur Géorisques", () => {
  const r = run(facts({ sante: SANTE_EXPOSEE }), projetClimat("faible_exposition_industrielle"));
  const f = r.facts.find((x) => x.ruleId === "territoire.sante-industrie")!;
  assert.match(f.statement, /Seveso seuil haut/);
  assert.doesNotMatch(f.statement, /44|score/); // le score hybride maison n'est qu'un déclencheur
  assert.match(f.action!.detail!, /Géorisques/);
});

test("INDUSTRIE : un site banal et lointain ne déclenche rien", () => {
  const r = run(facts({ sante: SANTE_EPARGNEE }), projetClimat("faible_exposition_industrielle"));
  assert.equal(r.evaluations.find((x) => x.ruleId === "territoire.sante-industrie")!.outcome, "satisfied");
});

test("SANTÉ : les trois cartes passent assertFactValid, et aucune n'est decision_critical", () => {
  const p = project({
    reformulation: "x", hardConstraints: {},
    preferences: [
      { key: "air_sain", weight: 3 }, { key: "calme_sonore", weight: 3 },
      { key: "faible_exposition_industrielle", weight: 3 },
    ],
  });
  const r = run(facts({ sante: SANTE_EXPOSEE }), p);
  const santeFacts = r.facts.filter((x) => x.ruleId.startsWith("territoire.sante-"));
  assert.equal(santeFacts.length, 3);
  for (const f of santeFacts) {
    assertFactValid(f, p);
    assert.notEqual(f.materialityTier, "decision_critical"); // une préférence n'est pas une condition dure
    assert.ok(f.limitation, "chaque carte dit à quelle maille elle est vraie");
    assert.ok(f.action, "et ce qu'il reste à aller regarder");
  }
});

test("AGRICULTURE : le critère reste NON EXAMINÉ, et c'est assumé", () => {
  // Aucun seuil défendable au grain commune (l'IFT n'a pas de palier officiel, la part de surface agricole
  // de l'index monte à 152 %), et le risque réel (la dérive de pulvérisation) dépend des PARCELLES voisines
  // du logement : il est vrai à une autre maille. Le forcer ici reproduirait la faute de la sécheresse.
  const r = run(facts({ sante: SANTE_EXPOSEE }), projetClimat("faible_pression_agricole"));
  assert.equal(r.evaluations.some((e) => e.projectKeys.includes("faible_pression_agricole")), false);
});

test("un projet priorisant la mobilité sur une commune SANS réseau produit un mismatch d'absence", () => {
  const f = facts({ localNetwork: { measured: true, access: null } });
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "mobilite_quotidienne", weight: 3 }] });
  const r = run(f, p);
  const mm = r.facts.find((x) => x.role === "mismatch" && x.ruleId === "territoire.absence-mobilite_quotidienne");
  assert.ok(mm, "un fait d'absence mobilité doit être émis");
  assert.equal((mm as { basis: { kind: string } }).basis.kind, "named_absence");
  // Le sujet du headline nomme la PRIORITÉ du lecteur, jamais l'indicateur défavorable.
  assert.equal((mm as { headlineSubject: string }).headlineSubject, "les transports en commun du quotidien");
  assertFactValid(mm!, p);
});

test("assertFactValid refuse un mismatch sans headlineSubject", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "cadre_calme", weight: 3 }] });
  const base = {
    id: "x", ruleId: "territoire.mismatch-cadre_calme", sourceFactIds: [], module: "territoire" as const,
    role: "mismatch" as const, projectKey: "cadre_calme" as const, materialityTier: "structuring" as const,
    topic: "le cadre calme", statement: "constat",
    basis: { kind: "relative_position" as const, rankLow: 0, rankHigh: 0.1, universe: "communes_france" as const, distributionVersion: "v" },
    evidence: [{ factId: "x", module: "territoire" as const, label: "T", grain: "commune" as const }],
  };
  assert.throws(() => assertFactValid({ ...base, headlineSubject: "" }, p), /headlineSubject/);
  assert.throws(
    () => assertFactValid({ ...base, headlineSubject: "un sujet beaucoup trop long pour tenir dans une phrase de héros" }, p),
    /headlineSubject/,
  );
  assert.throws(() => assertFactValid({ ...base, headlineSubject: "le calme." }, p), /headlineSubject/);
});

test("assertFactValid : mismatch climate_threshold — au moins une mesure, au moins un axe défavorable", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }] });
  const mesure = { key: "days_over_35" as const, projectedValue: 9, threshold: 8, unit: "days" as const, isUnfavorable: true };
  const base = {
    id: "c", ruleId: "territoire.climat-chaleur", sourceFactIds: [], module: "territoire" as const,
    role: "mismatch" as const, projectKey: "faible_chaleur" as const, materialityTier: "structuring" as const,
    topic: "les fortes chaleurs", headlineSubject: "des étés supportables", statement: "…",
    basis: { kind: "climate_threshold" as const, horizon: 2050, referencePeriod: "1976-2005", conventionId: "clim-conv-1", trigger: "any" as const, measures: [mesure] },
    evidence: [{ factId: "x", module: "territoire" as const, label: "T", grain: "commune" as const }],
  };
  assertFactValid(base, p); // valide
  assert.throws(() => assertFactValid({ ...base, basis: { ...base.basis, measures: [] } }, p), /sans mesure/);
  assert.throws(() => assertFactValid({ ...base, basis: { ...base.basis, measures: [{ ...mesure, isUnfavorable: false }] } }, p), /sans axe défavorable/);
});

test("assertFactValid : alignment — headlineSubject et preuve exigés, fondement DANS la liste blanche", () => {
  const p = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_soins", weight: 3 }] });
  const base = {
    id: "a", ruleId: "territoire.alignment-acces_soins", sourceFactIds: [], module: "territoire" as const,
    role: "alignment" as const, projectKey: "acces_soins" as const, materialityTier: "structuring" as const,
    topic: "l'accès aux soins", headlineSubject: "l'accès aux soins",
    statement: "Parmi les 10 % de communes où il est le plus favorable en France",
    basis: { kind: "relative_position" as const, rankLow: 0.9, rankHigh: 0.99, universe: "communes_france" as const, distributionVersion: "v" },
    evidence: [{ factId: "x", module: "territoire" as const, label: "T", grain: "commune" as const }],
  };
  assertFactValid(base, p); // valide
  assert.throws(() => assertFactValid({ ...base, headlineSubject: "" }, p), /headlineSubject/);
  assert.throws(() => assertFactValid({ ...base, evidence: [] }, p), /preuve/);
  // named_absence n'est JAMAIS un fondement d'alignment : une absence de signal ne prouve pas un positif.
  assert.throws(
    () => assertFactValid({ ...base, basis: { kind: "named_absence" } as unknown as typeof base.basis }, p),
    /liste blanche/,
  );
  // La limitation d'un alignment est réservée aux nuances méthodologiques (ensoleillement / douceur).
  const pCalme = project({ reformulation: "x", hardConstraints: {}, preferences: [{ key: "cadre_calme", weight: 3 }] });
  assert.throws(
    () => assertFactValid({ ...base, projectKey: "cadre_calme" as const, limitation: "une limite de portée interdite" }, pCalme),
    /limitation/,
  );
});

// LE NOM DE LA COMMUNE N'ENTRE JAMAIS DANS UN TOPIC. Le topic n'est lu qu'à un seul endroit, la
// conclusion, qui nomme déjà le lieu dans la même phrase : « Le principal point à contrôler à
// Toulouse : les fortes chaleurs à Toulouse. » Huit règles portaient ce doublon, invisible tant que
// les fixtures de test employaient des sujets fabriqués. Ce test les fait tourner sur une commune au
// nom impossible à confondre, et lit ce qu'elles écrivent vraiment.
//
// Les incompatibilités sont exclues : leur topic décrit le LIEU (« la distance de X au littoral »),
// et la conclusion ne le lit plus depuis qu'elle rend la condition telle que le lecteur l'a posée
// (`constraintLabel`, cf. conclusion-plan.ts).
test("aucun topic de réserve ne répète le nom de la commune", () => {
  const NOM = "Zzyzxville";
  const sante = {
    air: { pm25: 22, no2: 55, notable: true, complet: true },
    bruit: { source: "auto" as const, distanceKm: 0.3, notable: true, lu: true },
    industrie: { classe: "seveso_seuil_haut" as const, notable: true, lu: true },
  };
  const p = project({
    reformulation: "x",
    hardConstraints: {},
    preferences: [
      { key: "faible_chaleur", weight: 3 }, { key: "faible_risque_feu", weight: 3 },
      { key: "faible_precip_extremes", weight: 3 }, { key: "air_sain", weight: 3 },
      { key: "calme_sonore", weight: 3 }, { key: "faible_expo_industrielle", weight: 3 },
      { key: "faible_risque_inondation", weight: 3 },
    ],
  });
  const r = run(facts({ nom: NOM, climat: EXPOSEE, sante, inondationRisque: 80, catnatInondation: 12 }), p);
  const reserves = r.facts.filter((f) => f.role !== "incompatibility");
  assert.ok(reserves.length >= 5, `attendu plusieurs réserves, obtenu ${reserves.length}`);
  for (const f of reserves) {
    assert.equal(f.topic.includes(NOM), false, `${f.ruleId} : le topic répète le nom (« ${f.topic} »)`);
  }
});

// UNE PASTILLE CHIFFRÉE QU'AUCUNE PHRASE N'EXPLIQUE se lit comme un chiffre lâché là. Vu à Antibes :
// le constat ne parlait que des nuits tropicales, et la carte affichait quand même « 5 jours à
// l'horizon 2050 ». Les deux axes étaient mis en preuve, notables ou non.
test("chaleur : seul l'axe dont le constat parle entre en preuve", () => {
  // Des nuits tropicales très marquées, des jours qui ne franchissent pas le seuil de signalement.
  const nuitsSeules = buildClimatFacts({
    gwl20: { h: "2050", v: { NORTX35D_yr: 0, ATX35D_yr: 0, NORTR_yr: 39, ATR_yr: 39, NORIFM40_yr: 1, AIFM40_yr: 0, NORRx1d_yr: 43, ARRx1d_yr: 0.13 } },
  })!;
  const r = run(facts({ climat: nuitsSeules }), projetClimat("faible_chaleur"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-chaleur");
  if (!f) return; // la commune ne déclenche pas la règle : rien à vérifier ici
  assert.match(f.statement, /nuits tropicales/);
  assert.equal(f.statement.includes("35 °C"), false);
  assert.equal(f.evidence.some((e) => e.factId === "climat.joursTresChauds"), false);
  assert.equal(f.evidence.some((e) => e.factId === "climat.nuitsTropicales"), true);
});
