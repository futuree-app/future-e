import { test } from "node:test";
import assert from "node:assert/strict";
import { pointInPolygon, type PolygonGeometry } from "./geo-polygon.ts";

// Un carré d'environ 1° de côté autour de Toulouse (1,0..2,0 E ; 43,0..44,0 N), en [lon, lat].
const CARRE: PolygonGeometry = {
  type: "Polygon",
  coordinates: [[[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]]],
};

// Le même carré, percé d'un trou au centre (1,4..1,6 ; 43,4..43,6).
const CARRE_TROUE: PolygonGeometry = {
  type: "Polygon",
  coordinates: [
    [[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]],
    [[1.4, 43.4], [1.6, 43.4], [1.6, 43.6], [1.4, 43.6], [1.4, 43.4]],
  ],
};

test("un point clairement à l'intérieur est inside", () => {
  assert.equal(pointInPolygon(43.6, 1.45, CARRE, 300), "inside");
});

test("un point clairement à l'extérieur est outside", () => {
  assert.equal(pointInPolygon(45.75, 4.85, CARRE, 300), "outside"); // Lyon
});

test("LES COORDONNÉES NE S'INVERSENT PAS : (lat, lon) n'est pas lu (lon, lat)", () => {
  // À l'envers, ce point tomberait dans le carré. Il doit en sortir.
  assert.equal(pointInPolygon(1.45, 43.6, CARRE, 300), "outside");
});

test("un point sur la frontière est border, jamais incompatible", () => {
  assert.equal(pointInPolygon(43.5, 1.0, CARRE, 300), "border");
});

test("dans la bande de tolérance, DEDANS comme DEHORS, c'est border", () => {
  // 0,001° de longitude ≈ 80 m à cette latitude.
  assert.equal(pointInPolygon(43.5, 1.001, CARRE, 300), "border");
  assert.equal(pointInPolygon(43.5, 0.999, CARRE, 300), "border");
});

test("une tolérance nulle laisse le point intérieur proche du bord en inside", () => {
  assert.equal(pointInPolygon(43.5, 1.001, CARRE, 0), "inside");
});

test("un point dans un trou est outside ; sur le bord du trou, border", () => {
  assert.equal(pointInPolygon(43.5, 1.5, CARRE_TROUE, 300), "outside");
  assert.equal(pointInPolygon(43.4, 1.5, CARRE_TROUE, 300), "border");
});

test("un MultiPolygon : dedans dans la seconde pièce", () => {
  const multi: PolygonGeometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[1, 43], [1.1, 43], [1.1, 43.1], [1, 43.1], [1, 43]]],
      [[[5, 45], [6, 45], [6, 46], [5, 46], [5, 45]]],
    ],
  };
  assert.equal(pointInPolygon(45.5, 5.5, multi, 300), "inside");
  assert.equal(pointInPolygon(44.0, 3.0, multi, 300), "outside");
});

test("une géométrie absente est unusable, JAMAIS outside", () => {
  assert.equal(pointInPolygon(43.6, 1.45, null, 300), "unusable");
  assert.equal(pointInPolygon(43.6, 1.45, undefined, 300), "unusable");
});

test("une géométrie vide, d'un type inconnu, ou à l'anneau trop court est unusable", () => {
  assert.equal(pointInPolygon(43.6, 1.45, { type: "Polygon", coordinates: [] }, 300), "unusable");
  assert.equal(
    pointInPolygon(43.6, 1.45, { type: "Polygon", coordinates: [[[1, 43], [2, 43]]] }, 300),
    "unusable", // un anneau de 2 points n'est pas un polygone
  );
  assert.equal(pointInPolygon(43.6, 1.45, { type: "Point", coordinates: [1, 43] } as never, 300), "unusable");
});

test("UN TROU INVALIDE REND TOUTE LA GÉOMÉTRIE INUTILISABLE (on n'ignore pas ce qu'on n'a pas su lire)", () => {
  const troueCasse: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]],
      [[1.4, 43.4], [1.6, 43.4]], // 2 points : ce n'est pas un anneau
    ],
  };
  assert.equal(pointInPolygon(43.6, 1.45, troueCasse, 300), "unusable");
});

test("des coordonnées hors bornes terrestres sont illisibles, pas « dehors »", () => {
  const fou: PolygonGeometry = {
    type: "Polygon",
    coordinates: [[[1, 43], [2, 43], [999, 44], [1, 44], [1, 43]]],
  };
  assert.equal(pointInPolygon(43.6, 1.45, fou, 300), "unusable");
  const nan: PolygonGeometry = {
    type: "Polygon",
    coordinates: [[[1, 43], [2, 43], [Number.NaN, 44], [1, 44], [1, 43]]],
  };
  assert.equal(pointInPolygon(43.6, 1.45, nan, 300), "unusable");
});
