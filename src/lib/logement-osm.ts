import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, distancePointToPolylineM, distancePointToPolygonM, expandBBoxM, type LngLat } from "./geo-distance.ts";
import { cellKey, cellBBox } from "./geo-grid.ts";
import type { OsmProximity, GreenKind } from "./logement-autour-types.ts";

// v3 : l'emprise de collecte était tronquée en longitude (cf. tileFetchBBox) ; les cellules mises en
// cache sous v2 sont incomplètes à l'est et à l'ouest, ce bump les fait re-collecter à la demande.
// v2 : on conserve le type d'espace vert (greenKind) ; bump = re-fetch des cellules à la demande.
export const OSM_QUERY_VERSION = "osm-v3-2026-08-03";
export const OSM_BBOX_RADIUS_M = 1500;
export const OSM_CELL_DEG = 0.005; // ~500 m ; à valider (Paris/Lyon, ville moyenne, rural boisé)

const MIRRORS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// OsmGeom reste local (seul logement-osm.ts le manipule) ; OsmProximity vient des types partagés.
export type OsmGeom = {
  kind: "line" | "polygon" | "node";
  role: "noisy" | "green";
  subtype: "motorway" | "trunk" | "railway" | "green";
  greenKind?: GreenKind; // renseigné seulement pour role === "green"
  pts: LngLat[];
};

function overpassQuery(s: number, w: number, n: number, e: number): string {
  const bb = `(${s},${w},${n},${e})`;
  return (
    "[out:json][timeout:60];(" +
    `way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]${bb};` +
    `way["railway"="rail"]${bb};` +
    `way["leisure"="park"]${bb};` +
    `way["landuse"~"^(forest|grass|recreation_ground)$"]${bb};` +
    `way["natural"="wood"]${bb};` +
    ");out geom;"
  );
}

export function parseOverpass(elements: unknown[]): OsmGeom[] {
  const out: OsmGeom[] = [];
  for (const el of elements as Array<{ type: string; tags?: Record<string, string>; geometry?: LngLat[] }>) {
    if (el.type !== "way" || !el.geometry || el.geometry.length === 0) continue;
    const t = el.tags ?? {};
    const pts = el.geometry.map((p) => ({ lat: p.lat, lon: p.lon }));
    const closed =
      pts.length > 2 && pts[0].lat === pts[pts.length - 1].lat && pts[0].lon === pts[pts.length - 1].lon;
    const hw = t.highway ?? "";
    if (/^motorway/.test(hw)) {
      out.push({ kind: "line", role: "noisy", subtype: "motorway", pts });
    } else if (/^trunk/.test(hw)) {
      out.push({ kind: "line", role: "noisy", subtype: "trunk", pts });
    } else if (t.railway === "rail") {
      out.push({ kind: "line", role: "noisy", subtype: "railway", pts });
    } else {
      const greenKind: GreenKind | null =
        t.leisure === "park" ? "park"
        : t.natural === "wood" ? "wood"
        : t.landuse === "forest" ? "forest"
        : t.landuse === "grass" ? "grass"
        : t.landuse === "recreation_ground" ? "recreation_ground"
        : null;
      if (greenKind) {
        out.push({ kind: closed ? "polygon" : "line", role: "green", subtype: "green", greenKind, pts });
      }
    }
  }
  return out;
}

export function computeOsmProximity(center: LngLat, geoms: OsmGeom[], bboxRadiusM: number): OsmProximity {
  const distTo = (g: OsmGeom): number =>
    g.kind === "polygon"
      ? distancePointToPolygonM(center, g.pts)
      : g.kind === "line"
        ? distancePointToPolylineM(center, g.pts)
        : haversineM(center, g.pts[0]);
  const noisy = new Map<"motorway" | "trunk" | "railway", number>();
  let green: number | null = null;
  let greenKind: GreenKind | undefined;
  for (const g of geoms) {
    const d = distTo(g);
    if (d > bboxRadiusM) continue;
    if (g.role === "noisy") {
      const st = g.subtype as "motorway" | "trunk" | "railway";
      const cur = noisy.get(st);
      if (cur === undefined || d < cur) noisy.set(st, d);
    } else if (green === null || d < green) {
      green = d;
      greenKind = g.greenKind;
    }
  }
  return {
    potentiallyNoisyInfrastructure: [...noisy.entries()]
      .map(([type, d]) => ({ type, distanceMeters: Math.round(d) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters),
    nearestMappedGreenSpace:
      green === null ? null : { distanceMeters: Math.round(green), ...(greenKind ? { kind: greenKind } : {}) },
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
