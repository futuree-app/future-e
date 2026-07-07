import test from "node:test";
import assert from "node:assert/strict";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION } from "./logement-synthesis-cache.ts";

test("buildFactHash déterministe : mêmes faits -> même hash", () => {
  assert.equal(buildFactHash(fullData()), buildFactHash(fullData()));
});

test("buildFactHash porte la version du prompt en clair", () => {
  assert.equal(buildFactHash(fullData()).startsWith(`syn:${SYNTHESIS_PROMPT_VERSION}:`), true);
});

test("buildFactHash change si le DPE change", () => {
  const a = buildFactHash(fullData());
  const b = buildFactHash(fullData({ selectedDpe: { ...fullData().selectedDpe, etiquette_dpe: "F", conso_ep_m2: 400 } }));
  assert.notEqual(a, b);
});

test("buildFactHash change quand l'« autour » arrive (course figée -> détectée)", () => {
  // Board critique 2a : une synthèse générée sans la section « autour » ne doit plus rester figée.
  const sansAutour = buildFactHash(fullData({ autour: null }));
  const avecAutour = buildFactHash(fullData());
  assert.notEqual(sansAutour, avecAutour);
});

test("buildFactHash NE change PAS avec la posture (jamais un fait)", () => {
  assert.equal(buildFactHash(fullData({ posture: "residence" })), buildFactHash(fullData({ posture: "prospection" })));
});

test("buildFactHash NE change PAS avec irep/friches (frontière Santé)", () => {
  assert.equal(buildFactHash(fullData({ irep: { count: 9 } })), buildFactHash(fullData({ irep: { count: 0 } })));
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
