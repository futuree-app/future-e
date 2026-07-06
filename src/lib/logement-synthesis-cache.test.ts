import test from "node:test";
import assert from "node:assert/strict";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION } from "./logement-synthesis-cache.ts";

test("buildFactHash déterministe : mêmes entrées -> même hash", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  assert.equal(a, b);
});

test("buildFactHash change si le DPE change", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X2", sourcesVersion: "s1", promptVersion: "v1" });
  assert.notEqual(a, b);
});

test("buildFactHash change si la version de prompt change", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v1" });
  const b = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: "X1", sourcesVersion: "s1", promptVersion: "v2" });
  assert.notEqual(a, b);
});

test("buildFactHash : dpeId null -> 'none', stable", () => {
  const a = buildFactHash({ latitude: 45.75, longitude: 4.85, dpeId: null, sourcesVersion: "s1", promptVersion: "v1" });
  assert.match(a, /none/);
});

test("SYNTHESIS_PROMPT_VERSION exporté", () => {
  assert.equal(typeof SYNTHESIS_PROMPT_VERSION, "string");
});

function fullData(over = {}) {
  return {
    address: { label: "10 rue X, Lyon" },
    altitude: 170,
    dpeSelectionStatus: "user_confirmed",
    selectedDpe: {
      id_dpe: "X1", type_batiment: "appartement", methode_dpe: "dpe appartement individuel",
      confort_ete: "moyen", etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: 250, emission_ges_m2: 30,
      surface_m2: 60, annee_construction: 1970, date_dpe: "2024-01-01", traversant: true,
      protection_solaire: null, ventilation: "VMC simple flux", inertie: "moyenne", isolation_toiture: null,
      brasseur_air: null, isolation_murs: "bonne", isolation_menuiseries: "moyenne",
      id_ban: null, adresse: null, etage: null, complement: null,
    },
    georisques: { parcel: { risks: { labels: ["sismicité modérée"] }, pprn: { labels: [] }, seismic: { label: "modérée" }, rga: { label: "exposition forte" } } },
    sinistralite: { secheresse: { coutMoyen: "10 000 à 20 000 €" } },
    irep: { count: 3 },
    cartofriches: { count: 2, friches: [{ sol_pollue: true }] },
    autour: { bpe: [{ category: "sante", nearest: { typeLabel: "Pharmacie", distanceMeters: 220 } }], osm: { nearestMappedGreenSpace: { kind: "park", distanceMeters: 300 } } },
    communeData: { commune: { nom: "Lyon", population: 500000 } },
    posture: "prospection",
    ...over,
  };
}

test("buildSynthesisPayload inclut l'autour et exclut irep/friches/posture", () => {
  const p = buildSynthesisPayload(fullData());
  assert.ok(p.autour, "autour présent");
  assert.equal("irep" in p, false);
  assert.equal("friches" in p, false);
  assert.equal("posture" in p, false);
});

test("buildSynthesisPayload : confortEte sous verrou DPE confirmé", () => {
  const confirmed = buildSynthesisPayload(fullData());
  assert.ok(confirmed.confortEte, "confortEte présent si confirmé");
  const pending = buildSynthesisPayload(fullData({ dpeSelectionStatus: "selection_required" }));
  assert.equal(pending.confortEte, null);
});
