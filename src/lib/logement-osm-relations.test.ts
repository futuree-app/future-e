// FUT-15 — LES ESPACES VERTS PORTÉS PAR UNE RELATION MULTIPOLYGONE.
//
// Fixtures au format Overpass `out geom`, coordonnées synthétiques autour de 45° N (0,01° de
// latitude ≈ 1 112 m, 0,01° de longitude ≈ 786 m). Aucun appel réseau.
import test from "node:test";
import assert from "node:assert/strict";
import { parseOverpass, computeOsmProximity, fetchOverpass, assemblerAnneaux, OSM_BBOX_RADIUS_M, type OsmGeom } from "./logement-osm.ts";
import { ringAreaM2 } from "./geo-distance.ts";

type P = { lat: number; lon: number };
const carre = (s: number, w: number, n: number, e: number): P[] => [
  { lat: s, lon: w }, { lat: n, lon: w }, { lat: n, lon: e }, { lat: s, lon: e }, { lat: s, lon: w },
];
const membre = (role: string, geometry: P[], ref?: number) => ({ type: "way", role, geometry, ...(ref ? { ref } : {}) });
const relation = (id: number, tags: Record<string, string>, members: unknown[]) => ({
  type: "relation", id, tags: { type: "multipolygon", ...tags }, members,
});
const way = (id: number, tags: Record<string, string>, geometry: P[]) => ({ type: "way", id, tags, geometry });
const proximite = (p: P, els: unknown[]) => computeOsmProximity(p, parseOverpass(els), OSM_BBOX_RADIUS_M);

// Un massif de ~2,2 × 1,6 km, avec une clairière de ~445 × 315 m en son milieu.
const OUTER = carre(45.0, 5.0, 45.02, 5.02);
const INNER = carre(45.008, 5.008, 45.012, 5.012);
// Ses quatre côtés, pour les cas d'assemblage.
const SUD = [{ lat: 45.0, lon: 5.0 }, { lat: 45.0, lon: 5.02 }];
const EST = [{ lat: 45.0, lon: 5.02 }, { lat: 45.02, lon: 5.02 }];
const NORD = [{ lat: 45.02, lon: 5.02 }, { lat: 45.02, lon: 5.0 }];
const OUEST = [{ lat: 45.02, lon: 5.0 }, { lat: 45.0, lon: 5.0 }];
const DANS_LA_FORET = { lat: 45.004, lon: 5.004 };
const DANS_LA_CLAIRIERE = { lat: 45.01, lon: 5.01 };

const seule = (geoms: OsmGeom[]) => {
  assert.equal(geoms.length, 1, `attendu une géométrie, obtenu ${geoms.length}`);
  return geoms[0];
};

// ── Requête ──────────────────────────────────────────────────────────────────────────────────────

test("requête : les relations sont demandées pour les seuls tags verts, ni nodes ni bruit en relation", async () => {
  const origine = globalThis.fetch;
  let q = "";
  globalThis.fetch = (async (_u: unknown, init?: { body?: unknown }) => {
    q = new URLSearchParams(String(init?.body)).get("data") ?? "";
    return new Response(JSON.stringify({ elements: [] }), { status: 200 });
  }) as typeof fetch;
  try {
    await fetchOverpass({ s: 45, w: 5, n: 45.01, e: 5.01 });
  } finally {
    globalThis.fetch = origine;
  }
  assert.match(q, /relation\["type"="multipolygon"\]\["leisure"="park"\]/);
  assert.match(q, /relation\["type"="multipolygon"\]\["landuse"~"\^\(forest\|grass\)\$"\]/);
  assert.match(q, /relation\["type"="multipolygon"\]\["natural"="wood"\]/);
  assert.equal((q.match(/relation\[/g) ?? []).length, 3, "trois lignes relation, pas une de plus");
  assert.doesNotMatch(q, /node\[|nwr\[/);
  assert.doesNotMatch(q, /relation\[[^;]*(highway|railway)/);
  assert.equal((q.match(/out geom/g) ?? []).length, 1, "une seule sortie, donc une seule requête");
});

// ── Assemblage ───────────────────────────────────────────────────────────────────────────────────

test("relation verte simple : un extérieur fermé d'un seul tenant", () => {
  const g = seule(parseOverpass([relation(7, { landuse: "forest", name: "Forêt test" }, [membre("outer", OUTER)])]));
  assert.equal(g.kind, "multipolygon");
  assert.equal(g.greenKind, "forest");
  assert.equal(g.name, "Forêt test");
  assert.equal(g.osmId, 7);
  assert.equal(g.osmType, "relation");
});

test("assemblage : quatre segments dans le désordre forment un seul anneau fermé", () => {
  const anneaux = assemblerAnneaux([NORD, SUD, OUEST, EST]);
  assert.ok(anneaux);
  assert.equal(anneaux.length, 1);
  assert.equal(anneaux[0].length, 5);
  // Même carré, parcouru depuis un autre sommet : la projection locale décale l'aire de ~0,03 %.
  assert.ok(Math.abs(ringAreaM2(anneaux[0]) / ringAreaM2(OUTER) - 1) < 0.001);
});

test("assemblage : un segment orienté à l'envers est retourné, pas rejeté", () => {
  const estInverse = [...EST].reverse();
  const anneaux = assemblerAnneaux([SUD, NORD, estInverse, OUEST]);
  assert.ok(anneaux);
  assert.equal(anneaux.length, 1);
  assert.ok(Math.abs(ringAreaM2(anneaux[0]) - ringAreaM2(OUTER)) < 1);
});

test("assemblage : une relation dont les côtés arrivent en désordre et à l'envers rend 0 dedans", () => {
  const els = [relation(8, { landuse: "forest" }, [
    membre("outer", NORD), membre("outer", [...SUD].reverse()), membre("outer", OUEST), membre("outer", [...EST].reverse()),
  ])];
  assert.equal(proximite(DANS_LA_FORET, els).nearestMappedGreenSpace?.distanceMeters, 0);
});

test("plusieurs extérieurs : dedans le second, l'adresse est dans l'espace", () => {
  const second = carre(45.03, 5.0, 45.04, 5.01);
  const els = [relation(9, { leisure: "park" }, [membre("outer", OUTER), membre("outer", second)])];
  const g = seule(parseOverpass(els));
  assert.equal(g.kind === "multipolygon" && g.polygons.length, 2);
  assert.equal(proximite({ lat: 45.035, lon: 5.005 }, els).nearestMappedGreenSpace?.distanceMeters, 0);
  // Entre les deux : à la distance du bord le plus proche, ni 0 ni un centroïde.
  const entre = proximite({ lat: 45.025, lon: 5.005 }, els).nearestMappedGreenSpace!.distanceMeters;
  assert.ok(Math.abs(entre - 556) < 5, `attendu ~556 m (0,005° de latitude), obtenu ${entre}`);
});

// ── Trous ────────────────────────────────────────────────────────────────────────────────────────

const FORET_A_CLAIRIERE = relation(10, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", INNER)]);

test("trou : une adresse dans l'extérieur, hors du trou, est dans l'espace (0)", () => {
  assert.equal(proximite(DANS_LA_FORET, [FORET_A_CLAIRIERE]).nearestMappedGreenSpace?.distanceMeters, 0);
});

test("trou : une adresse dans la clairière n'est PAS dans l'espace, elle est au bord de la clairière", () => {
  const d = proximite(DANS_LA_CLAIRIERE, [FORET_A_CLAIRIERE]).nearestMappedGreenSpace!.distanceMeters;
  assert.notEqual(d, 0);
  // Le bord le plus proche de la clairière est à 0,002° de longitude ≈ 157 m, pas le bord extérieur (~786 m).
  assert.ok(Math.abs(d - 157) < 3, `attendu ~157 m, obtenu ${d}`);
});

test("trou : un bosquet cartographié dans la clairière redevient de l'espace vert (0)", () => {
  const bosquet = carre(45.0095, 5.0095, 45.0105, 5.0105);
  const els = [relation(11, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", INNER), membre("outer", bosquet)])];
  assert.equal(proximite(DANS_LA_CLAIRIERE, els).nearestMappedGreenSpace?.distanceMeters, 0);
});

test("trou découpé en deux segments : il est assemblé comme un extérieur", () => {
  const moitieA = INNER.slice(0, 3);
  const moitieB = INNER.slice(2);
  const els = [relation(12, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", moitieB), membre("inner", moitieA)])];
  assert.notEqual(proximite(DANS_LA_CLAIRIERE, els).nearestMappedGreenSpace?.distanceMeters, 0);
});

test("distance extérieure : au contour le plus proche", () => {
  const d = proximite({ lat: 45.025, lon: 5.01 }, [FORET_A_CLAIRIERE]).nearestMappedGreenSpace!.distanceMeters;
  assert.ok(Math.abs(d - 556) < 5, `attendu ~556 m, obtenu ${d}`);
});

test("distance extérieure : un point à quelques centimètres du bord n'est jamais rendu « dedans »", () => {
  const d = proximite({ lat: 45.020003, lon: 5.01 }, [FORET_A_CLAIRIERE]).nearestMappedGreenSpace!.distanceMeters;
  assert.equal(d, 1);
});

// ── Surface ──────────────────────────────────────────────────────────────────────────────────────

test("surface : la somme des extérieurs moins celle des trous", () => {
  const attendu = Math.round(ringAreaM2(OUTER) - ringAreaM2(INNER));
  const v = proximite(DANS_LA_FORET, [FORET_A_CLAIRIERE]).nearestMappedGreenSpace!;
  assert.equal(v.areaM2, attendu);
});

test("surface : le seuil s'applique à la surface nette, trous déduits", () => {
  // Une pelouse de ~2 470 m² brute, ~1 235 m² une fois son trou retiré : sous le seuil de 2 000 m².
  const ext = carre(45.0, 5.0, 45.0005, 5.0006);
  const trou = carre(45.0001, 5.00005, 45.0004, 5.00055);
  assert.ok(ringAreaM2(ext) > 2000 && ringAreaM2(ext) - ringAreaM2(trou) < 2000);
  const els = [relation(13, { landuse: "grass" }, [membre("outer", ext), membre("inner", trou)])];
  assert.equal(proximite({ lat: 45.00005, lon: 5.0003 }, els).nearestMappedGreenSpace, null);
});

// ── Rejets prudents ──────────────────────────────────────────────────────────────────────────────

test("rejet : un anneau qui ne se referme pas écarte la relation, sans relier les bouts", () => {
  const els = [relation(14, { landuse: "forest" }, [membre("outer", SUD), membre("outer", EST), membre("outer", NORD)])];
  assert.equal(parseOverpass(els).length, 0);
  assert.equal(assemblerAnneaux([SUD, EST, NORD]), null);
});

test("rejet : un trou ouvert écarte toute la relation, pas seulement le trou", () => {
  const els = [relation(15, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", INNER.slice(0, 3))])];
  assert.equal(parseOverpass(els).length, 0);
});

test("rejet : un membre sans géométrie, ou à sommet manquant, écarte la relation", () => {
  assert.equal(parseOverpass([relation(16, { landuse: "forest" }, [{ type: "way", role: "outer" }])]).length, 0);
  const troue = [...OUTER.slice(0, 2), null, ...OUTER.slice(3)] as unknown as P[];
  assert.equal(parseOverpass([relation(17, { landuse: "forest" }, [membre("outer", troue)])]).length, 0);
});

test("rejet : un trou qu'aucun extérieur ne contient écarte la relation", () => {
  const ailleurs = carre(46.0, 6.0, 46.001, 6.001);
  assert.equal(parseOverpass([relation(18, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", ailleurs)])]).length, 0);
});

test("rejet : un anneau fermé sans surface (aller-retour) n'est pas une emprise", () => {
  const allerRetour = [{ lat: 45, lon: 5 }, { lat: 45, lon: 5.01 }, { lat: 45, lon: 5 }];
  assert.equal(parseOverpass([relation(19, { landuse: "forest" }, [membre("outer", allerRetour)])]).length, 0);
});

test("rejet : une relation qui n'est pas un multipolygone, ou sans tag vert, est ignorée", () => {
  const frontiere = { type: "relation", id: 20, tags: { type: "boundary", landuse: "forest" }, members: [membre("outer", OUTER)] };
  assert.equal(parseOverpass([frontiere, relation(21, { building: "yes" }, [membre("outer", OUTER)])]).length, 0);
});

// ── Dédoublonnage ────────────────────────────────────────────────────────────────────────────────

test("dédoublonnage : un way extérieur qui porte aussi le tag vert n'est pas compté une seconde fois", () => {
  const els = [
    relation(22, { leisure: "park", name: "Grand parc" }, [membre("outer", OUTER, 500)]),
    way(500, { leisure: "park", name: "Grand parc" }, OUTER),
  ];
  const g = seule(parseOverpass(els));
  assert.equal(g.kind, "multipolygon");
});

test("dédoublonnage : une clairière enherbée, membre intérieur, reste un lieu distinct", () => {
  const els = [
    relation(23, { landuse: "forest" }, [membre("outer", OUTER), membre("inner", INNER, 600)]),
    way(600, { landuse: "grass" }, INNER),
  ];
  const geoms = parseOverpass(els);
  assert.equal(geoms.length, 2);
  // Dans la clairière, la plus proche surface est la pelouse elle-même : l'adresse s'y trouve.
  const v = computeOsmProximity(DANS_LA_CLAIRIERE, geoms, OSM_BBOX_RADIUS_M).nearestMappedGreenSpace!;
  assert.equal(v.distanceMeters, 0);
  assert.equal(v.kind, "grass");
});

test("dédoublonnage : si la relation est écartée, ses ways tagués restent (comportement antérieur)", () => {
  const els = [
    relation(24, { leisure: "park" }, [membre("outer", SUD, 700), membre("outer", EST)]),
    way(700, { leisure: "park" }, OUTER),
  ];
  const g = seule(parseOverpass(els));
  assert.equal(g.kind, "polygon");
});

// ── Règles de pertinence, inchangées ─────────────────────────────────────────────────────────────

test("grand espace : une forêt en relation à ~320 m devient la destination, derrière un square", () => {
  const square = way(800, { leisure: "park" }, carre(44.9970, 5.0050, 44.9973, 5.0054)); // ~1 000 m², contient l'adresse
  const adresse = { lat: 44.99715, lon: 5.0052 };
  const prox = proximite(adresse, [square, FORET_A_CLAIRIERE]);
  assert.equal(prox.nearestMappedGreenSpace?.distanceMeters, 0);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
  const grand = prox.largerGreenSpaceNearby!;
  assert.ok(grand, "la forêt devait être proposée");
  assert.equal(grand.kind, "forest");
  assert.ok(Math.abs(grand.distanceMeters - 317) < 5, `obtenu ${grand.distanceMeters}`);
  assert.equal(grand.areaM2, Math.round(ringAreaM2(OUTER) - ringAreaM2(INNER)));
});

test("grand espace : un square DANS la forêt reste le plus proche, la forêt vient en seconde ligne", () => {
  const square = way(802, { leisure: "park" }, carre(45.0039, 5.0038, 45.0042, 5.0043)); // contient DANS_LA_FORET
  const prox = proximite(DANS_LA_FORET, [FORET_A_CLAIRIERE, square]);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "park");
  assert.equal(prox.nearestMappedGreenSpace?.distanceMeters, 0);
  assert.equal(prox.largerGreenSpaceNearby?.kind, "forest");
  assert.equal(prox.largerGreenSpaceNearby?.distanceMeters, 0);
});

test("grand espace : un way et une relation de même numéro ne sont pas le même lieu", () => {
  const square = way(42, { leisure: "park" }, carre(44.9970, 5.0050, 44.9973, 5.0054));
  const foret = relation(42, { landuse: "forest" }, [membre("outer", OUTER)]);
  const prox = proximite({ lat: 44.99715, lon: 5.0052 }, [square, foret]);
  assert.equal(prox.largerGreenSpaceNearby?.kind, "forest");
});

test("grand espace : dans la forêt elle-même, aucune seconde ligne n'est inventée", () => {
  const square = way(801, { leisure: "park" }, carre(45.0041, 5.0041, 45.0044, 5.0045));
  const prox = proximite(DANS_LA_FORET, [square, FORET_A_CLAIRIERE]);
  assert.equal(prox.nearestMappedGreenSpace?.kind, "forest");
  assert.equal(prox.largerGreenSpaceNearby, null);
});

// ── access ───────────────────────────────────────────────────────────────────────────────────────

test("access=private|no écarte une relation ou un way ; access=yes ou absent ne change rien", () => {
  assert.equal(parseOverpass([relation(25, { landuse: "forest", access: "private" }, [membre("outer", OUTER)])]).length, 0);
  assert.equal(parseOverpass([relation(26, { landuse: "forest", access: "no" }, [membre("outer", OUTER)])]).length, 0);
  assert.equal(parseOverpass([way(27, { leisure: "park", access: "no" }, OUTER)]).length, 0);
  assert.equal(parseOverpass([way(28, { leisure: "park", access: "yes" }, OUTER)]).length, 1);
  assert.equal(parseOverpass([relation(29, { landuse: "forest", access: "permissive" }, [membre("outer", OUTER)])]).length, 1);
});

test("access ne concerne que le vert : une voie ferrée privée reste une source de bruit", () => {
  const g = seule(parseOverpass([way(30, { railway: "rail", access: "private" }, SUD)]));
  assert.equal(g.role, "noisy");
});
