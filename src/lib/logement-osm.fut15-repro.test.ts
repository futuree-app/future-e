// FUT-15 — LES REPRODUCTIONS DE L'AUDIT DU 06/10/2026 (main 7ea64dca), GARDÉES TELLES QUELLES.
//
// Les quatre tests « REPRODUCTION » échouaient sur main avant le correctif : ils prouvaient que les
// relations multipolygones vertes n'existaient pas pour le produit. Ils passent depuis, et restent
// comme garde-fou. Les « CONTRÔLE » bornent le défaut (le way fermé était déjà juste).
//
// Les fixtures reproduisent la forme exacte d'une réponse Overpass `out geom` pour une relation
// multipolygone (membres porteurs de leur géométrie, ordre non garanti). Coordonnées synthétiques :
// « type Fontainebleau » et « type grand parc urbain » décrivent une forme, pas l'emprise réelle.
// Aucun appel réseau : `fetch` est simulé. Couverture complète : logement-osm-relations.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, computeOsmProximity, fetchOverpass, OSM_BBOX_RADIUS_M } from "./logement-osm.ts";

type P = { lat: number; lon: number };
const carre = (s: number, w: number, n: number, e: number): P[] => [
  { lat: s, lon: w }, { lat: n, lon: w }, { lat: n, lon: e }, { lat: s, lon: e }, { lat: s, lon: w },
];
const wayFerme = (id: number, tags: Record<string, string>, pts: P[]) => ({ type: "way", id, tags, geometry: pts });

// ── Cas 1 : massif forestier en relation (type Fontainebleau) ────────────────────────────────────
// Contour extérieur ~5,9 × 5,6 km, découpé en DEUX ways membres, le second listé à l'envers.
// Un petit bois (way fermé, ~1,2 ha) à ~310 m au nord de l'adresse, qui est DANS la forêt.
const ADRESSE_FORET: P = { lat: 48.405, lon: 2.68 };
const FORET_RELATION = {
  type: "relation", id: 9000001,
  tags: { type: "multipolygon", landuse: "forest", name: "Forêt domaniale (synthétique)" },
  members: [
    { type: "way", ref: 1, role: "outer", geometry: [{ lat: 48.38, lon: 2.64 }, { lat: 48.38, lon: 2.72 }, { lat: 48.43, lon: 2.72 }] },
    { type: "way", ref: 2, role: "outer", geometry: [{ lat: 48.38, lon: 2.64 }, { lat: 48.43, lon: 2.64 }, { lat: 48.43, lon: 2.72 }] },
  ],
};
const PETIT_BOIS = wayFerme(101, { natural: "wood" }, carre(48.4078, 2.6795, 48.4088, 2.681));

// ── Cas 2 : grand parc urbain en relation à deux anneaux extérieurs (coupé par une voie) ─────────
// L'adresse est dans le SECOND anneau ; un square déclaré parc (~1 ha) est à ~300 m au sud.
const ADRESSE_PARC: P = { lat: 48.8275, lon: 2.465 };
const PARC_RELATION = {
  type: "relation", id: 9000002,
  tags: { type: "multipolygon", leisure: "park", name: "Grand parc (synthétique)" },
  members: [
    { type: "way", ref: 3, role: "outer", geometry: carre(48.83, 2.415, 48.845, 2.445) },
    { type: "way", ref: 4, role: "outer", geometry: carre(48.825, 2.45, 48.84, 2.48) },
  ],
};
const SQUARE = wayFerme(102, { leisure: "park" }, carre(48.824, 2.4645, 48.8248, 2.466));

test("REPRODUCTION — la requête Overpass demande les relations", async () => {
  const fetchOrigine = globalThis.fetch;
  let requete = "";
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    requete = new URLSearchParams(String(init?.body)).get("data") ?? "";
    return new Response(JSON.stringify({ elements: [] }), { status: 200 });
  }) as typeof fetch;
  try {
    await fetchOverpass({ s: 48.40, w: 2.67, n: 48.41, e: 2.69 });
  } finally {
    globalThis.fetch = fetchOrigine;
  }
  assert.ok(requete.length > 0, "la requête a bien été émise");
  assert.match(requete, /relation\[/, `requête émise : ${requete}`);
});

test("REPRODUCTION — parseOverpass conserve une relation multipolygone verte", () => {
  const geoms = parseOverpass([FORET_RELATION, PARC_RELATION]);
  assert.ok(geoms.length > 0, `relations jetées : ${geoms.length} géométrie(s) retenue(s) sur 2 relations`);
});

test("REPRODUCTION — Fontainebleau : une adresse DANS la forêt n'est pas « à ~310 m » d'un espace vert", () => {
  const prox = computeOsmProximity(ADRESSE_FORET, parseOverpass([FORET_RELATION, PETIT_BOIS]), OSM_BBOX_RADIUS_M);
  const v = prox.nearestMappedGreenSpace;
  assert.equal(v?.distanceMeters, 0, `obtenu : ${JSON.stringify(v)}`);
});

test("REPRODUCTION — grand parc à deux anneaux : une adresse DANS le second anneau rend 0", () => {
  const prox = computeOsmProximity(ADRESSE_PARC, parseOverpass([PARC_RELATION, SQUARE]), OSM_BBOX_RADIUS_M);
  const v = prox.nearestMappedGreenSpace;
  assert.equal(v?.distanceMeters, 0, `obtenu : ${JSON.stringify(v)}`);
});

test("CONTRÔLE — le même massif cartographié en way fermé rend bien 0 (le défaut est propre aux relations)", () => {
  const foretEnWay = wayFerme(103, { landuse: "forest" }, carre(48.38, 2.64, 48.43, 2.72));
  const prox = computeOsmProximity(ADRESSE_FORET, parseOverpass([foretEnWay, PETIT_BOIS]), OSM_BBOX_RADIUS_M);
  assert.equal(prox.nearestMappedGreenSpace?.distanceMeters, 0);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "forest");
});

test("CONTRÔLE — un node vert est jeté par parseOverpass (et jamais demandé par la requête)", () => {
  assert.equal(parseOverpass([{ type: "node", id: 5, lat: 48.4, lon: 2.68, tags: { leisure: "park" } }]).length, 0);
});

test("CONTRÔLE — access=private écarte un bois : il n'est plus proposé comme « le plus proche »", () => {
  const boisPrive = wayFerme(104, { natural: "wood", access: "private" }, carre(48.4078, 2.6795, 48.4088, 2.681));
  assert.equal(parseOverpass([boisPrive]).length, 0);
});
