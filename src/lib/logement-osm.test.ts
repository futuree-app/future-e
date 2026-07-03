import test from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, computeOsmProximity } from "./logement-osm.ts";

test("parse way géométrique en polyligne rôle bruit", () => {
  const els = [{ type: "way", tags: { highway: "motorway" }, geometry: [{ lat: 48.85, lon: 2.30 }, { lat: 48.85, lon: 2.40 }] }];
  const g = parseOverpass(els);
  assert.equal(g[0].role, "noisy");
  assert.equal(g[0].kind, "line");
  assert.equal(g[0].subtype, "motorway");
});

test("proximité: distance au SEGMENT de la voie ferrée (pas au sommet)", () => {
  const geoms = parseOverpass([{ type: "way", tags: { railway: "rail" }, geometry: [{ lat: 48.850, lon: 2.30 }, { lat: 48.850, lon: 2.40 }] }]);
  const prox = computeOsmProximity({ lat: 48.8495, lon: 2.35 }, geoms, 1500);
  const rail = prox.potentiallyNoisyInfrastructure.find((x) => x.type === "railway")!;
  assert.ok(rail.distanceMeters < 70, `attendu ~55 m, obtenu ${rail.distanceMeters}`);
});

test("verts absents dans l'emprise -> null", () => {
  const prox = computeOsmProximity({ lat: 48.85, lon: 2.35 }, [], 1500);
  assert.equal(prox.nearestMappedGreenSpace, null);
  assert.equal(prox.potentiallyNoisyInfrastructure.length, 0);
});

test("parc polygonal -> espace vert le plus proche", () => {
  const els = [{ type: "way", tags: { leisure: "park" }, geometry: [
    { lat: 48.851, lon: 2.351 }, { lat: 48.852, lon: 2.351 }, { lat: 48.852, lon: 2.352 }, { lat: 48.851, lon: 2.352 }, { lat: 48.851, lon: 2.351 },
  ] }];
  const prox = computeOsmProximity({ lat: 48.850, lon: 2.3515 }, parseOverpass(els), 1500);
  assert.ok(prox.nearestMappedGreenSpace && prox.nearestMappedGreenSpace.distanceMeters < 200);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
});

test("greenKind conservé selon le tag OSM (bois, forêt, pelouse, terrain)", () => {
  const geom = (tags: Record<string, string>) =>
    ({ type: "way", tags, geometry: [{ lat: 48.85, lon: 2.35 }, { lat: 48.85, lon: 2.36 }] });
  assert.equal(parseOverpass([geom({ natural: "wood" })])[0].greenKind, "wood");
  assert.equal(parseOverpass([geom({ landuse: "forest" })])[0].greenKind, "forest");
  assert.equal(parseOverpass([geom({ landuse: "grass" })])[0].greenKind, "grass");
  assert.equal(parseOverpass([geom({ landuse: "recreation_ground" })])[0].greenKind, "recreation_ground");
});
