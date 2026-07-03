import test from "node:test";
import assert from "node:assert/strict";
import { buildRegulatoryPlans, regimeRank, type RawPprnItem } from "./pprn-zonage.ts";

// Cas Toulouse réel : 2 plans distincts (inondation + sécheresse-argiles), même point.
const TOULOUSE: RawPprnItem[] = [
  {
    idGaspar: "31A",
    libPpr: "PPR - Toulouse",
    modeleProcedure: "PPRN-I",
    dateModification: "09/04/2025",
    zonageReglementaire: { zoneRegExists: true, listTypeReg: [{ code: "02", libelle: "Prescriptions", nom: "Zone endiguee Cyan", codeZone: "Cid" }] },
  },
  {
    idGaspar: "31B",
    libPpr: "PPR Sécheresse - Toulouse",
    modeleProcedure: "PPRN-RGA",
    dateModification: "19/12/2024",
    zonageReglementaire: { zoneRegExists: true, listTypeReg: [{ code: "02", libelle: "Prescriptions", nom: "Zone B2", codeZone: "B2" }] },
  },
];

test("multi-plans : les deux plans sont conservés avec leur aléa", () => {
  const plans = buildRegulatoryPlans(TOULOUSE);
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((p) => p.hazardModel).sort(), ["PPRN-I", "PPRN-RGA"]);
  assert.equal(plans[0].zones[0].zoneCode, "Cid");
  assert.equal(plans[0].updatedAt, "09/04/2025"); // dateModification remonté tel quel
});

test("ordre de lecture : interdiction stricte avant prescriptions", () => {
  const plans = buildRegulatoryPlans([
    { libPpr: "A", zonageReglementaire: { zoneRegExists: true, listTypeReg: [{ code: "02", libelle: "Prescriptions", codeZone: "B" }] } },
    { libPpr: "B", zonageReglementaire: { zoneRegExists: true, listTypeReg: [{ code: "04", libelle: "Interdiction stricte", codeZone: "RH" }] } },
  ]);
  assert.equal(plans[0].plan, "B"); // 04 (rang 0) passe devant 02 (rang 2)
  assert.equal(plans[1].plan, "A");
});

test("état C : plan avec zoneRegExists mais listTypeReg vide est conservé, sans zone", () => {
  const plans = buildRegulatoryPlans([
    { libPpr: "Ruissellement", zonageReglementaire: { zoneRegExists: true, listTypeReg: [] } },
  ]);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].zones.length, 0);
  assert.equal(plans[0].topRegimeRank, 99); // rejeté en fin de tri
});

test("point hors zone : plan présent mais zoneRegExists faux + aucune zone -> écarté", () => {
  const plans = buildRegulatoryPlans([
    { libPpr: "Loin", zonageReglementaire: { zoneRegExists: false, listTypeReg: [] } },
  ]);
  assert.equal(plans.length, 0); // « commune concernée » ≠ « point en zone »
});

test("aucune donnée -> tableau vide", () => {
  assert.deepEqual(buildRegulatoryPlans(null), []);
  assert.deepEqual(buildRegulatoryPlans([]), []);
});

test("regimeRank : codes connus ordonnés, inconnu en dernier", () => {
  assert.ok(regimeRank("04") < regimeRank("03"));
  assert.ok(regimeRank("03") < regimeRank("02"));
  assert.equal(regimeRank("zz"), 99);
  assert.equal(regimeRank(null), 99);
});
