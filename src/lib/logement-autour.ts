import type { LngLat } from "./geo-distance.ts";
import type { BpeNearest, OsmProximity, Face3Snapshot, IcuSnapshot } from "./logement-autour-types.ts";
import { SOURCES_VERSION } from "./address-dossier-store.ts";
import { OSM_QUERY_VERSION, OSM_BBOX_RADIUS_M } from "./logement-osm.ts";

export type { Face3Snapshot }; // ré-export pratique pour les consommateurs

export function assembleSnapshot(
  center: LngLat,
  bpe: BpeNearest[],
  osm: OsmProximity | null,
  osmStatus: "complete" | "pending" | "failed",
  icu: IcuSnapshot = null,
): Face3Snapshot {
  const now = new Date().toISOString();
  return {
    center,
    bpe: { categories: bpe },
    osm: osm ?? {
      potentiallyNoisyInfrastructure: [],
      nearestMappedGreenSpace: null,
      bboxRadiusMeters: OSM_BBOX_RADIUS_M,
    },
    icu,
    sourceStatus: { bpe: "complete", osmInfrastructure: osmStatus, osmGreenSpaces: osmStatus },
    sources: {
      bpeVersion: SOURCES_VERSION,
      osmFetchedAt: osmStatus === "complete" ? now : null,
      osmQueryVersion: OSM_QUERY_VERSION,
    },
    sourcesVersion: SOURCES_VERSION,
    computedAt: now,
  };
}
