// L'ITINÉRAIRE : le temps de trajet CALCULÉ entre deux points, par le moteur de routage IGN.
//
// CE QUE C'EST, ET CE QUE CE N'EST PAS. C'est un temps calculé par un moteur sur son graphe : ni trafic, ni
// stationnement, ni attente, ni variabilité horaire. Le produit dit donc « estimé à environ 24 minutes »,
// jamais « 24 minutes » comme un fait observé. On corrige un filtre qui mentait ; on ne le remplace pas par
// une fausse précision.
//
// POURQUOI IL NE REMPLACE PAS L'ISOCHRONE : un appel par commune, donc 35 000 appels pour une recherche.
// L'isochrone reste le pré-filtre massif (un polygone, testé localement) ; l'itinéraire tranche les seules
// communes que la géométrie simplifiée n'a pas su trancher, et donne sa durée à celles qu'on affiche.
//
// Vérifié le 2026-07-14 : les deux services sont COHÉRENTS (sonde sur les 12 communes les plus proches de
// la gare Matabiau, isochrone 12 min contre itinéraire : aucun désaccord). L'isochrone ne produit donc pas
// de faux négatifs loin de la frontière, et « outside » reste un filtre fiable.
import { createHash } from "node:crypto";
import { ignFetch } from "./ign-limiter.ts";
import type { ArtifactStore } from "./reachability-store.ts";

const ITINERAIRE_URL = "https://data.geopf.fr/navigation/itineraire";
const RESOURCE = "bdtopo-valhalla";
const TIMEOUT_MS = 8_000;
export const ROUTE_VERSION = "route-1"; // la version de NOTRE intégration (paramètres, parsing)

const PROFILE: Record<"car" | "walk", string> = { car: "car", walk: "pedestrian" };

export type RouteRequest = {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  mode: "car" | "walk";
  direction: "to_reference"; // le domicile VERS la gare, jamais l'inverse en silence
};

// LES DEUX POINTS, PAS UN IDENTIFIANT. Une estimation ne vaut que pour le départ et l'arrivée qui l'ont
// produite : c'est ce hash qui empêchera une durée calculée depuis le CENTROÏDE d'être resservie pour une
// ADRESSE.
export function routeRequestHash(r: RouteRequest): string {
  return createHash("sha256")
    .update(
      [
        r.fromLat.toFixed(6), r.fromLon.toFixed(6),
        r.toLat.toFixed(6), r.toLon.toFixed(6),
        r.mode, r.direction, RESOURCE, ROUTE_VERSION,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 32);
}

export function parseRouteMinutes(payload: unknown): number | null {
  const d = payload as { duration?: unknown; timeUnit?: unknown } | null | undefined;
  const minutes = d?.duration;
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) return null;
  // On DEMANDE des minutes (timeUnit=minute). Si l'API rendait autre chose, la valeur ne veut pas dire ce
  // qu'on croit : on ne la convertit pas au jugé, on la refuse.
  if (d?.timeUnit != null && d.timeUnit !== "minute") return null;
  return minutes;
}

const cache = new Map<string, number>();
// Les appels EN VOL : deux communes identiques (ou deux lecteurs) partagent la même promesse.
const inFlight = new Map<string, Promise<number | null>>();

async function fetchMinutes(r: RouteRequest): Promise<number | null> {
  const url = `${ITINERAIRE_URL}?${new URLSearchParams({
    resource: RESOURCE,
    start: `${r.fromLon},${r.fromLat}`, // l'API attend lon,lat
    end: `${r.toLon},${r.toLat}`,
    profile: PROFILE[r.mode],
    optimization: "fastest",
    timeUnit: "minute",
  })}`;
  const res = await ignFetch(url, TIMEOUT_MS);
  if (!res.ok) return null; // rate_limited ou error : une panne, jamais un temps inventé
  return parseRouteMinutes(res.json);
}

export async function estimateTravelMinutes(
  r: RouteRequest,
  store?: ArtifactStore | null,
): Promise<number | null> {
  const key = routeRequestHash(r);

  const memoire = cache.get(key);
  if (memoire != null) return memoire;

  let pending = inFlight.get(key);
  if (!pending) {
    pending = (async () => {
      // MÉMOIRE -> TABLE -> RÉSEAU. Le cache partagé évite de rappeler une API qui rate-limite, et il
      // survit aux redémarrages. (Il ne déduplique pas deux premiers calculs strictement concurrents sur
      // deux instances : il n'y a pas de verrou distribué ici, et on ne le prétend pas.)
      // LE CACHE EST UN CONFORT, PAS UNE DÉPENDANCE : une base indisponible ne fait pas tomber une
      // recherche, elle fait rappeler l'API. On n'appelle donc jamais le store sans filet.
      const enTable = store ? await store.getMinutes(key).catch(() => null) : null;
      if (enTable != null) return enTable;
      const mesure = await fetchMinutes(r);
      if (mesure != null && store) {
        await store
          .putMinutes(key, mesure, {
            engine: "ign-valhalla", resource: RESOURCE, integrationVersion: ROUTE_VERSION,
          })
          .catch(() => {});
      }
      return mesure;
    })();
    inFlight.set(key, pending);
  }

  let minutes: number | null;
  try {
    minutes = await pending;
  } finally {
    // Nettoyage SYNCHRONE au retour : repoussé au bout d'une chaîne de promesses, il laisserait une panne
    // collée au registre, et la demande suivante recevrait l'échec du tour d'avant au lieu de retenter.
    if (inFlight.get(key) === pending) inFlight.delete(key);
  }

  // LES PANNES NE SONT PAS MISES EN CACHE : elles se retentent.
  if (minutes != null) cache.set(key, minutes);
  return minutes;
}
