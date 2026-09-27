// FUT-5. LE PÉRIMÈTRE GÉOGRAPHIQUE, de bout en bout : des contraintes BRUTES (ce que le parse écrit
// dans le projet) jusqu'au constat, par la même chaîne que les deux moteurs (hydratation, puis noyau).
//
// Deux défauts se combinaient. Deux ancres dures sans département commun donnaient un périmètre vide,
// et un périmètre vide laissait passer n'importe quelle commune comme conforme. Et le schéma ne savait
// dire que ET : « la Bretagne ou la Loire-Atlantique » devenait une intersection impossible.
import test from "node:test";
import assert from "node:assert/strict";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import {
  evaluateZones, evaluateDepartements, type CommuneAttributes, type EvaluationContext,
} from "./hard-constraints.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";

const dir: PlaceDirectory = { byName: () => null, plmByName: () => null };

function commune(over: Partial<CommuneAttributes>): CommuneAttributes {
  return {
    insee: "00000", nom: "Commune", dept: null, lat: null, lon: null,
    population: null, tailleVille: null, uu: null, altitude: null, reliefProximite: null, distanceCoteKm: null,
    ...over,
  };
}

// Le périmètre, tel que le filtre du comparateur le voit : une commune n'est proposable que si
// AUCUNE des deux familles géographiques ne la contredit.
function statut(hc: HardConstraints, dept: string): "dedans" | "dehors" | "non_examine" {
  const constraints = hydrateHardConstraints(hc, dir);
  const ctx: EvaluationContext = { constraints, point: null, conventionsVersion: "test" };
  const c = commune({ dept, nom: `Commune ${dept}` });
  const verdicts = [evaluateZones(ctx, c), evaluateDepartements(ctx, c)].map((a) => a.status);
  if (verdicts.includes("incompatible")) return "dehors";
  if (verdicts.includes("unexamined")) return "non_examine";
  return "dedans";
}

const BRETAGNE: HardConstraints = { zones: [{ zone: "bretagne", strength: "hard" }] };

test("« en Bretagne » -> la Bretagne, et elle seule", () => {
  for (const d of ["22", "29", "35", "56"]) assert.equal(statut(BRETAGNE, d), "dedans", d);
  for (const d of ["44", "49", "75", "31"]) assert.equal(statut(BRETAGNE, d), "dehors", d);
});

test("« en Loire-Atlantique » -> le 44, et lui seul", () => {
  const hc: HardConstraints = { departements: ["44"] };
  assert.equal(statut(hc, "44"), "dedans");
  for (const d of ["35", "49", "85"]) assert.equal(statut(hc, d), "dehors", d);
});

test("« en Bretagne ou en Loire-Atlantique » -> Bretagne ∪ 44, rien au-delà", () => {
  const hc: HardConstraints = { ...BRETAGNE, departements: ["44"], zonesMatch: "any" };
  for (const d of ["22", "29", "35", "56", "44"]) assert.equal(statut(hc, d), "dedans", d);
  for (const d of ["49", "85", "53", "75"]) assert.equal(statut(hc, d), "dehors", d);
});

test("« en Bretagne ou en Normandie » -> l'union des deux régions", () => {
  const hc: HardConstraints = {
    zones: [{ zone: "bretagne", strength: "hard" }, { zone: "normandie", strength: "hard" }],
    zonesMatch: "any",
  };
  for (const d of ["29", "35", "14", "76"]) assert.equal(statut(hc, d), "dedans", d);
  for (const d of ["44", "75"]) assert.equal(statut(hc, d), "dehors", d);
});

test("« le Sud-Ouest, près des Pyrénées » reste une INTERSECTION", () => {
  const hc: HardConstraints = {
    zones: [{ zone: "sud_ouest", strength: "hard" }, { zone: "pyrenees", strength: "hard" }],
  };
  for (const d of ["64", "65", "31", "09"]) assert.equal(statut(hc, d), "dedans", d);
  // 33 est dans le Sud-Ouest sans être pyrénéen ; 66 est pyrénéen sans être dans le Sud-Ouest.
  for (const d of ["33", "40", "66"]) assert.equal(statut(hc, d), "dehors", d);
});

test("deux ancres en conjonction SANS intersection -> aucune commune conforme, nulle part", () => {
  const hc: HardConstraints = {
    zones: [{ zone: "bretagne", strength: "hard" }, { zone: "pays_de_la_loire", strength: "hard" }],
  };
  for (const d of ["35", "44", "75", "31", "2A"]) assert.equal(statut(hc, d), "dehors", d);
});

test("un projet enregistré AVANT FUT-5 (sans zonesMatch) garde l'intersection", () => {
  const hc: HardConstraints = {
    zones: [{ zone: "sud_ouest", strength: "hard" }, { zone: "pyrenees", strength: "hard" }],
  };
  assert.equal(hydrateHardConstraints(hc, dir).zones?.match, "all");
  assert.equal(statut(hc, "33"), "dehors");
});

test("« au moins une » : les départements rejoignent le périmètre des zones, et ne sont plus testés à part", () => {
  const n = hydrateHardConstraints({ ...BRETAGNE, departements: ["44"], zonesMatch: "any" }, dir);
  assert.equal(n.departements, null);
  assert.equal(n.zones?.match, "any");
  assert.deepEqual([...(n.zones?.hardDepartements ?? [])].sort(), ["22", "29", "35", "44", "56"]);
  assert.deepEqual(n.zones?.labels, ["la Bretagne", "le département 44"]);
});

test("« au moins une » sans aucune zone dure : les départements restent une liste, sans détour", () => {
  const n = hydrateHardConstraints({ departements: ["35", "44"], zonesMatch: "any" }, dir);
  assert.deepEqual(n.departements, ["35", "44"]);
  assert.equal(n.zones, null);
});

test("« au moins une » : une ancre SOUPLE ne s'ajoute jamais au périmètre", () => {
  const hc: HardConstraints = {
    zones: [{ zone: "bretagne", strength: "hard" }, { zone: "normandie", strength: "preferred" }],
    zonesMatch: "any",
  };
  assert.equal(statut(hc, "14"), "dehors");
});
