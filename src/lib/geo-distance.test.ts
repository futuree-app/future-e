import test from "node:test";
import assert from "node:assert/strict";
import {
  haversineM, distancePointToPolylineM, distancePointToPolygonM, distancePointToMultiPolygonM, isClosedRing,
  multiPolygonAreaM2, pointInMultiPolygon, ringAreaM2, type PolygoneAvecTrous,
} from "./geo-distance.ts";

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

// ── FUT-15 : fermeture par coordonnées, multipolygone à trous ───────────────────────────────────

test("fermeture : deux objets distincts aux mêmes coordonnées ferment l'anneau", () => {
  // Le parseur reconstruit chaque sommet : premier et dernier ne sont jamais le même objet.
  const ring = [{ lat: 48.849, lon: 2.349 }, { lat: 48.851, lon: 2.349 }, { lat: 48.851, lon: 2.351 }, { lat: 48.849, lon: 2.349 }];
  assert.notEqual(ring[0], ring[ring.length - 1]);
  assert.equal(isClosedRing(ring), true);
  assert.equal(isClosedRing(ring.slice(0, 3)), false);
  assert.equal(isClosedRing([{ lat: 1, lon: 2 }]), false);
});

test("fermeture : un anneau fermé et le même ouvert donnent la même distance au contour", () => {
  const ouvert = [{ lat: 48.849, lon: 2.349 }, { lat: 48.851, lon: 2.349 }, { lat: 48.851, lon: 2.351 }, { lat: 48.849, lon: 2.351 }];
  const ferme = [...ouvert, { lat: 48.849, lon: 2.349 }];
  const p = { lat: 48.850, lon: 2.360 };
  assert.equal(distancePointToPolygonM(p, ferme), distancePointToPolygonM(p, ouvert));
});

const carre = (s: number, w: number, n: number, e: number) => [
  { lat: s, lon: w }, { lat: n, lon: w }, { lat: n, lon: e }, { lat: s, lon: e }, { lat: s, lon: w },
];
const FORET: PolygoneAvecTrous[] = [{ outer: carre(45.0, 5.0, 45.02, 5.02), inners: [carre(45.008, 5.008, 45.012, 5.012)] }];

test("multipolygone : dans l'extérieur hors du trou -> 0 ; dans le trou -> distance au bord du trou", () => {
  assert.equal(pointInMultiPolygon({ lat: 45.004, lon: 5.004 }, FORET), true);
  assert.equal(distancePointToMultiPolygonM({ lat: 45.004, lon: 5.004 }, FORET), 0);
  assert.equal(pointInMultiPolygon({ lat: 45.01, lon: 5.01 }, FORET), false);
  const d = distancePointToMultiPolygonM({ lat: 45.01, lon: 5.01 }, FORET);
  assert.ok(Math.abs(d - 157) < 3, `attendu ~157 m (bord de la clairière), obtenu ${d}`);
});

test("multipolygone : dehors -> distance au contour extérieur le plus proche ; vide -> Infinity", () => {
  const d = distancePointToMultiPolygonM({ lat: 45.025, lon: 5.01 }, FORET);
  assert.ok(Math.abs(d - 556) < 5, `obtenu ${d}`);
  assert.equal(distancePointToMultiPolygonM({ lat: 45, lon: 5 }, []), Infinity);
});

test("multipolygone : la surface vaut extérieurs moins trous", () => {
  const attendu = ringAreaM2(FORET[0].outer) - ringAreaM2(FORET[0].inners[0]);
  assert.ok(Math.abs(multiPolygonAreaM2(FORET) - attendu) < 1e-6);
});
