import type { LngLat } from "./geo-distance.ts";
import type {
  BpeNearest, OsmProximity, Face3Snapshot, IcuSnapshot, PermisSnapshot,
} from "./logement-autour-types.ts";
import { SOURCES_VERSION } from "./address-dossier-store.ts";
import { OSM_QUERY_VERSION, OSM_BBOX_RADIUS_M } from "./logement-osm.ts";

export type { Face3Snapshot }; // ré-export pratique pour les consommateurs

export function assembleSnapshot(
  center: LngLat,
  bpe: BpeNearest[],
  osm: OsmProximity | null,
  osmStatus: "complete" | "pending" | "failed",
  icu: IcuSnapshot = null,
  // Le registre des autorisations d'urbanisme, quand il a répondu. `null` laisse le champ ABSENT
  // du snapshot : le bloc disparaît, au lieu d'annoncer une absence de permis jamais établie.
  permis: PermisSnapshot | null = null,
  // Le millésime BPE, lu dans les shards. `null` laisse le champ ABSENT : l'écran dit alors le
  // recensement sans son année, plutôt que d'en supposer une.
  bpeMillesime: string | null = null,
): Face3Snapshot {
  const now = new Date().toISOString();
  return {
    center,
    bpe: { categories: bpe },
    ...(permis ? { permis } : {}),
    osm: osm ?? {
      potentiallyNoisyInfrastructure: [],
      nearestMappedGreenSpace: null,
      bboxRadiusMeters: OSM_BBOX_RADIUS_M,
    },
    icu,
    sourceStatus: { bpe: "complete", osmInfrastructure: osmStatus, osmGreenSpaces: osmStatus },
    sources: {
      bpeVersion: SOURCES_VERSION,
      ...(bpeMillesime ? { bpeMillesime } : {}),
      osmFetchedAt: osmStatus === "complete" ? now : null,
      osmQueryVersion: OSM_QUERY_VERSION,
    },
    sourcesVersion: SOURCES_VERSION,
    computedAt: now,
  };
}
