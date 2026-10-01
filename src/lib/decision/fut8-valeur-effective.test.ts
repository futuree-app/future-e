// FUT-8, étape 2 : valeur effective, empreintes par élément, péremption, adoptions durables.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProject, type UserProject, type CriterionRef } from "../user-project.ts";
import { effectiveHardConstraints, effectivePreferences, definitionValide, definitionPerimee, parsedFingerprint } from "./effective-value.ts";
import { criterionFingerprint, buildConfirmation, isConfirmed, preferenceSurfaced } from "./conditions.ts";
import { signatureDecisionnelle } from "./projet-materiel.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const LE_1ER = "2026-10-01T00:00:00.000Z";
function projet(hc: HardConstraints, prefs: { key: string; weight: number; source?: string }[] = [], extra: Record<string, unknown> = {}): UserProject {
  return normalizeUserProject({ posture: "recherche", rawText: "…", parsed: { reformulation: "x", hardConstraints: hc, preferences: prefs }, ...extra })!;
}
function definir(p: UserProject, ref: CriterionRef, corps: Record<string, unknown>): UserProject {
  const def = { ...corps, criterion: ref, parsedFingerprint: parsedFingerprint(p, ref), definedAt: LE_1ER, source: "user" };
  return normalizeUserProject({ ...p, definitions: [...(p.definitions ?? []), def] })!;
}
const NEAR: CriterionRef = { kind: "hard", key: "nearPlace", instance: null };

test("« à moins de 20 km de Nantes » + « à vol d'oiseau » : la valeur effective porte la métrique", () => {
  const p = projet({ nearPlace: { label: "Nantes", maxKm: 20 } });
  assert.equal(effectiveHardConstraints(p).nearPlace?.metric, undefined);
  const precise = definir(p, NEAR, { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 });
  assert.equal(effectiveHardConstraints(precise).nearPlace?.metric, "vol_oiseau");
  assert.notEqual(criterionFingerprint(precise, NEAR), criterionFingerprint(p, NEAR));
});

test("« à 30 minutes de Nantes » + « en voiture » : le temps prend son mode, les km disparaissent", () => {
  const p = projet({ nearPlace: { label: "Nantes", maxMinutes: 30, maxKm: 15 } });
  const e = effectiveHardConstraints(definir(p, NEAR, { kind: "temps_lieu", mode: "car", maxMinutes: 30 })).nearPlace!;
  assert.deepEqual([e.mode, e.maxMinutes, e.maxKm], ["car", 30, null]);
});

test("une définition se périme si le texte change (« Nantes » → « Rennes ») ; elle reste stockée", () => {
  const precise = definir(projet({ nearPlace: { label: "Nantes", maxKm: 20 } }), NEAR, { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 });
  const reparse = normalizeUserProject({ ...precise, parsed: { ...precise.parsed!, hardConstraints: { nearPlace: { label: "Rennes", maxKm: 20 } } } })!;
  assert.equal(definitionValide(reparse, NEAR), null);
  assert.equal(definitionPerimee(reparse, NEAR), true);
  assert.equal(reparse.definitions?.length, 1);
  assert.equal(effectiveHardConstraints(reparse).nearPlace?.metric, undefined);
});

test("une variante incompatible avec sa famille est ignorée (une unité de taille sur une distance)", () => {
  const p = projet({ nearPlace: { label: "Nantes", maxKm: 20 } });
  const faux = definir(p, NEAR, { kind: "taille", unit: "commune", min: null, max: 20000 });
  assert.equal(definitionValide(faux, NEAR), null);
});

test("quitter Lyon et éviter Bordeaux : chaque ville a sa définition, sa condition, sa péremption", () => {
  const p = projet({ excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] });
  const lyon: CriterionRef = { kind: "hard", key: "excludePlace", instance: "lyon" };
  const bordeaux: CriterionRef = { kind: "hard", key: "excludePlace", instance: "bordeaux" };
  const precise = definir(p, lyon, { kind: "quitter_ville", scope: "commune" });
  assert.deepEqual(effectiveHardConstraints(precise).excludePlace, [{ label: "Lyon", scope: "commune" }, { label: "Bordeaux" }]);
  const conf = normalizeUserProject({ ...precise, conditions: [buildConfirmation(precise, lyon, LE_1ER)] })!;
  assert.equal(isConfirmed(conf, lyon), true);
  assert.equal(isConfirmed(conf, bordeaux), false);
  // L'ordre du tableau ne compte pas.
  const inverse = normalizeUserProject({ ...conf, parsed: { ...conf.parsed!, hardConstraints: { excludePlace: [{ label: "Bordeaux" }, { label: "Lyon" }] } } })!;
  assert.equal(isConfirmed(inverse, lyon), true);
  // « Lyon » devient « Nantes » : seule la condition sur Lyon tombe ; Bordeaux n'est pas touché.
  const reparse = normalizeUserProject({ ...conf, parsed: { ...conf.parsed!, hardConstraints: { excludePlace: [{ label: "Nantes" }, { label: "Bordeaux" }] } } })!;
  assert.equal(isConfirmed(reparse, lyon), false);
  assert.equal(definitionPerimee(reparse, lyon), true);
});

test("préciser après avoir confirmé périme la confirmation : elle portait sur l'ancien sens", () => {
  const p = projet({ communeSize: { max: 20000 } });
  const taille: CriterionRef = { kind: "hard", key: "communeSize", instance: null };
  const conf = normalizeUserProject({ ...p, conditions: [buildConfirmation(p, taille, LE_1ER)] })!;
  assert.equal(isConfirmed(conf, taille), true);
  const precise = definir(conf, taille, { kind: "taille", unit: "commune", min: null, max: 20000 });
  assert.equal(isConfirmed(precise, taille), false);
});

test("région parisienne et macro-zones : la précision entre dans la valeur effective et l'empreinte", () => {
  const p = projet({ excludeZones: ["idf"] });
  const idf: CriterionRef = { kind: "hard", key: "excludeZones", instance: "idf" };
  const precise = definir(p, idf, { kind: "perimetre_parisien", perimetre: "petite_couronne" });
  assert.deepEqual(effectiveHardConstraints(precise).excludeZonesPerimetres, { idf: "petite_couronne" });
  const z = projet({ zones: [{ zone: "sud_ouest", strength: "hard" }] });
  const zones: CriterionRef = { kind: "hard", key: "zones", instance: null };
  const acceptee = definir(z, zones, { kind: "perimetre_zones", conventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }] });
  assert.equal(effectiveHardConstraints(acceptee).zonesConventions?.length, 1);
  assert.notEqual(criterionFingerprint(acceptee, zones), criterionFingerprint(z, zones));
});

test("adoption durable : retirer l'ancre ne retire pas « une vie locale forte » gardée par le lecteur", () => {
  const adoption = { criterion: { kind: "preference", key: "vie_locale" }, weight: 2, origin: { kind: "ancre", label: "Brest" }, adoptedAt: LE_1ER, source: "user" };
  const sansBrest = projet({}, [], { adoptions: [adoption] });
  assert.deepEqual(effectivePreferences(sansBrest), [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  assert.equal(preferenceSurfaced(sansBrest, "vie_locale"), true);
  // Le texte du lecteur prime s'il porte la même clé.
  const dite = projet({}, [{ key: "vie_locale", weight: 3, source: "parse" }], { adoptions: [adoption] });
  assert.deepEqual(effectivePreferences(dite), [{ key: "vie_locale", weight: 3, source: "parse" }]);
});

test("un projet sans précision garde exactement sa signature décisionnelle (rien ne périme à tort)", () => {
  for (const hc of [{ nearPlace: { label: "Nantes", maxKm: 20 } }, { zones: [{ zone: "bretagne", strength: "hard" as const }] }, { excludeZones: ["idf"] }]) {
    const p = projet(hc);
    assert.equal(signatureDecisionnelle(p), signatureDecisionnelle(normalizeUserProject({ ...p })!));
    assert.doesNotMatch(signatureDecisionnelle(p), /vol_oiseau|perimetres|conventions/); // aucun champ FUT-8 sans précision
  }
});
