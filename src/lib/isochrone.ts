// L'ATTEIGNABILITÉ. Un polygone calculé UNE fois depuis le lieu, puis les 35 000 communes testées
// localement. Jamais un appel par commune, et jamais un haversine déguisé en temps de trajet.
//
// LE CACHE N'EST PAS UNE OPTIMISATION : l'API IGN rate-limite (HTTP 429 vérifié le 2026-07-14). Trois
// étages, et chacun répond à un défaut distinct :
//   mémoire  : le même process ne recalcule pas ;
//   en vol   : deux lecteurs simultanés sur la même gare ne partent pas tous les deux vers IGN ;
//   table    : deux INSTANCES partagent l'artefact, et un redémarrage ne le perd pas.
// La table ne déduplique PAS deux premiers calculs strictement concurrents sur deux instances (il n'y a pas
// de verrou distribué) : elle partage les RÉSULTATS, pas le premier calcul. Ne pas l'annoncer autrement.
//
// Un échec ne rend JAMAIS de géométrie de repli, et ne se convertit JAMAIS en kilomètres : il rend
// routing_unavailable, un état technique, retentable, que le lecteur voit comme « non examiné ».
import { createHash } from "node:crypto";
import type { PolygonGeometry } from "./geo-polygon.ts";
import { PRODUCT_CONVENTIONS, type ReachabilityState } from "./hard-constraints.ts";
import { ignFetch } from "./ign-limiter.ts";
import type { ArtifactStore } from "./reachability-store.ts";

const ISOCHRONE_URL = "https://data.geopf.fr/navigation/isochrone";
const RESOURCE = "bdtopo-valhalla";
const TIMEOUT_MS = 10_000;
export const ISOCHRONE_VERSION = "iso-1"; // la version de NOTRE intégration (paramètres, parsing)

const MAX_ENTRIES = 200; // un polygone pèse une trentaine de ko : le process ne doit pas enfler sans fin
const TTL_MS = 24 * 60 * 60 * 1000;

// Le moteur IGN ne connaît que ces deux profils : le vélo rend HTTP 400 sur toutes les ressources. Le
// noyau l'a déjà écarté (ROUTABLE_MODES) avant d'arriver ici.
const PROFILE: Record<"car" | "walk", string> = { car: "car", walk: "pedestrian" };

export type ReachabilityRequest = {
  lat: number;
  lon: number;
  maxMinutes: number;
  mode: "car" | "walk";
  direction: "to_reference";
};

// LES COORDONNÉES, PAS UN IDENTIFIANT DE LIEU : un même identifiant peut recevoir des coordonnées
// corrigées, et le hash porterait alors une géométrie qui ne correspond plus au point.
export function reachabilityRequestHash(r: ReachabilityRequest): string {
  return createHash("sha256")
    .update(
      [
        r.lat.toFixed(6), r.lon.toFixed(6), String(r.maxMinutes), r.mode, r.direction,
        RESOURCE, ISOCHRONE_VERSION,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 32);
}

export function parseIsochrone(payload: unknown): PolygonGeometry | null {
  const g = (payload as { geometry?: unknown })?.geometry as PolygonGeometry | undefined;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return null;
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) return null;
  return g;
}

const cache = new Map<string, { geometry: PolygonGeometry; at: number }>();
// Les appels EN VOL : deux requêtes concurrentes sur la même gare partagent la MÊME promesse, donc un seul
// appel réseau. Sans cela, le rate-limit d'IGN nous rattrape dès deux lecteurs simultanés.
const inFlight = new Map<string, Promise<PolygonGeometry | null>>();

function ready(geometry: PolygonGeometry): ReachabilityState {
  return { status: "ready", geometry, toleranceMeters: PRODUCT_CONVENTIONS.reachabilityBorderToleranceM };
}

async function fetchGeometry(r: ReachabilityRequest): Promise<PolygonGeometry | null> {
  // LE SENS DU TRAJET EST FIXÉ. « Habiter à moins de 30 minutes de la gare » veut dire domicile -> gare,
  // soit direction=arrival côté IGN. Le sens inverse (partir de la gare) donnerait un autre polygone, et il
  // ne le remplace jamais en silence.
  const url = `${ISOCHRONE_URL}?${new URLSearchParams({
    resource: RESOURCE,
    point: `${r.lon},${r.lat}`, // l'API attend lon,lat
    costValue: String(r.maxMinutes * 60),
    costType: "time",
    timeUnit: "second",
    profile: PROFILE[r.mode],
    direction: "arrival",
  })}`;
  // Le limiteur GLOBAL au process (concurrence 3, Retry-After respecté) : isochrones et itinéraires
  // partagent la MÊME file. Sans cela, une recherche qui affine douze communes noierait l'isochrone de la
  // recherche voisine, et l'API rendrait des 429 aux deux.
  const res = await ignFetch(url, TIMEOUT_MS);
  if (!res.ok) return null; // rate_limited ou error : une panne, pas un territoire
  return parseIsochrone(res.json);
}

export async function getReachability(
  r: ReachabilityRequest,
  store?: ArtifactStore | null,
): Promise<ReachabilityState> {
  const key = reachabilityRequestHash(r);

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return ready(hit.geometry);
  if (hit) cache.delete(key);

  let pending = inFlight.get(key);
  if (!pending) {
    // MÉMOIRE -> TABLE -> RÉSEAU. Le cache est un CONFORT, pas une dépendance : une base indisponible ne
    // fait pas tomber une recherche, elle fait rappeler l'API.
    pending = (async () => {
      const enTable = store ? await store.getIsochrone(key).catch(() => null) : null;
      if (enTable) return enTable;
      const g = await fetchGeometry(r);
      if (g && store) {
        await store
          .putIsochrone(key, g, {
            engine: "ign-valhalla", resource: RESOURCE, integrationVersion: ISOCHRONE_VERSION,
          })
          .catch(() => {});
      }
      return g;
    })();
    inFlight.set(key, pending);
  }

  let geometry: PolygonGeometry | null;
  try {
    geometry = await pending;
  } finally {
    // Le nettoyage est SYNCHRONE au retour de l'appelant, pas repoussé au bout d'une chaîne de promesses :
    // sinon un 429 resterait collé au registre des appels en vol, et la demande suivante recevrait la panne
    // du tour d'avant au lieu de retenter.
    if (inFlight.get(key) === pending) inFlight.delete(key);
  }

  // LES ÉCHECS NE SONT PAS MIS EN CACHE : un 429 se retente. Graver une panne reviendrait à la transformer
  // en constat, ce que tout ce chantier interdit.
  if (!geometry) return { status: "unavailable", reason: "routing_unavailable" };

  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest != null) cache.delete(oldest);
  }
  cache.set(key, { geometry, at: Date.now() });
  return ready(geometry);
}
