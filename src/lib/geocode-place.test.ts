import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePoiFeatures, parseBanFeatures } from "./geocode-place.ts";
import { screenCandidates } from "./place-screening.ts";

// Les réponses RÉELLES des deux services, capturées le 2026-07-14. Le parsing se teste contre ce que les
// API rendent vraiment, jamais contre l'idée qu'on s'en fait.
const poi = JSON.parse(
  readFileSync(new URL("./__fixtures__/geocode-poi-matabiau.json", import.meta.url), "utf8"),
);
const ban = JSON.parse(
  readFileSync(new URL("./__fixtures__/geocode-ban-matabiau.json", import.meta.url), "utf8"),
);

test("la Géoplateforme rend la GARE, avec son type, sa commune, ses catégories et son identifiant", () => {
  const [c] = parsePoiFeatures(poi);
  assert.ok(c);
  assert.equal(c.label, "Gare Matabiau");
  assert.equal(c.kind, "station");
  assert.equal(c.citycode, "31555");
  assert.equal(c.dept, "31");
  assert.equal(c.source, "geoplateforme_poi");
  assert.ok(c.categories.length > 0);
  assert.ok(c.sourceId); // le cleabs, stable
  assert.ok(Math.abs(c.lat - 43.611) < 0.01 && Math.abs(c.lon - 1.453) < 0.01);
});

test("la BAN, elle, rend une RUE : le parsing le dit, il ne le maquille pas", () => {
  const [c] = parseBanFeatures(ban);
  assert.ok(c);
  assert.equal(c.kind, "street");
  assert.match(c.label, /Rue Matabiau/);
  assert.equal(c.source, "ban");
  assert.equal(c.dept, "31");
});

test("le département passe par departementFromInsee : les DOM ne sont pas « 97 »", () => {
  const dom = {
    features: [
      {
        geometry: { coordinates: [55.45, -20.87] },
        properties: { label: "Rue de Paris 97400 Saint-Denis", score: 0.9, type: "street", citycode: "97411" },
      },
    ],
  };
  assert.equal(parseBanFeatures(dom)[0]?.dept, "974");
});

test("un payload vide ou malformé ne jette pas, il rend une liste vide", () => {
  assert.deepEqual(parsePoiFeatures(null), []);
  assert.deepEqual(parsePoiFeatures({ features: [{ properties: {} }] }), []);
  assert.deepEqual(parseBanFeatures({}), []);
  assert.deepEqual(parseBanFeatures({ features: "pas un tableau" }), []);
});

// LE BOUT EN BOUT, sur les réponses RÉELLES : c'est le test qui compte. Les deux services répondent, leurs
// candidats sont fusionnés, et les contrôles doivent rendre la GARE, jamais la RUE.
test("réponses réelles + contrôles : « la gare Matabiau » résout la GARE, pas la rue", () => {
  const candidates = [...parsePoiFeatures(poi), ...parseBanFeatures(ban)];
  assert.ok(candidates.length >= 2); // la gare (POI) et la rue (BAN) sont bien toutes les deux là
  const r = screenCandidates("la gare Matabiau", candidates, { departements: [], degraded: false }, {
    inputHash: "h", resolverVersion: "resolve-2",
  });
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.canonicalLabel, "Gare Matabiau");
  assert.equal(r.kind, "station");
  assert.equal(r.source, "geoplateforme_poi");
});
