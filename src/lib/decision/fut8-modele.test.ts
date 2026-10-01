// FUT-8, étape 1 : le modèle. Définitions, adoptions, identité des éléments, registre des conventions.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProject, normalizeUserProjectInput, stampUserProject, normalizeDefinitions, normalizeAdoptions } from "../user-project.ts";
import { sameCriterion } from "./conditions.ts";
import { CONVENTIONS, conventionDeZone, conventionTranchable, conventionPar } from "./conventions.ts";
import { ZONE_TABLE } from "../geo-zones.ts";

const LE_1ER = "2026-10-01T00:00:00.000Z";
const DEF = { kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20, criterion: { kind: "hard", key: "nearPlace" }, parsedFingerprint: "fp", definedAt: LE_1ER, source: "user" };
const ADOPTION = { criterion: { kind: "preference", key: "vie_locale" }, weight: 2, origin: { kind: "ancre", label: "Brest" }, adoptedAt: LE_1ER, source: "user" };

test("définitions : chaque variante n'admet que ses combinaisons possibles ; l'illisible tombe une à une", () => {
  const lues = normalizeDefinitions([
    DEF,
    { ...DEF, metric: "chemin" },                                   // métrique inconnue
    { ...DEF, kind: "temps_lieu", mode: "bike", maxMinutes: 30 },   // vélo : non routable
    { ...DEF, kind: "temps_lieu", mode: "car", maxMinutes: 30 },
    { ...DEF, kind: "taille", unit: "commune", min: null, max: null }, // aucune borne
    { ...DEF, kind: "taille", unit: "unite_urbaine", min: null, max: 100000 },
    { ...DEF, kind: "quitter_ville", scope: "commune", criterion: { kind: "hard", key: "excludePlace", instance: "lyon" } },
    { ...DEF, kind: "perimetre_zones", conventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }], criterion: { kind: "hard", key: "zones" } },
    { ...DEF, kind: "perimetre_zones", conventions: [] },
    { ...DEF, source: "parser" },
    { ...DEF, criterion: { kind: "preference", key: "acces_soins", instance: "x" } }, // une préférence n'a pas d'instance
    "n'importe quoi",
  ]);
  assert.deepEqual(lues.map((d) => d.kind), ["distance_lieu", "temps_lieu", "taille", "quitter_ville", "perimetre_zones"]);
  assert.deepEqual(lues[3]!.criterion, { kind: "hard", key: "excludePlace", instance: "lyon" });
  assert.deepEqual(lues[0]!.criterion, { kind: "hard", key: "nearPlace", instance: null });
});

test("adoptions : durables, avec poids et origine ; l'illisible tombe", () => {
  const lues = normalizeAdoptions([ADOPTION, { ...ADOPTION, weight: 4 }, { ...ADOPTION, origin: { kind: "texte", label: "x" } }, { ...ADOPTION, source: "parser" }]);
  assert.equal(lues.length, 1);
  assert.deepEqual(lues[0], { ...ADOPTION, criterion: { kind: "preference", key: "vie_locale", instance: null } });
});

test("v3 : un projet legacy est lu en v3 sans aucune définition, adoption ni condition", () => {
  const p = normalizeUserProject({ posture: "recherche", rawText: "x", parsed: null, schemaVersion: 1 })!;
  assert.equal(p.schemaVersion, 3);
  assert.equal("definitions" in p || "adoptions" in p || "conditions" in p, false);
});

test("le navigateur ne peut écrire ni définition ni adoption ; le serveur reporte celles qui existent", () => {
  const input = normalizeUserProjectInput({ posture: "recherche", rawText: "corrigé", parsed: null, definitions: [DEF], adoptions: [ADOPTION] })!;
  assert.equal("definitions" in input || "adoptions" in input, false);
  const vierge = stampUserProject(input, LE_1ER);
  assert.equal("definitions" in vierge || "adoptions" in vierge, false);
  const reporte = stampUserProject(input, LE_1ER, { definitions: [DEF], adoptions: [ADOPTION], conditions: "bidon" });
  assert.equal(reporte.definitions?.length, 1);
  assert.equal(reporte.adoptions?.length, 1);
  assert.equal(reporte.conditions, undefined);
  assert.equal(reporte.rawText, "corrigé");
});

test("identité : le même élément, pas seulement la même famille", () => {
  assert.equal(sameCriterion({ kind: "hard", key: "excludePlace", instance: "lyon" }, { kind: "hard", key: "excludePlace", instance: "lyon" }), true);
  assert.equal(sameCriterion({ kind: "hard", key: "excludePlace", instance: "lyon" }, { kind: "hard", key: "excludePlace", instance: "bordeaux" }), false);
  assert.equal(sameCriterion({ kind: "hard", key: "zones" }, { kind: "hard", key: "zones", instance: null }), true);
});

test("registre : les macro-zones sont des périmètres tranchables une fois acceptés ; les historiques jamais", () => {
  for (const token of ["sud", "sud_ouest", "sud_est", "nord", "est", "grand_ouest", "centre"]) {
    const c = conventionDeZone(token)!;
    assert.equal(c.status, "perimetre", token);
    assert.equal(conventionTranchable(c, "commune"), true);
    assert.ok(c.definition.kind === "departements" && c.definition.departements.join() === ZONE_TABLE[token]!.departements.join());
  }
  for (const c of CONVENTIONS.filter((x) => x.status === "historique")) {
    assert.equal(conventionTranchable(c, "commune") || conventionTranchable(c, "adresse"), false, c.id);
  }
  // Ni façade ni massif n'est proposé comme périmètre.
  for (const token of ["atlantique", "manche", "mediterranee", "cote_basque", "alpes", "pyrenees", "massif_central"]) {
    assert.equal(conventionDeZone(token), null, token);
  }
  assert.equal(conventionPar("zone:sud-ouest", 1)?.version, 1);
  assert.equal(conventionPar("zone:sud-ouest", 2), null);
});
