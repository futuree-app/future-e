import test from "node:test";
import assert from "node:assert/strict";
import { buildPointHazards, type CaviteRaw, type MvtRaw } from "./point-hazards.ts";

const POINT = { lat: 46.159, lon: -1.152 };
// ~ +0.001° de latitude ≈ 111 m ; +0.005° ≈ 556 m (hors rayon 500).
const near = (dLat: number): { latitude: number; longitude: number } => ({ latitude: 46.159 + dLat, longitude: -1.152 });

test("cavités : compte dans le rayon, distance au plus proche, types distincts", () => {
  const cavites: CaviteRaw[] = [
    { type: "ouvrage militaire", ...near(0.001) }, // ~111 m
    { type: "ouvrage civil", ...near(0.002) }, // ~222 m
    { type: "ouvrage civil", ...near(0.003) }, // ~333 m (type doublon)
    { type: "naturelle", ...near(0.005) }, // ~556 m : hors rayon
  ];
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites, mvt: null, communeFlaggedMvt: false, communalResidual: [] });
  assert.equal(out.cavites?.count, 3);
  assert.ok(out.cavites && out.cavites.nearestM !== null && out.cavites.nearestM < 130 && out.cavites.nearestM > 90);
  assert.deepEqual(out.cavites?.types, ["ouvrage militaire", "ouvrage civil"]);
});

test("cavités : liste vide dans le rayon → null ; source en panne (null) → null", () => {
  assert.equal(buildPointHazards({ point: POINT, radiusM: 500, cavites: [{ type: "x", ...near(0.02) }], mvt: null, communeFlaggedMvt: false, communalResidual: [] }).cavites, null);
  assert.equal(buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt: null, communeFlaggedMvt: false, communalResidual: [] }).cavites, null);
});

test("MVT : événements dans le rayon → kind events", () => {
  const mvt: MvtRaw[] = [{ type: "Glissement", ...near(0.001) }, { type: "Chute de blocs", ...near(0.002) }];
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt, communeFlaggedMvt: true, communalResidual: [] });
  assert.equal(out.mvt?.kind, "events");
  assert.equal(out.mvt && out.mvt.kind === "events" ? out.mvt.count : -1, 2);
});

test("MVT : 0 événement mais commune signalée → flagged_none", () => {
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt: [], communeFlaggedMvt: true, communalResidual: [] });
  assert.equal(out.mvt?.kind, "flagged_none");
});

test("MVT : 0 événement et commune non signalée → null", () => {
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt: [], communeFlaggedMvt: false, communalResidual: [] });
  assert.equal(out.mvt, null);
});

test("MVT : source en panne (null) → null même si commune signalée", () => {
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt: null, communeFlaggedMvt: true, communalResidual: [] });
  assert.equal(out.mvt, null);
});

test("résidu communal transmis tel quel", () => {
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites: null, mvt: null, communeFlaggedMvt: false, communalResidual: ["Rupture de barrage", "Tempête et grains (vent)"] });
  assert.deepEqual(out.communalResidual, ["Rupture de barrage", "Tempête et grains (vent)"]);
});

test("coordonnées manquantes ignorées, jamais devinées", () => {
  const cavites: CaviteRaw[] = [{ type: "x", latitude: null, longitude: -1.152 }, { type: "y", ...near(0.001) }];
  const out = buildPointHazards({ point: POINT, radiusM: 500, cavites, mvt: null, communeFlaggedMvt: false, communalResidual: [] });
  assert.equal(out.cavites?.count, 1);
});

import { communalResidualFromLabels, isMvtFlagged } from "./point-hazards.ts";

// Libellés GASPAR réels au point (La Rochelle).
const LR = ["Inondation", "Par submersion marine", "Mouvement de terrain", "Tassements différentiels",
  "Séisme", "Phénomène lié à l'atmosphère", "Tempête et grains (vent)", "Transport de marchandises dangereuses"];

test("isMvtFlagged : vrai si la famille mouvement de terrain est signalée", () => {
  assert.equal(isMvtFlagged(LR), true);
  assert.equal(isMvtFlagged(["Inondation", "Séisme"]), false);
  assert.equal(isMvtFlagged(["Glissement de terrain"]), true);
  assert.equal(isMvtFlagged(["Eboulement ou chutes de pierres et de blocs"]), true);
});

test("communalResidualFromLabels : exclut Santé, sous-détails, séisme/argile, MVT et cavités", () => {
  const out = communalResidualFromLabels(LR);
  // reste : inondation, submersion marine (relabellée), atmosphère, tempête. Pas de MVT, pas de séisme.
  assert.ok(out.includes("Inondation"));
  assert.ok(out.includes("Submersion marine"));
  assert.ok(out.some((l) => /tempête/i.test(l)));
  assert.ok(!out.some((l) => /mouvement de terrain|séisme|tassement|transport/i.test(l)));
});

test("communalResidualFromLabels : cavités et affaissement exclus (portés au point)", () => {
  const out = communalResidualFromLabels(["Affaissements et effondrements d'origine anthropique", "Rupture de barrage"]);
  assert.deepEqual(out, ["Rupture de barrage"]);
});
