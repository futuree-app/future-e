import type { SupabaseClient } from "@supabase/supabase-js";
import {
  haversineM, distancePointToPolylineM, distancePointToPolygonM, distancePointToMultiPolygonM, expandBBoxM,
  isClosedRing, multiPolygonAreaM2, pointInRing, ringAreaM2, type LngLat, type PolygoneAvecTrous,
} from "./geo-distance.ts";
import { cellKey, cellBBox } from "./geo-grid.ts";
import type { OsmProximity, GreenKind } from "./logement-autour-types.ts";

// v4 : les espaces verts portés par une RELATION multipolygone sont demandés et assemblés (FUT-15),
// et `access=private|no` les écarte. Une cellule mise en cache sous v3 ignore les grandes forêts et
// les grands parcs cartographiés en relation : ce bump les fait re-collecter à la demande.
// v3 : l'emprise de collecte était tronquée en longitude (cf. tileFetchBBox) ; les cellules mises en
// cache sous v2 sont incomplètes à l'est et à l'ouest, ce bump les fait re-collecter à la demande.
// v2 : on conserve le type d'espace vert (greenKind) ; bump = re-fetch des cellules à la demande.
export const OSM_QUERY_VERSION = "osm-v4-2026-10-06";
export const OSM_BBOX_RADIUS_M = 1500;
export const OSM_CELL_DEG = 0.005; // ~500 m ; à valider (Paris/Lyon, ville moyenne, rural boisé)

const MIRRORS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// OsmGeom reste local (seul logement-osm.ts le manipule) ; OsmProximity vient des types partagés.
type OsmGeomCommun = {
  role: "noisy" | "green";
  subtype: "motorway" | "trunk" | "railway" | "green";
  greenKind?: GreenKind; // renseigné seulement pour role === "green"
  /** L'identité OSM de l'objet. Sert à ne pas proposer deux fois le même lieu. */
  osmId?: number;
  /**
   * Le TYPE de l'identité, absent pour un way. Un way 123 et une relation 123 sont deux objets
   * distincts : comparer les seuls numéros confondrait deux lieux différents.
   */
  osmType?: "relation";
  /** Le nom cartographié, quand il existe. « Parc Adèle Charruyer » vaut mieux que « Parc ». */
  name?: string;
};
export type OsmGeom =
  | (OsmGeomCommun & { kind: "line" | "polygon" | "node"; pts: LngLat[] })
  /** Une relation multipolygone assemblée : ses anneaux fermés, chaque trou rattaché à son extérieur. */
  | (OsmGeomCommun & { kind: "multipolygon"; polygons: PolygoneAvecTrous[] });

function overpassQuery(s: number, w: number, n: number, e: number): string {
  const bb = `(${s},${w},${n},${e})`;
  return (
    "[out:json][timeout:60];(" +
    `way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]${bb};` +
    `way["railway"="rail"]${bb};` +
    `way["leisure"="park"]${bb};` +
    `way["landuse"~"^(forest|grass)$"]${bb};` +
    `way["natural"="wood"]${bb};` +
    // LES MÊMES TAGS VERTS, PORTÉS PAR UNE RELATION (FUT-15). Une grande forêt ou un grand parc est
    // souvent une relation multipolygone, dont les ways membres ne portent aucun tag : sans ces
    // lignes, l'objet n'existait pas pour le produit, et une adresse située DEDANS se voyait
    // annoncer l'espace vert suivant, à plusieurs centaines de mètres. Le bruit n'est pas concerné.
    `relation["type"="multipolygon"]["leisure"="park"]${bb};` +
    `relation["type"="multipolygon"]["landuse"~"^(forest|grass)$"]${bb};` +
    `relation["type"="multipolygon"]["natural"="wood"]${bb};` +
    ");out geom;"
  );
}

type OverpassMembre = { type: string; ref?: number; role?: string; geometry?: Array<LngLat | null> };
type OverpassElement = {
  type: string; id?: number; tags?: Record<string, string>; geometry?: LngLat[]; members?: OverpassMembre[];
};

function greenKindDe(t: Record<string, string>): GreenKind | null {
  return t.leisure === "park" ? "park"
    : t.natural === "wood" ? "wood"
    : t.landuse === "forest" ? "forest"
    : t.landuse === "grass" ? "grass"
    : null; // `recreation_ground` n'est plus collecté : souvent minéral, cf. GreenKind
}

/**
 * UN ESPACE DÉCLARÉ FERMÉ AU PUBLIC N'EST PAS PROPOSÉ (décision du porteur, 03/08/2026).
 *
 * `access=private` et `access=no` sont des affirmations positives du contributeur : on s'en sert
 * pour ÉCARTER, jamais l'inverse. Un espace sans tag `access` n'est pas public, il est non renseigné,
 * et le texte rendu dit déjà que l'accessibilité n'est pas documentée.
 */
function estDeclareFerme(t: Record<string, string>): boolean {
  return t.access === "private" || t.access === "no";
}

const memeSommet = (a: LngLat, b: LngLat) => a.lat === b.lat && a.lon === b.lon;

/**
 * RECOLLE DES SEGMENTS EN ANNEAUX FERMÉS, ou rend `null` si l'un d'eux ne se referme pas.
 *
 * Overpass ne garantit ni l'ordre des membres ni leur sens : on part d'un segment et on cherche,
 * parmi les autres, celui qui commence OU finit là où il s'arrête, retourné au besoin, jusqu'à
 * revenir au point de départ. Le raccord se fait sur un sommet IDENTIQUE, jamais sur le plus proche.
 *
 * AUCUN ANNEAU N'EST FABRIQUÉ. Si une extrémité ne trouve pas de suite, l'anneau est incomplet
 * (membre manquant, relation cassée) : relier les deux bouts dessinerait une frontière qu'aucun
 * contributeur n'a tracée, et décider « dedans » ou « dehors » sur cette frontière serait inventer.
 */
export function assemblerAnneaux(segments: LngLat[][]): LngLat[][] | null {
  const restants = segments.filter((seg) => seg.length >= 2);
  const anneaux: LngLat[][] = [];
  while (restants.length > 0) {
    const anneau = [...restants.shift()!];
    while (!isClosedRing(anneau)) {
      const fin = anneau[anneau.length - 1];
      const i = restants.findIndex((seg) => memeSommet(seg[0], fin) || memeSommet(seg[seg.length - 1], fin));
      if (i < 0) return null;
      const [seg] = restants.splice(i, 1);
      const dansLeSens = memeSommet(seg[0], fin) ? seg : [...seg].reverse();
      anneau.push(...dansLeSens.slice(1));
    }
    // Fermé mais sans surface (aller-retour sur un même segment, triangle aplati) : ce n'est pas
    // un anneau, et le garder ferait passer un trait pour une emprise.
    if (anneau.length < 4 || ringAreaM2(anneau) === 0) return null;
    anneaux.push(anneau);
  }
  return anneaux;
}

/**
 * ASSEMBLE UNE RELATION MULTIPOLYGONE, ou rend `null` quand sa géométrie n'est pas exploitable.
 *
 * LE CONTRAT EST CELUI DU REJET ENTIER. Un seul anneau qui ne se referme pas, un sommet manquant,
 * un trou qu'aucun extérieur ne contient : la relation est écartée, comme avant FUT-15. Garder les
 * anneaux valides seuls dessinerait une forêt amputée, et une adresse située dans la partie perdue
 * s'entendrait dire qu'elle est dehors, avec l'autorité d'une géométrie vérifiée.
 *
 * Les membres sans rôle `outer` ou `inner` sont ignorés : un rôle vide est ambigu, et si sa
 * géométrie était nécessaire, l'anneau ne se refermera pas et la relation sera écartée.
 */
export function assemblerMultipolygone(membres: OverpassMembre[]): PolygoneAvecTrous[] | null {
  const segmentsDe = (role: "outer" | "inner"): LngLat[][] | null => {
    const out: LngLat[][] = [];
    for (const m of membres) {
      if (m.type !== "way" || m.role !== role) continue;
      const g = m.geometry;
      if (!g || g.length < 2 || g.some((p) => p == null || typeof p.lat !== "number" || typeof p.lon !== "number")) {
        return null;
      }
      out.push((g as LngLat[]).map((p) => ({ lat: p.lat, lon: p.lon })));
    }
    return out;
  };
  const segOuter = segmentsDe("outer");
  const segInner = segmentsDe("inner");
  if (!segOuter || !segInner || segOuter.length === 0) return null;
  const outers = assemblerAnneaux(segOuter);
  const inners = assemblerAnneaux(segInner);
  if (!outers || !inners) return null;

  const polygones: PolygoneAvecTrous[] = outers.map((outer) => ({ outer, inners: [] }));
  for (const trou of inners) {
    // Le trou appartient au PLUS PETIT extérieur qui le contient (un bosquet dans une clairière
    // est un extérieur logé dans un trou d'un autre). Contenir = au moins un sommet du trou
    // strictement dedans : un trou qui touche son extérieur partage des sommets avec lui.
    const hotes = polygones.filter((m) => trou.some((p) => pointInRing(p, m.outer)));
    if (hotes.length === 0) return null;
    hotes.reduce((a, b) => (ringAreaM2(b.outer) < ringAreaM2(a.outer) ? b : a)).inners.push(trou);
  }
  return polygones;
}

export function parseOverpass(elements: unknown[]): OsmGeom[] {
  const out: OsmGeom[] = [];
  const relations: OsmGeom[] = [];
  const els = elements as OverpassElement[];

  // LES RELATIONS D'ABORD, pour savoir quels ways elles portent. Un way extérieur d'une relation
  // retenue qui porte AUSSI un tag vert (ancien balisage) remonterait comme un second objet, et le
  // même espace serait compté deux fois. Un way intérieur (une clairière enherbée dans la forêt)
  // est un autre lieu : il reste.
  const membresExterieurs = new Set<number>();
  for (const el of els) {
    if (el.type !== "relation" || !el.members) continue;
    const t = el.tags ?? {};
    if (t.type !== "multipolygon" || estDeclareFerme(t)) continue;
    const greenKind = greenKindDe(t);
    if (!greenKind) continue;
    const polygons = assemblerMultipolygone(el.members);
    if (!polygons) continue;
    for (const m of el.members) {
      if (m.type === "way" && m.role === "outer" && typeof m.ref === "number") membresExterieurs.add(m.ref);
    }
    const nom = (t.name ?? "").trim();
    relations.push({
      kind: "multipolygon", role: "green", subtype: "green", greenKind, polygons,
      ...(typeof el.id === "number" ? { osmId: el.id, osmType: "relation" as const } : {}),
      ...(nom ? { name: nom } : {}),
    });
  }

  for (const el of els) {
    if (el.type !== "way" || !el.geometry || el.geometry.length === 0) continue;
    const t = el.tags ?? {};
    const pts = el.geometry.map((p) => ({ lat: p.lat, lon: p.lon }));
    const closed = pts.length > 2 && isClosedRing(pts);
    const hw = t.highway ?? "";
    if (/^motorway/.test(hw)) {
      out.push({ kind: "line", role: "noisy", subtype: "motorway", pts });
    } else if (/^trunk/.test(hw)) {
      out.push({ kind: "line", role: "noisy", subtype: "trunk", pts });
    } else if (t.railway === "rail") {
      out.push({ kind: "line", role: "noisy", subtype: "railway", pts });
    } else {
      const greenKind = greenKindDe(t);
      if (!greenKind || estDeclareFerme(t)) continue;
      if (typeof el.id === "number" && membresExterieurs.has(el.id)) continue;
      const nom = (t.name ?? "").trim();
      out.push({
        kind: closed ? "polygon" : "line", role: "green", subtype: "green", greenKind, pts,
        ...(typeof el.id === "number" ? { osmId: el.id } : {}),
        ...(nom ? { name: nom } : {}),
      });
    }
  }
  // LES RELATIONS EN DERNIER. À distance égale, le premier rencontré reste « le plus proche » : une
  // adresse dans un square lui-même dans une forêt garde le square, et la forêt peut alors venir en
  // seconde ligne comme grand espace, au lieu de masquer le square.
  return [...out, ...relations];
}

/** La surface mesurable d'une géométrie verte, ou `undefined` si elle n'est pas fermée. */
function aireM2(g: OsmGeom): number | undefined {
  if (g.kind === "polygon") return ringAreaM2(g.pts);
  if (g.kind === "multipolygon") return multiPolygonAreaM2(g.polygons);
  return undefined;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA TAILLE À PARTIR DE LAQUELLE UNE SURFACE VERTE MÉRITE D'ÊTRE NOMMÉE (20/09/2026).
//
// Le module Autour annonçait « Espace vert · Pelouse · env. 19 m » sur une maison de
// Châtelaillon : un gazon de 339 m², pas un lieu où l'on va. Aucun seuil n'existait, donc
// n'importe quel polygone cartographié comptait.
//
// CE SONT DES SEUILS ÉDITORIAUX, pas des mesures officielles, et ils ne prétendent correspondre à
// aucune définition d'urbanisme. Leur seul rôle est d'éviter qu'une petite surface engazonnée soit
// présentée comme un espace vert pertinent.
//
// DEUX NIVEAUX, PARCE QUE LE TAG PORTE UNE INTENTION. `leisure=park` a été DÉCLARÉ comme un lieu
// par un contributeur, et un square de poche est une vraie ressource urbaine : le seuil n'y sert
// qu'à écarter les aberrations de saisie. `landuse=grass` décrit une occupation du sol sans dire
// que quiconque y va : il lui faut une taille avant de mériter d'être nommé.
//
// CALIBRÉ SUR QUATRE ADRESSES RÉELLES le 20/09/2026 (Châtelaillon, La Rochelle, Nantes, Aulnay).
// Les trois pelouses aberrantes rencontrées faisaient 315, 339 et 519 m² : le cas absurde tombe
// dès 500 m². Entre 500 et 2 000 on ne gagne plus en justesse, on change la NATURE de la réponse :
// à Châtelaillon, 500 m² rend une pelouse de 519 m² à 312 m qui n'apprend rien, quand 2 000 m²
// rend un bois de 5 685 m² à 343 m. En rural, aucun effet : les pelouses y font deux hectares.
const AIRE_MIN_M2: Record<GreenKind, number> = {
  park: 200,
  wood: 200,
  forest: 200,
  grass: 2000,
  recreation_ground: Number.POSITIVE_INFINITY, // plus collecté ; jamais retenu s'il resurgit
};

/**
 * Cette surface est-elle assez grande pour être annoncée comme l'espace vert le plus proche ?
 *
 * SURFACE INCONNUE : le cas d'une géométrie non fermée, dont OSM ne rend qu'un contour partiel.
 * Un bois ou un parc passent quand même, parce que leur tag porte déjà une intention forte et que
 * les écarter supprimerait des espaces réels. Une PELOUSE, non : son seul argument est sa taille,
 * et sans surface mesurable cet argument n'existe pas.
 */
function estUnVraiEspaceVert(g: OsmGeom): boolean {
  if (!g.greenKind) return true;
  const aire = aireM2(g);
  if (aire === undefined) return g.greenKind !== "grass";
  return aire >= AIRE_MIN_M2[g.greenKind];
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// PROXIMITÉ N'EST PAS PERTINENCE (20/09/2026).
//
// Au 5 rue du Palais à La Rochelle, l'espace vert retenu était un square anonyme de 900 m² à
// 35 m. Le parc Adèle Charruyer, vingt-cinq hectares, est à 222 m, et c'est lui que n'importe quel
// Rochelais citerait. La règle « le plus proche gagne » choisissait donc la mauvaise réponse dès
// qu'une petite surface recevable se trouvait devant une grande.
//
// On garde le plus proche, qui répond à un vrai besoin (sortir cinq minutes), et on ajoute une
// SECONDE lecture quand elle apprend quelque chose : la destination du dimanche.
//
// TROIS CONDITIONS, ET CHACUNE ÉCARTE UN FAUX POSITIF RENCONTRÉ DANS LA CALIBRATION :
//   — moins de 800 m : à Châtelaillon, le grand bois est à 1 445 m, hors de l'environnement de
//     l'adresse. On ne fait pas marcher un quart d'heure pour une seconde ligne ;
//   — au moins 1 ha : en dessous, ce n'est pas une destination, c'est un autre square ;
//   — au moins dix fois le premier : à Aulnay, le plus grand fait 7,5 ha contre 2 ha pour le plus
//     proche. Trois fois plus n'est pas d'une autre nature, et la seconde ligne n'apprend rien.
//
// Conventions produit, pas mesures officielles. Elles tiennent jusqu'à ce qu'un cas réel les
// prenne en défaut.
const GRAND_ESPACE_RAYON_M = 800;
const GRAND_ESPACE_AIRE_MIN_M2 = 10_000;
const GRAND_ESPACE_FACTEUR = 10;

/**
 * Le second candidat désigne-t-il un AUTRE lieu que le premier ?
 *
 * Un grand parc est souvent découpé en plusieurs polygones dans OSM. Proposer « Parc Charruyer »
 * deux fois, à 35 m puis à 222 m, ferait passer un découpage de cartographie pour deux
 * destinations. On écarte donc le même objet, et le même nom.
 *
 * CE QUE CE CONTRÔLE NE VOIT PAS : deux morceaux adjacents et tous deux anonymes du même parc.
 * Il faudrait calculer leur contiguïté, pour un gain que la calibration n'a pas montré.
 */
function estUnAutreLieu(candidat: OsmGeom, proche: OsmGeom): boolean {
  if (candidat === proche) return false;
  if (candidat.osmId !== undefined && candidat.osmId === proche.osmId && candidat.osmType === proche.osmType) return false;
  if (candidat.name && proche.name && candidat.name === proche.name) return false;
  return true;
}

/**
 * ZÉRO VEUT DIRE DEDANS, ET SEULEMENT DEDANS. La distance vaut exactement 0 quand l'adresse est
 * dans l'emprise ; un point extérieur à 40 cm du bord s'arrondirait aussi à 0 et serait raconté
 * « dans la forêt ». On le borne donc à 1 m, ce qui laisse à l'écran une règle sans ambiguïté
 * (cf. `EspaceVert.distanceMeters`).
 */
function distanceAffichee(d: number): number {
  return d === 0 ? 0 : Math.max(1, Math.round(d));
}

function decrire(g: OsmGeom, d: number, aire: number | undefined) {
  return {
    distanceMeters: distanceAffichee(d),
    ...(g.greenKind ? { kind: g.greenKind } : {}),
    ...(aire !== undefined ? { areaM2: aire } : {}),
    ...(g.name ? { name: g.name } : {}),
  };
}

/** Le grand espace qui vaut le déplacement, ou `null` si aucun n'apprend rien de plus. */
function grandEspace(
  proche: { g: OsmGeom; d: number; aire?: number } | null,
  recevables: { g: OsmGeom; d: number; aire: number }[],
) {
  if (!proche) return null;
  const candidats = recevables.filter(
    (c) =>
      estUnAutreLieu(c.g, proche.g) &&
      c.aire >= GRAND_ESPACE_AIRE_MIN_M2 &&
      // Une surface non mesurée pour le plus proche ne bloque pas : le candidat doit simplement
      // franchir le plancher absolu, faute de pouvoir être comparé.
      (proche.aire === undefined || c.aire >= GRAND_ESPACE_FACTEUR * proche.aire),
  );
  if (candidats.length === 0) return null;
  const meilleur = candidats.reduce((a, b) => (b.aire > a.aire ? b : a));
  return decrire(meilleur.g, meilleur.d, meilleur.aire);
}

export function computeOsmProximity(center: LngLat, geoms: OsmGeom[], bboxRadiusM: number): OsmProximity {
  const distTo = (g: OsmGeom): number =>
    g.kind === "multipolygon"
      ? distancePointToMultiPolygonM(center, g.polygons)
      : g.kind === "polygon"
        ? distancePointToPolygonM(center, g.pts)
        : g.kind === "line"
          ? distancePointToPolylineM(center, g.pts)
          : haversineM(center, g.pts[0]);
  const noisy = new Map<"motorway" | "trunk" | "railway", number>();
  let proche: { g: OsmGeom; d: number; aire?: number } | null = null;
  const recevables: { g: OsmGeom; d: number; aire: number }[] = [];
  for (const g of geoms) {
    const d = distTo(g);
    if (d > bboxRadiusM) continue;
    if (g.role === "noisy") {
      const st = g.subtype as "motorway" | "trunk" | "railway";
      const cur = noisy.get(st);
      if (cur === undefined || d < cur) noisy.set(st, d);
    } else if (estUnVraiEspaceVert(g)) {
      const brute = aireM2(g);
      const aire = brute === undefined ? undefined : Math.round(brute);
      if (proche === null || d < proche.d) proche = { g, d, aire };
      if (aire !== undefined && d <= GRAND_ESPACE_RAYON_M) recevables.push({ g, d, aire });
    }
  }
  return {
    potentiallyNoisyInfrastructure: [...noisy.entries()]
      .map(([type, d]) => ({ type, distanceMeters: Math.round(d) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters),
    nearestMappedGreenSpace: proche === null ? null : decrire(proche.g, proche.d, proche.aire),
    largerGreenSpaceNearby: grandEspace(proche, recevables),
    bboxRadiusMeters: bboxRadiusM,
  };
}

export async function fetchOverpass(bbox: { s: number; w: number; n: number; e: number }): Promise<unknown[]> {
  const body = new URLSearchParams({ data: overpassQuery(bbox.s, bbox.w, bbox.n, bbox.e) });
  for (const url of MIRRORS) {
    try {
      // Les miroirs Overpass rejettent (403/406/429) les requêtes sans User-Agent identifiable.
      const r = await fetch(url, {
        method: "POST",
        body,
        headers: { "User-Agent": "futur-e/logement-autour (contact: futur-e.app)", Accept: "application/json" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!r.ok) continue;
      const doc = (await r.json()) as { elements?: unknown[] };
      if (Array.isArray(doc.elements)) return doc.elements;
    } catch {
      /* miroir suivant */
    }
  }
  throw new Error("Overpass indisponible");
}

/**
 * L'EMPRISE COLLECTÉE POUR UNE CELLULE : la cellule, élargie d'au moins `OSM_BBOX_RADIUS_M` dans
 * toutes les directions, pour que tout point de la cellule ait son disque complet.
 *
 * Exportée pour être testable : le défaut qu'elle répare ne se voyait nulle part. La marge était
 * calculée en `OSM_BBOX_RADIUS_M / 111_000` sur les DEUX axes, ce qui ne fait que 987 m à l'est et à
 * l'ouest à Paris, 951 m à Lille, pour 1 500 m au nord et au sud. `computeOsmProximity` filtrait
 * ensuite à 1 500 m : entre ces deux bornes, le produit croyait chercher sans avoir demandé.
 * Mesuré le 03/08/2026 (`docs/audits/2026-08-03-osm-semantique-distance.md`) : jusqu'à 15 % des
 * adresses de Lille perdaient ainsi une voie ferrée ou un axe rapide RÉELLEMENT à moins de 1 500 m,
 * sans que le rapport signale la moindre incomplétude.
 */
export function tileFetchBBox(key: string): { s: number; w: number; n: number; e: number } {
  return expandBBoxM(cellBBox(key, OSM_CELL_DEG), OSM_BBOX_RADIUS_M);
}

// Cache de cellule : emprise = cellule + marge (>= OSM_BBOX_RADIUS_M autour de tout point).
export async function getTileGeoms(
  sb: SupabaseClient,
  center: LngLat,
): Promise<{ geoms: OsmGeom[]; status: "complete" | "failed" }> {
  const key = cellKey(center.lat, center.lon, OSM_CELL_DEG);
  const { data } = await sb
    .from("osm_tile_cache")
    .select("geometries,status,query_version")
    .eq("tile_key", key)
    .maybeSingle();
  if (data && data.query_version === OSM_QUERY_VERSION && data.status === "complete") {
    return { geoms: data.geometries as OsmGeom[], status: "complete" };
  }
  const bbox = tileFetchBBox(key);
  try {
    const geoms = parseOverpass(await fetchOverpass(bbox));
    await sb.from("osm_tile_cache").upsert({
      tile_key: key,
      geometries: geoms,
      query_version: OSM_QUERY_VERSION,
      status: "complete",
      fetched_at: new Date().toISOString(),
    });
    return { geoms, status: "complete" };
  } catch {
    return { geoms: [], status: "failed" };
  }
}
