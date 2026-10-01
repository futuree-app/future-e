// FUT-8, étape 7 : les gestes du lecteur (route /api/project/criterion), sur la lib pure.
import test from "node:test";
import assert from "node:assert/strict";
import { appliquerGeste, lireGeste, type CriterionAction } from "./criterion-gestes.ts";
import { normalizeUserProject, type UserProject, type CriterionRef } from "../user-project.ts";
import { criterionFingerprint, isConfirmed, isStale } from "./conditions.ts";
import { parsedFingerprint, effectiveHardConstraints, effectivePreferences } from "./effective-value.ts";
import { criterionCapability } from "./capability.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const NOW = "2026-10-01T12:00:00.000Z";
function projet(hc: HardConstraints, prefs: { key: string; weight: number; source?: string }[] = [], extra: Record<string, unknown> = {}): UserProject {
  return normalizeUserProject({ posture: "recherche", rawText: "…", updatedAt: "2026-10-01T00:00:00.000Z", parsed: { reformulation: "x", hardConstraints: hc, preferences: prefs, communeAncre: [{ label: "Brest" }] }, ...extra })!;
}
function ok(p: UserProject, g: CriterionAction): UserProject {
  const r = appliquerGeste(p, g, NOW);
  assert.equal(r.ok, true, r.ok ? "" : r.error);
  return (r as { project: UserProject }).project;
}
const NEAR: CriterionRef = { kind: "hard", key: "nearPlace", instance: null };

test("préciser « à vol d'oiseau » : la précision est posée, sans condition, sans toucher au texte analysé", () => {
  const p = projet({ nearPlace: { label: "Nantes", maxKm: 20 } });
  const apres = ok(p, { action: "definir", criterion: NEAR, seen: parsedFingerprint(p, NEAR)!, definition: { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 } });
  assert.equal(apres.definitions?.length, 1);
  assert.equal(apres.conditions, undefined);
  assert.deepEqual(apres.parsed, p.parsed);
  assert.equal(effectiveHardConstraints(apres).nearPlace?.metric, "vol_oiseau");
  // Modifier remplace, sans empiler.
  const route = ok(apres, { action: "definir", criterion: NEAR, seen: parsedFingerprint(apres, NEAR)!, definition: { kind: "distance_lieu", metric: "route", maxKm: 20 } });
  assert.equal(route.definitions?.length, 1);
  assert.equal(effectiveHardConstraints(route).nearPlace?.metric, "route");
});

test("préciser et confirmer d'un geste ; retirer la précision rend la condition « à revoir », sans la supprimer", () => {
  const p = projet({ nearPlace: { label: "Nantes", maxKm: 20 } });
  const conf = ok(p, { action: "confirmer", criterion: NEAR, seen: criterionFingerprint(p, NEAR)!, definition: { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20 } });
  assert.equal(isConfirmed(conf, NEAR), true);
  assert.equal(criterionCapability({ kind: "hard", key: "nearPlace", hc: effectiveHardConstraints(conf) }, "adresse").capability, "trancher");
  const sansPrecision = ok(conf, { action: "retirer_definition", criterion: NEAR });
  assert.equal(sansPrecision.conditions?.length, 1);
  assert.equal(isStale(sansPrecision, NEAR), true);
  // Retirer la condition garde la précision.
  const sansCondition = ok(conf, { action: "retirer_condition", criterion: NEAR });
  assert.equal(sansCondition.conditions, undefined);
  assert.equal(sansCondition.definitions?.length, 1);
});

test("confirmer sans précision ; l'empreinte vue doit être celle du serveur (sinon 409)", () => {
  const p = projet({ zones: [{ zone: "bretagne", strength: "hard" }] });
  const zones: CriterionRef = { kind: "hard", key: "zones", instance: null };
  const conf = ok(p, { action: "confirmer", criterion: zones, seen: criterionFingerprint(p, zones)!, interpretation: "zones:region:v1" });
  assert.equal(isConfirmed(conf, zones), true);
  assert.equal(conf.conditions?.[0]?.interpretation, "zones:region:v1");
  const r = appliquerGeste(p, { action: "confirmer", criterion: zones, seen: "périmée" }, NOW);
  assert.deepEqual(r, { ok: false, status: 409, error: "Votre projet a changé entre-temps. Rechargez la page." });
});

test("cas 21 : confirmer « quitter Lyon » avec son périmètre ; Bordeaux n'est pas touché ; un élément absent est refusé", () => {
  const p = projet({ excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] });
  const lyon: CriterionRef = { kind: "hard", key: "excludePlace", instance: "lyon" };
  const conf = ok(p, { action: "confirmer", criterion: lyon, seen: criterionFingerprint(p, lyon)!, definition: { kind: "quitter_ville", scope: "commune" } });
  assert.equal(isConfirmed(conf, lyon), true);
  assert.equal(isConfirmed(conf, { kind: "hard", key: "excludePlace", instance: "bordeaux" }), false);
  // La famille entière ne se confirme pas d'un bloc : on désigne la ville.
  assert.equal(appliquerGeste(p, { action: "confirmer", criterion: { kind: "hard", key: "excludePlace", instance: null }, seen: "x" }, NOW).ok, false);
  assert.equal(appliquerGeste(p, { action: "confirmer", criterion: { kind: "hard", key: "excludePlace", instance: "nantes" }, seen: "x" }, NOW).ok, false);
});

test("macro-zone : le périmètre accepté doit être une convention « périmètre » connue, pour une zone du projet", () => {
  const p = projet({ zones: [{ zone: "sud_ouest", strength: "hard" }] });
  const zones: CriterionRef = { kind: "hard", key: "zones", instance: null };
  const seen = parsedFingerprint(p, zones)!;
  const bon = ok(p, { action: "definir", criterion: zones, seen, definition: { kind: "perimetre_zones", conventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }] } });
  assert.equal(effectiveHardConstraints(bon).zonesConventions?.length, 1);
  for (const conventions of [
    [{ token: "sud", conventionId: "zone:sud", conventionVersion: 1 }],                  // zone absente du projet
    [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 7 }],      // version inconnue
    [{ token: "sud_ouest", conventionId: "montagne:600m-chef-lieu", conventionVersion: 1 }], // historique
  ]) {
    assert.equal(appliquerGeste(p, { action: "definir", criterion: zones, seen, definition: { kind: "perimetre_zones", conventions } }, NOW).ok, false);
  }
  // Une variante d'une autre famille est refusée.
  assert.equal(appliquerGeste(p, { action: "definir", criterion: zones, seen, definition: { kind: "quitter_ville", scope: "commune" } }, NOW).ok, false);
});

test("ancre : confirmer une préférence d'ancre l'adopte dans la même écriture ; garder puis ne plus garder", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const vie: CriterionRef = { kind: "preference", key: "vie_locale", instance: null };
  const conf = ok(p, { action: "confirmer", criterion: vie, seen: criterionFingerprint(p, vie)! });
  assert.equal(conf.adoptions?.length, 1);
  assert.deepEqual(conf.adoptions?.[0]?.origin, { kind: "ancre", label: "Brest" });
  assert.equal(isConfirmed(conf, vie), true);
  // Garder seul.
  const garde = ok(p, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: criterionFingerprint(p, vie)! });
  assert.equal(garde.adoptions?.[0]?.weight, 2);
  // L'adoption survit au retrait de l'ancre.
  const sansAncre = normalizeUserProject({ ...garde, parsed: { ...garde.parsed!, preferences: [], communeAncre: [] } })!;
  assert.deepEqual(effectivePreferences(sansAncre).map((x) => x.key), ["vie_locale"]);
  const plus = ok(garde, { action: "retirer_adoption", criterion: { kind: "preference", key: "vie_locale" } });
  assert.equal(plus.adoptions, undefined);
  // Une préférence dite par le lecteur ne s'« adopte » pas.
  const dite = projet({}, [{ key: "vie_locale", weight: 2, source: "parse" }]);
  assert.equal(appliquerGeste(dite, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" }, NOW).ok, false);
});

test("lecture du corps : un geste inconnu ou incomplet est refusé", () => {
  assert.equal(lireGeste({ action: "supprimer_tout" }), null);
  assert.equal(lireGeste({ action: "confirmer", criterion: { kind: "hard", key: "zones" } }), null);
  assert.equal(lireGeste({ action: "adopter", criterion: { kind: "hard", key: "zones" }, seen: "x" }), null);
  assert.deepEqual(lireGeste({ action: "retirer_condition", criterion: { kind: "hard", key: "excludePlace", instance: "lyon" } }),
    { action: "retirer_condition", criterion: { kind: "hard", key: "excludePlace", instance: "lyon" } });
});
