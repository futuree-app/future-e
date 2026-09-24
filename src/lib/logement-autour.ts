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

// ════════════════════════════════════════════════════════════════════════════════════════════
// UN RAFRAÎCHISSEMENT NE PEUT QU'AMÉLIORER UN VOISINAGE (24/09/2026).
//
// Les voisinages étaient figés pour toujours : la page Autour affichait celui du dossier sans
// jamais vérifier son âge, et aucun dossier ouvert avant une amélioration n'en bénéficiait (la
// distinction médecin / pharmacie, la gare). Ils se rafraîchissent désormais en arrière-plan.
//
// Mais un recalcul peut être MOINS complet que l'original : une source en panne à ce moment-là,
// comme Géorisques le jour même où cette règle a été écrite. Remplacer un voisinage complet par un
// voisinage troué serait le défaut exact que le générateur d'artefact refuse pour les dossiers.
//
// La règle, partie par partie : ce que le recalcul a obtenu remplace l'ancien ; ce qu'il n'a pas
// obtenu garde l'ancien. Chaque partie porte sa propre date (`osmFetchedAt`, la consultation des
// permis), si bien qu'un voisinage fusionné ne ment sur l'âge d'aucune de ses pièces.
//
// Rend `null` quand rien ne justifie d'écrire : la BPE, locale et le socle de tout le reste, n'a
// pas abouti alors que l'ancienne avait abouti.
// ════════════════════════════════════════════════════════════════════════════════════════════
export function fusionnerRafraichissement(ancien: Face3Snapshot, nouveau: Face3Snapshot): Face3Snapshot | null {
  if (nouveau.sourceStatus.bpe !== "complete" && ancien.sourceStatus.bpe === "complete") return null;

  const osmObtenue = nouveau.sourceStatus.osmInfrastructure === "complete" && nouveau.sourceStatus.osmGreenSpaces === "complete";
  const osmAnciennementComplete = ancien.sourceStatus.osmInfrastructure === "complete" && ancien.sourceStatus.osmGreenSpaces === "complete";
  const garderOsm = !osmObtenue && osmAnciennementComplete;

  const garderPermis = nouveau.permis === undefined && ancien.permis !== undefined;
  const garderIcu = (nouveau.icu == null) && ancien.icu != null;

  return {
    ...nouveau,
    ...(garderOsm
      ? {
          osm: ancien.osm,
          sourceStatus: {
            ...nouveau.sourceStatus,
            osmInfrastructure: ancien.sourceStatus.osmInfrastructure,
            osmGreenSpaces: ancien.sourceStatus.osmGreenSpaces,
          },
          sources: { ...nouveau.sources, osmFetchedAt: ancien.sources.osmFetchedAt, osmQueryVersion: ancien.sources.osmQueryVersion },
        }
      : {}),
    ...(garderPermis ? { permis: ancien.permis } : {}),
    ...(garderIcu ? { icu: ancien.icu } : {}),
  };
}
