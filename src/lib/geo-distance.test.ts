import test from "node:test";
import assert from "node:assert/strict";
import { haversineM, distancePointToPolylineM, distancePointToPolygonM } from "./geo-distance.ts";

test("haversine ~ known distance", () => {
  // ~111 m pour 0.001° de latitude
  const d = haversineM({ lat: 48.85, lon: 2.35 }, { lat: 48.851, lon: 2.35 });
  assert.ok(Math.abs(d - 111) < 3, `attendu ~111 m, obtenu ${d}`);
});

test("polyline: distance au SEGMENT, pas au sommet", () => {
  // Ligne E-O passant à lat 48.850 ; sommets loin (lon 2.30 et 2.40),
  // point juste au sud du milieu (lon 2.35) : ~55 m du segment, ~400 m des sommets.
  const line = [{ lat: 48.850, lon: 2.30 }, { lat: 48.850, lon: 2.40 }];
  const p = { lat: 48.8495, lon: 2.35 }; // ~55 m au sud
  const d = distancePointToPolylineM(p, line);
  assert.ok(d < 70, `attendu ~55 m (segment), obtenu ${d}`);
});

test("polygone: 0 à l'intérieur, contour à l'extérieur", () => {
  const ring = [
    { lat: 48.849, lon: 2.349 },
    { lat: 48.851, lon: 2.349 },
    { lat: 48.851, lon: 2.351 },
    { lat: 48.849, lon: 2.351 },
  ];
  assert.equal(distancePointToPolygonM({ lat: 48.850, lon: 2.350 }, ring), 0);
  assert.ok(distancePointToPolygonM({ lat: 48.850, lon: 2.360 }, ring) > 500);
});
