import type { SupabaseClient } from "@supabase/supabase-js";
import { haversineM, distancePointToPolylineM, distancePointToPolygonM, type LngLat } from "./geo-distance.ts";
import { cellKey, cellBBox } from "./geo-grid.ts";
import type { OsmProximity } from "./logement-autour-types.ts";

export const OSM_QUERY_VERSION = "osm-v1-2026-07-03";
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
    } else if (
      t.leisure === "park" ||
      t.natural === "wood" ||
      ["forest", "grass", "recreation_ground"].includes(t.landuse ?? "")
    ) {
      out.push({ kind: closed ? "polygon" : "line", role: "green", subtype: "green", pts });
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
  for (const g of geoms) {
    const d = distTo(g);
    if (d > bboxRadiusM) continue;
    if (g.role === "noisy") {
      const st = g.subtype as "motorway" | "trunk" | "railway";
      const cur = noisy.get(st);
      if (cur === undefined || d < cur) noisy.set(st, d);
    } else if (green === null || d < green) {
      green = d;
    }
  }
  return {
    potentiallyNoisyInfrastructure: [...noisy.entries()]
      .map(([type, d]) => ({ type, distanceMeters: Math.round(d) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters),
    nearestMappedGreenSpace: green === null ? null : { distanceMeters: Math.round(green) },
    bboxRadiusMeters: bboxRadiusM,
  };
}

export async function fetchOverpass(bbox: { s: number; w: number; n: number; e: number }): Promise<unknown[]> {
  const body = new URLSearchParams({ data: overpassQuery(bbox.s, bbox.w, bbox.n, bbox.e) });
  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, { method: "POST", body, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) continue;
      const doc = (await r.json()) as { elements?: unknown[] };
      if (Array.isArray(doc.elements)) return doc.elements;
    } catch {
      /* miroir suivant */
    }
  }
  throw new Error("Overpass indisponible");
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
  const cell = cellBBox(key, OSM_CELL_DEG);
  const marginDeg = OSM_BBOX_RADIUS_M / 111_000;
  const bbox = { s: cell.s - marginDeg, w: cell.w - marginDeg, n: cell.n + marginDeg, e: cell.e + marginDeg };
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
