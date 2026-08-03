import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOverpass,
  computeOsmProximity,
  tileFetchBBox,
  OSM_BBOX_RADIUS_M,
  OSM_CELL_DEG,
} from "./logement-osm.ts";
import { cellKey, cellBBox } from "./geo-grid.ts";

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

// L'EMPRISE DE COLLECTE COUVRE-T-ELLE VRAIMENT 1 500 m DANS LES QUATRE DIRECTIONS ?
//
// Ces tests décrivent le comportement OBSERVABLE, pas la formule : une voie ferrée réellement située
// à 1 200 m d'une adresse doit être collectée par l'emprise de sa cellule, PUIS conservée par le
// filtre de `computeOsmProximity`, et donc apparaître dans le rapport. Ils échouent tous deux avec
// l'ancienne marge (`OSM_BBOX_RADIUS_M / 111_000` appliquée aussi en longitude), qui ne couvrait que
// 951 m à l'est et à l'ouest à la latitude de Lille.
//
// L'adresse est placée au BORD de sa cellule, du côté testé : c'est le cas le plus défavorable, et
// c'est un cas réel puisque le découpage en cellules ne connaît pas les adresses.

const LILLE_LAT = 50.6292; // 951 m de marge est/ouest avec l'ancien calcul, pour 1 500 m demandés
const LON_DEG_PAR_M = 1 / (111_000 * Math.cos((LILLE_LAT * Math.PI) / 180));

/** Overpass rend un way dès qu'un de ses sommets tombe dans la fenêtre demandée. */
const wayCollecte = (pts: Array<{ lat: number; lon: number }>, b: { s: number; w: number; n: number; e: number }) =>
  pts.some((p) => p.lat >= b.s && p.lat <= b.n && p.lon >= b.w && p.lon <= b.e);

/** Une voie ferrée nord-sud, à `offsetM` mètres à l'est (positif) ou à l'ouest (négatif) du centre. */
const voieFerreeA = (centre: { lat: number; lon: number }, offsetM: number) => {
  const lon = centre.lon + offsetM * LON_DEG_PAR_M;
  return [
    { lat: centre.lat - 0.002, lon },
    { lat: centre.lat + 0.002, lon },
  ];
};

for (const [direction, signe] of [["est", 1], ["ouest", -1]] as const) {
  test(`emprise: une voie ferrée à 1 200 m à l'${direction} est collectée puis conservée (Lille)`, () => {
    // Adresse collée au bord de la cellule, du côté testé : rien de la cellule n'aide à couvrir.
    const bordDeCellule = cellBBox(cellKey(LILLE_LAT, 3.0573, OSM_CELL_DEG), OSM_CELL_DEG);
    const centre = { lat: LILLE_LAT, lon: signe > 0 ? bordDeCellule.e - 1e-6 : bordDeCellule.w + 1e-6 };

    const bbox = tileFetchBBox(cellKey(centre.lat, centre.lon, OSM_CELL_DEG));
    const pts = voieFerreeA(centre, signe * 1200);

    assert.ok(
      wayCollecte(pts, bbox),
      `la voie ferrée à 1 200 m à l'${direction} n'est pas dans l'emprise collectée : elle sera absente du rapport sans qu'aucune erreur ne le signale`,
    );

    const prox = computeOsmProximity(centre, parseOverpass([{ type: "way", tags: { railway: "rail" }, geometry: pts }]), OSM_BBOX_RADIUS_M);
    const rail = prox.potentiallyNoisyInfrastructure.find((x) => x.type === "railway");
    assert.ok(rail, `la voie ferrée à 1 200 m à l'${direction} a été écartée par le filtre de distance`);
    assert.ok(
      Math.abs(rail.distanceMeters - 1200) < 20,
      `distance attendue ~1 200 m, obtenue ${rail.distanceMeters} m`,
    );
  });
}

// Contrôle : le nord et le sud n'ont jamais été amputés, ils doivent le rester.
for (const [direction, signe] of [["nord", 1], ["sud", -1]] as const) {
  test(`emprise: contrôle ${direction}, une voie ferrée à 1 200 m reste collectée`, () => {
    const bordDeCellule = cellBBox(cellKey(LILLE_LAT, 3.0573, OSM_CELL_DEG), OSM_CELL_DEG);
    const centre = { lat: signe > 0 ? bordDeCellule.n - 1e-6 : bordDeCellule.s + 1e-6, lon: 3.0573 };
    const lat = centre.lat + (signe * 1200) / 111_000;
    const pts = [
      { lat, lon: centre.lon - 0.002 },
      { lat, lon: centre.lon + 0.002 },
    ];

    assert.ok(wayCollecte(pts, tileFetchBBox(cellKey(centre.lat, centre.lon, OSM_CELL_DEG))), "hors emprise au nord/sud");

    const prox = computeOsmProximity(centre, parseOverpass([{ type: "way", tags: { railway: "rail" }, geometry: pts }]), OSM_BBOX_RADIUS_M);
    assert.ok(prox.potentiallyNoisyInfrastructure.some((x) => x.type === "railway"), "voie ferrée écartée au nord/sud");
  });
}

test("emprise: la marge est/ouest couvre bien le rayon demandé, en mètres (Lille)", () => {
  const key = cellKey(LILLE_LAT, 3.0573, OSM_CELL_DEG);
  const cell = cellBBox(key, OSM_CELL_DEG);
  const b = tileFetchBBox(key);
  const margeEstM = (b.e - cell.e) * 111_000 * Math.cos((LILLE_LAT * Math.PI) / 180);
  assert.ok(
    margeEstM >= OSM_BBOX_RADIUS_M,
    `marge est/ouest de ${Math.round(margeEstM)} m pour ${OSM_BBOX_RADIUS_M} m demandés`,
  );
});

test("greenKind conservé selon le tag OSM (bois, forêt, pelouse, terrain)", () => {
  const geom = (tags: Record<string, string>) =>
    ({ type: "way", tags, geometry: [{ lat: 48.85, lon: 2.35 }, { lat: 48.85, lon: 2.36 }] });
  assert.equal(parseOverpass([geom({ natural: "wood" })])[0].greenKind, "wood");
  assert.equal(parseOverpass([geom({ landuse: "forest" })])[0].greenKind, "forest");
  assert.equal(parseOverpass([geom({ landuse: "grass" })])[0].greenKind, "grass");
  assert.equal(parseOverpass([geom({ landuse: "recreation_ground" })])[0].greenKind, "recreation_ground");
});
