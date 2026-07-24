import test from "node:test";
import assert from "node:assert/strict";
import {
  buildClimatFacts, reconstructReference, trajectoirePhrase, fmtClimatCount, CLIMAT_METRICS,
  type GwlScenarios,
} from "./climat-facts.ts";

// Un jeu réaliste : la valeur projetée croît avec l'horizon, l'anomalie aussi, et la référence
// (projeté moins anomalie) reste STABLE d'un horizon à l'autre. C'est cette stabilité qui autorise la
// reconstruction.
// Les anomalies de TEMPÉRATURE et de FEU sont absolues (des jours) ; celle de PLUIE est RELATIVE (une
// fraction), comme dans la vraie donnée. Un jeu d'essai qui mélangerait les deux ne prouverait rien.
const SC: GwlScenarios = {
  gwl15: { h: "2030", v: { NORTX35D_yr: 7, ATX35D_yr: 3, NORTR_yr: 18, ATR_yr: 7, NORIFM40_yr: 9, AIFM40_yr: 3, NORRx1d_yr: 71, ARRx1d_yr: 0.06 } },
  gwl20: { h: "2050", v: { NORTX35D_yr: 12, ATX35D_yr: 8, NORTR_yr: 31, ATR_yr: 20, NORIFM40_yr: 14, AIFM40_yr: 8, NORRx1d_yr: 78, ARRx1d_yr: 0.17 } },
  gwl30: { h: "2100", v: { NORTX35D_yr: 22, ATX35D_yr: 18, NORTR_yr: 55, ATR_yr: 44, NORIFM40_yr: 26, AIFM40_yr: 20, NORRx1d_yr: 89, ARRx1d_yr: 0.34 } },
};

test("la RÉFÉRENCE se reconstruit (projeté moins anomalie), par médiane des horizons", () => {
  // 7-3 = 4 ; 12-8 = 4 ; 22-18 = 4 -> 4 jours sur la période de référence 1976-2005.
  assert.equal(reconstructReference(SC, "NORTX35D_yr", "ATX35D_yr"), 4);
  assert.equal(reconstructReference(SC, "NORTR_yr", "ATR_yr"), 11);
});

test("un couple BOITEUX (valeur sans anomalie) est écarté, jamais complété", () => {
  const boiteux: GwlScenarios = {
    gwl15: { h: "2030", v: { NORTX35D_yr: 7 } }, // pas d'anomalie : inutilisable
    gwl20: { h: "2050", v: { NORTX35D_yr: 12, ATX35D_yr: 8 } },
  };
  assert.equal(reconstructReference(boiteux, "NORTX35D_yr", "ATX35D_yr"), 4); // le seul couple valide
});

test("aucune anomalie nulle part : la référence est null, JAMAIS zéro", () => {
  const sansAnom: GwlScenarios = { gwl20: { h: "2050", v: { NORTX35D_yr: 12 } } };
  assert.equal(reconstructReference(sansAnom, "NORTX35D_yr", "ATX35D_yr"), null);
});

test("les axes portent la valeur PROJETÉE (2050), la référence, et le seuil", () => {
  const f = buildClimatFacts(SC)!;
  assert.equal(f.joursTresChauds.projete, 12);
  assert.equal(f.joursTresChauds.reference, 4);
  assert.equal(f.joursTresChauds.threshold, CLIMAT_METRICS.joursTresChauds.threshold);
  assert.equal(f.nuitsTropicales.projete, 31);
  assert.equal(f.joursFeu.projete, 14);
  assert.equal(f.pluieMax24h.projete, 78);
});

test("« notable » se décide sur la valeur PROJETÉE, au seuil exact (>=)", () => {
  const f = buildClimatFacts(SC)!;
  assert.equal(f.joursTresChauds.notable, true); // 12 >= 8
  assert.equal(f.nuitsTropicales.notable, true); // 31 >= 25
  assert.equal(f.joursFeu.notable, true); // 14 >= 9
  assert.equal(f.pluieMax24h.notable, true); // 78 >= 65

  // Au seuil EXACT : la convention est « à partir de », le code applique `>=`, la phrase le dira.
  const auSeuil: GwlScenarios = { gwl20: { h: "2050", v: { NORTX35D_yr: 8, NORTR_yr: 25 } } };
  const g = buildClimatFacts(auSeuil)!;
  assert.equal(g.joursTresChauds.notable, true);
  assert.equal(g.nuitsTropicales.notable, true);

  const sous: GwlScenarios = { gwl20: { h: "2050", v: { NORTX35D_yr: 7.9, NORTR_yr: 24.9 } } };
  const h = buildClimatFacts(sous)!;
  assert.equal(h.joursTresChauds.notable, false);
  assert.equal(h.nuitsTropicales.notable, false);
});

test("UNE VALEUR ABSENTE N'EST PAS UNE EXPOSITION FAIBLE : projete null, notable faux", () => {
  // Le piège du `?? 0` : une donnée manquante ne doit pas devenir « zéro jour de chaleur ». La règle
  // verra `projete === null` et rendra `uncertain`, jamais `satisfied`.
  const partiel: GwlScenarios = { gwl20: { h: "2050", v: { NORTX35D_yr: 5 } } }; // pas de nuits tropicales
  const f = buildClimatFacts(partiel)!;
  assert.equal(f.joursTresChauds.projete, 5);
  assert.equal(f.joursTresChauds.notable, false);
  assert.equal(f.nuitsTropicales.projete, null);
  assert.equal(f.nuitsTropicales.notable, false); // et la règle ne pourra PAS conclure « tout va bien »
});

test("aucun scénario, ou aucune valeur : buildClimatFacts rend null (rien à examiner)", () => {
  assert.equal(buildClimatFacts(null), null);
  assert.equal(buildClimatFacts({}), null);
  assert.equal(buildClimatFacts({ gwl20: { h: "2050", v: {} } }), null);
});

test("la TRAJECTOIRE DATE sa référence (1976-2005), et ne dit JAMAIS « actuellement »", () => {
  const f = buildClimatFacts(SC)!;
  const p = trajectoirePhrase(f.joursTresChauds, "les jours au-dessus de 35 °C");
  // LE SUJET PORTE L'UNITÉ (« les jours au-dessus de 35 °C ») : la trajectoire n'écrit que le nombre,
  // « par an » reste la cadence. Fini le « 4 jours par an à 12 jours » (jours jours jours).
  assert.match(p, /de 4 par an sur la période de référence 1976-2005 à 12 à l'horizon 2050/);
  assert.doesNotMatch(p, /\d+ jours/); // le nombre n'est jamais suivi de « jours » : le sujet le dit déjà
  assert.doesNotMatch(p, /actuellement|aujourd'hui/i);
});

test("sans référence reconstructible, on ne FABRIQUE pas de comparaison", () => {
  const sansAnom: GwlScenarios = { gwl20: { h: "2050", v: { NORTX35D_yr: 12 } } };
  const f = buildClimatFacts(sansAnom)!;
  const p = trajectoirePhrase(f.joursTresChauds, "les jours au-dessus de 35 °C");
  assert.match(p, /atteindraient 12 par an à l'horizon 2050/);
  assert.doesNotMatch(p, /passeraient|contre/);
});

test("le CADRE HÉRITÉ : la 2e trajectoire ne redit ni la période ni le second horizon", () => {
  // Quand une phrase enchaîne deux trajectoires, la seconde hérite du cadre posé par la première :
  // « de 11 à 31 par an », sans « sur la période de référence », sans second « à l'horizon 2050 ».
  const f = buildClimatFacts(SC)!;
  const p = trajectoirePhrase(f.nuitsTropicales, "Les nuits tropicales, elles,", { heriteCadre: true });
  assert.match(p, /^Les nuits tropicales, elles, passeraient de 11 à 31 par an$/);
  assert.doesNotMatch(p, /période de référence|horizon/);
});

test("fmtClimatCount : une chip isolée DIT son unité, et « nuits » n'est PAS « jours »", () => {
  // Le bug d'unité : fmtClimat, aveugle au type de compte, rendait les nuits tropicales en « jours ».
  const f = buildClimatFacts(SC)!;
  assert.equal(fmtClimatCount(f.nuitsTropicales.projete!, f.nuitsTropicales), "31 nuits");
  assert.equal(fmtClimatCount(f.joursTresChauds.projete!, f.joursTresChauds), "12 jours");
  assert.equal(fmtClimatCount(f.pluieMax24h.projete!, f.pluieMax24h), "78 mm");
  assert.equal(fmtClimatCount(1, f.nuitsTropicales), "1 nuit"); // singulier
});

test("chaque axe porte le NOM de son compte (jour / nuit), source unique CLIMAT_METRICS", () => {
  const f = buildClimatFacts(SC)!;
  assert.equal(f.nuitsTropicales.countNoun, "nuit");
  assert.equal(f.joursTresChauds.countNoun, "jour");
  assert.equal(f.joursFeu.countNoun, "jour");
});

test("L'ANOMALIE DE PLUIE EST RELATIVE : on divise, on ne soustrait pas", () => {
  // LE PIÈGE QUI A FAILLI PASSER À L'ÉCRAN. DRIAS exprime les écarts de précipitation en FRACTION (0,11 =
  // +11 %), pas en millimètres. Soustraire 0,11 à 74 mm donnait « les pluies passeraient de 74 mm à
  // 74 mm » : faux, absurde, et parfaitement silencieux.
  const sc: GwlScenarios = {
    gwl15: { h: "2030", v: { NORRx1d_yr: 62, ARRx1d_yr: 0.06 } },
    gwl20: { h: "2050", v: { NORRx1d_yr: 68.4, ARRx1d_yr: 0.1 } },
    gwl30: { h: "2100", v: { NORRx1d_yr: 75, ARRx1d_yr: 0.2 } },
  };
  const f = buildClimatFacts(sc)!;
  assert.equal(f.pluieMax24h.projete, 68.4);
  // 68,4 / 1,1 = 62,2 : la référence est BIEN PLUS BASSE que la projection, comme attendu.
  assert.ok(f.pluieMax24h.reference! > 61 && f.pluieMax24h.reference! < 63, `reçu ${f.pluieMax24h.reference}`);
  // ET « PAR AN » DISPARAÎT : un cumul de pluie se mesure EN 24 HEURES. « 68 mm par an » ferait passer un
  // épisode intense pour une pluviométrie annuelle dérisoire.
  const p = trajectoirePhrase(f.pluieMax24h, "Les pluies les plus intenses");
  assert.match(p, /de 62 mm sur la période de référence 1976-2005 à 68 mm à l'horizon 2050/);
  assert.doesNotMatch(p, /mm par an/);
});

test("une anomalie relative de -100 % ne produit pas une référence infinie", () => {
  const absurde: GwlScenarios = { gwl20: { h: "2050", v: { NORRx1d_yr: 70, ARRx1d_yr: -1 } } };
  assert.equal(buildClimatFacts(absurde)!.pluieMax24h.reference, null);
});

// ── Lot D : classifyClimateComfort (mismatch / sous seuil / uncertain) ───────────

import { classifyClimateComfort, type ClimatFacts, type ClimatAxe } from "./climat-facts.ts";

function cx(projete: number | null, threshold: number, countNoun: "jour" | "nuit"): ClimatAxe {
  return { reference: null, projete, notable: projete != null && projete >= threshold, threshold, unit: "jours", countNoun };
}
function climat(joursProjete: number | null, nuitsProjete: number | null): ClimatFacts {
  return {
    joursTresChauds: cx(joursProjete, 8, "jour"),
    nuitsTropicales: cx(nuitsProjete, 25, "nuit"),
    joursFeu: cx(null, 9, "jour"),
    pluieMax24h: { reference: null, projete: null, notable: false, threshold: 65, unit: "mm" },
  };
}

test("classifyClimateComfort : les deux axes défavorables -> unfavorable, deux mesures", () => {
  const r = classifyClimateComfort(climat(12, 44));
  assert.equal(r.verdict, "unfavorable");
  assert.equal(r.basis?.kind, "climate_threshold");
  assert.equal(r.basis?.trigger, "any");
  assert.equal(r.basis?.measures.length, 2);
  assert.ok(r.basis?.measures.every((m) => m.isUnfavorable));
});

test("classifyClimateComfort : un SEUL axe défavorable suffit (trigger any)", () => {
  const r = classifyClimateComfort(climat(12, 10)); // jours notable (>=8), nuits sous seuil (25)
  assert.equal(r.verdict, "unfavorable");
  const jours = r.basis?.measures.find((m) => m.key === "days_over_35");
  const nuits = r.basis?.measures.find((m) => m.key === "tropical_nights");
  assert.equal(jours?.isUnfavorable, true);
  assert.equal(nuits?.isUnfavorable, false);
});

test("classifyClimateComfort : égalité au seuil -> défavorable (convention >=)", () => {
  assert.equal(classifyClimateComfort(climat(8, 10)).verdict, "unfavorable"); // 8 === seuil 8
});

test("classifyClimateComfort : les deux axes sous le seuil, tous présents -> under_threshold", () => {
  const r = classifyClimateComfort(climat(3, 10));
  assert.equal(r.verdict, "under_threshold");
  assert.equal(r.basis, null);
});

test("classifyClimateComfort : un axe absent (et aucun défavorable) -> uncertain", () => {
  assert.equal(classifyClimateComfort(climat(null, 10)).verdict, "uncertain");
});

// ── Lot FEU : classifyWildfireDanger (mismatch / sous seuil / uncertain) ─────────

import { classifyWildfireDanger, wildfireExposureAction } from "./climat-facts.ts";

function climatFeu(joursFeuProjete: number | null): ClimatFacts {
  return { ...climat(3, 10), joursFeu: cx(joursFeuProjete, 9, "jour") };
}

test("classifyWildfireDanger : au-dessus du seuil -> unfavorable, UNE mesure", () => {
  const r = classifyWildfireDanger(climatFeu(21));
  assert.equal(r.verdict, "unfavorable");
  assert.equal(r.basis?.kind, "climate_threshold");
  assert.equal(r.basis?.measures.length, 1); // mono-axe, contrairement à la chaleur
  assert.deepEqual(r.basis?.measures[0], {
    key: "fire_weather_days", projectedValue: 21, threshold: 9, unit: "days", isUnfavorable: true,
  });
});

test("classifyWildfireDanger : égalité au seuil -> défavorable (même convention >= que la chaleur)", () => {
  assert.equal(classifyWildfireDanger(climatFeu(9)).verdict, "unfavorable");
});

test("classifyWildfireDanger : sous le seuil -> under_threshold, aucun fondement", () => {
  const r = classifyWildfireDanger(climatFeu(4));
  assert.equal(r.verdict, "under_threshold");
  assert.equal(r.basis, null);
});

test("classifyWildfireDanger : indice non lu -> uncertain, JAMAIS « sous le seuil »", () => {
  // Le piège que le lot D a fermé pour la chaleur : une donnée absente n'est pas une bonne nouvelle.
  // Un indice forêt-météo qu'on n'a pas pu lire ne prouve pas un territoire épargné.
  const r = classifyWildfireDanger(climatFeu(null));
  assert.equal(r.verdict, "uncertain");
  assert.equal(r.basis, null);
});

test("wildfireExposureAction : le geste dépend du GRAIN disponible", () => {
  assert.equal(wildfireExposureAction(true).label, "Regardez la végétation autour du terrain");
  // Sans adresse, on ne peut rien dire des abords : la seule manœuvre est dans le produit.
  assert.equal(wildfireExposureAction(false).type, "renseigner_adresse");
});
