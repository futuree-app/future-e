import test from "node:test";
import assert from "node:assert/strict";
import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

function dpe(over: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "X", date_dpe: "2024-05-01", id_ban: null, adresse: null,
    etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 60, annee_construction: 1990, type_batiment: "appartement", etage: null, complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null, isolation_murs: null,
    isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  };
}

test("null -> C_NO_DATA", () => {
  assert.equal(deriveThermalEvidence(null).level, "C_NO_DATA");
});

test("type non résidentiel -> C_NO_DATA", () => {
  assert.equal(deriveThermalEvidence(dpe({ type_batiment: "tertiaire" })).level, "C_NO_DATA");
});

test("individuel + bloc confort présent -> A avec indicateur", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "bon", traversant: true, protection_solaire: true, inertie: "lourde" }));
  assert.equal(ev.level, "A_EXACT_UNIT");
  assert.equal(ev.indicator, "bon");
});

test("A expose les facteurs positifs ET négatifs", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "moyen", traversant: false, protection_solaire: true, inertie: "légère" }));
  const labels = ev.factors.map((f) => f.label);
  assert.ok(labels.some((l) => l.includes("non traversant")));
  const trav = ev.factors.find((f) => f.key === "traversant");
  assert.equal(trav?.polarity, "defavorable");
});

test("A cappe les chips à 4, déborde dans drawerFields", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "bon", traversant: true, protection_solaire: true, inertie: "lourde", ventilation: "VMC SF Hygro B après 2012", brasseur_air: true }));
  assert.ok(ev.factors.length <= 4);
  assert.ok(ev.drawerFields.length >= 1);
});

test("méthode immeuble-généré -> B1 wording immeuble, MÊME avec bloc présent", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", confort_ete: "bon" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.methodWording, "immeuble");
  assert.equal(ev.indicator, null);
});

test("individuel SANS bloc confort -> B1 wording individuel_sans_bloc", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement individuel", confort_ete: null, inertie: "moyenne", ventilation: "VMC simple flux" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.methodWording, "individuel_sans_bloc");
});

test("B1 expose les facteurs d'enveloppe (inertie, ventilation, isolation)", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", inertie: "lourde", ventilation: "VMC SF Hygro B après 2012", isolation_murs: "bonne", isolation_menuiseries: "moyenne" }));
  assert.ok(ev.factors.some((f) => f.key === "inertie"));
  assert.ok(ev.factors.some((f) => f.key === "ventilation"));
});

test("summary attribue au DPE et ne prédit rien (A)", () => {
  const s = thermalEvidenceSummary(deriveThermalEvidence(dpe({ confort_ete: "insuffisant", traversant: false })));
  assert.ok(/DPE/.test(s));
  assert.ok(/insuffisant/.test(s));
});

test("summary C = absence honnête", () => {
  const s = thermalEvidenceSummary(deriveThermalEvidence(null));
  assert.ok(/ne permettent pas|non/i.test(s));
});
