// LA RÉSOLUTION EXTERNE, AU-DESSUS DES DEUX MOTEURS. C'est ici, et seulement ici, que la chaîne des
// contraintes dures touche le réseau.
//
// Ni le comparateur ni le dossier ne résolvent un label eux-mêmes : ils traversent la MÊME chaîne, avec le
// même contrat, les mêmes contrôles et le même cache de process. (Ils ne reçoivent pas encore le même objet
// GELÉ : un géocodage réussi ici et un 429 là restent possibles, et deux instances ont deux caches. C'est la
// persistance du lot 2b, avec sa table d'artefacts partagée, qui apportera cette garantie-là. Il ne faut pas
// l'annoncer avant.)
//
// L'HYDRATATION RESTE PURE, et elle est appelée DEUX fois : une première ici, pour savoir ce qu'il faut
// résoudre (l'index suffit-il ? y a-t-il un seuil de temps ?), une seconde par les moteurs, avec le sac.
// Aucun fetch n'entre donc dans le noyau, qui reste testable sous node --test.
//
// LES DÉPENDANCES SONT INJECTABLES parce que les invariants qui comptent sont des invariants d'APPELS :
// « près de Brest » ne doit pas géocoder, une distance en kilomètres ne doit pas router, le vélo ne doit pas
// partir vers un moteur qui rend HTTP 400, et une référence non résolue ne doit pas router depuis un point
// inconnu. Un test qui n'injecterait que le sac déjà rempli ne prouverait rien de tout cela.
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { geocodePlace as geocodePlaceImpl, type GeocodeOutcome } from "./geocode-place.ts";
import { screenCandidates } from "./place-screening.ts";
import { getReachability as getReachabilityImpl, type ReachabilityRequest } from "./isochrone.ts";
import {
  resolutionInputHash, RESOLVER_VERSION,
  type PlaceDirectory, type ResolvedPlaceReference,
} from "./hard-constraints-resolve.ts";
import { ROUTABLE_MODES, type ReachabilityState } from "./hard-constraints.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";

export type ExternalResolutions = {
  // `null` = l'index des communes a suffi (« près de Brest ») : il n'y a rien à injecter, et rien n'est
  // parti sur le réseau.
  place: ResolvedPlaceReference | null;
  reachability: ReachabilityState | null;
};

export type ExternalDeps = {
  geocodePlace: (label: string) => Promise<GeocodeOutcome>;
  getReachability: (r: ReachabilityRequest) => Promise<ReachabilityState>;
};

const DEFAULT_DEPS: ExternalDeps = {
  geocodePlace: geocodePlaceImpl,
  getReachability: getReachabilityImpl,
};

export async function resolveExternalReferences(
  hc: HardConstraints | null | undefined,
  dir: PlaceDirectory,
  deps: ExternalDeps = DEFAULT_DEPS,
): Promise<ExternalResolutions> {
  const label = hc?.nearPlace?.label?.trim();
  if (!label) return { place: null, reachability: null };

  // 1. CE QUE L'INDEX SAIT DÉJÀ FAIRE. « Près de Brest » ne part jamais géocoder : l'index le résout,
  //    exactement comme au lot 1, et le géocodeur n'est appelé que sur ce qu'il ne connaît pas (une gare,
  //    un hôpital, une adresse).
  const base = hydrateHardConstraints(hc, dir);
  const np = base.nearPlace;
  if (!np) return { place: null, reachability: null };

  let place: ResolvedPlaceReference | null = null;
  let reference = np.reference;
  if (reference.status !== "resolved") {
    const departements = hc?.departements ?? [];
    const outcome = await deps.geocodePlace(label);
    // Le contexte territorial DÉSAMBIGUÏSE (« la gare Saint-Jean », en Gironde), il ne force jamais un
    // résultat. Et il entre dans l'inputHash : il fait partie de l'entrée de la résolution.
    place = screenCandidates(
      label,
      outcome.candidates,
      { departements, degraded: outcome.degraded },
      {
        inputHash: resolutionInputHash(label, departements.join(","), "place"),
        resolverVersion: RESOLVER_VERSION,
      },
    );
    reference = place;
  }

  // 2. L'ATTEIGNABILITÉ. Un seul appel, depuis le LIEU, jamais par commune : la référence est GLOBALE.
  //    On ne route pas depuis un point inconnu, on ne devine pas un mode absent, et on n'envoie pas le vélo
  //    à un moteur qui rend HTTP 400.
  const t = np.threshold;
  if (
    reference.status !== "resolved" ||
    t == null ||
    t.metric !== "travel_time" ||
    t.mode == null ||
    !ROUTABLE_MODES.includes(t.mode)
  ) {
    return { place, reachability: null };
  }

  const reachability = await deps.getReachability({
    lat: reference.lat,
    lon: reference.lon,
    maxMinutes: t.maxMinutes,
    mode: t.mode as "car" | "walk",
    direction: "to_reference",
  });
  return { place, reachability };
}
