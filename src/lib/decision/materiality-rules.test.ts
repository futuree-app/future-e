import test from "node:test";
import assert from "node:assert/strict";
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

test("CHALEUR, exposition notable : une carte CHIFFRÉE, et jamais « actuellement »", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_chaleur"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-chaleur");
  assert.ok(f && f.role === "verification");
  assert.match(f.statement, /14 jours/); // la valeur projetée, pas un percentile
  assert.match(f.statement, /69 (jours|nuits)/);
  assert.match(f.statement, /période de référence 1976-2005/);
  assert.doesNotMatch(f.statement, /actuellement|aujourd'hui/i);
  // LA CONVENTION EST DITE, et elle écrit l'opérateur qu'elle applique (le code teste `>=`).
  assert.match(f.statement, /futur•e signale cette exposition à partir de/);
  assert.match(f.statement, /à partir de 8 jours par an au-dessus de 35 °C, ou de 25 nuits tropicales par an/);
  assert.ok(f.limitation?.includes("commune"));
  assert.equal(f.action?.type, "renseigner_adresse"); // sans adresse : il y a quelque chose à affiner
});

test("CHALEUR, avec une ADRESSE : le critère est TOUJOURS examiné (le fil de ruleConfort est refermé)", () => {
  // ruleConfort désactivait faible_chaleur dès qu'une adresse existait : le critère cessait d'être examiné
  // au moment où le dossier devenait le plus riche.
  const r = run(facts({ climat: EXPOSEE, hasAddress: true }), projetClimat("faible_chaleur"));
  const e = r.evaluations.find((x) => x.ruleId === "territoire.climat-chaleur")!;
  assert.equal(e.outcome, "verification");
  assert.equal(r.facts.find((x) => x.ruleId === "territoire.climat-chaleur")!.action?.type, "verifier_sur_place");
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

test("FEU : la phrase dit un DANGER MÉTÉOROLOGIQUE, jamais une probabilité d'incendie", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_risque_feu"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-feu")!;
  assert.match(f.statement, /indice forêt-météo/);
  assert.match(f.statement, /danger météorologique très sévère/);
  assert.match(f.statement, /50 jours/);
  assert.match(f.statement, /à partir de 9 jours par an/);
  assert.match(f.action!.label, /débroussaillement/);
});

test("PLUIES : un cumul en 24 heures, jamais « par an »", () => {
  const r = run(facts({ climat: EXPOSEE }), projetClimat("faible_precip_extremes"));
  const f = r.facts.find((x) => x.ruleId === "territoire.climat-pluies")!;
  assert.match(f.statement, /74 mm/);
  assert.match(f.statement, /sur 24 heures/);
  assert.doesNotMatch(f.statement, /mm par an/);
  assert.match(f.statement, /à partir de 65 mm/);
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
  assert.match(pluies.action!.label, /ruissellement/);
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
  assert.match(f.action!.label, /carte de bruit stratégique/);
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
  assert.match(f.action!.label, /Géorisques/);
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
});
