// Le mapping index -> attributs, PUR. Il est pur pour une raison précise : c'est l'une des frontières où
// les deux moteurs divergeaient (le comparateur lisait tailleVille, le dossier la population communale).
// Les tests de parité doivent pouvoir la TRAVERSER, pas la contourner.
import type { CommuneAttributes } from "./hard-constraints.ts";

// La forme minimale d'une entrée d'index. On ne dépend pas d'IndexCommune (server-only) : on décrit ce
// dont on a besoin.
export type IndexCommuneLike = {
  insee: string;
  nom: string;
  dept: string;
  lat: number;
  lon: number;
  population?: number | null;
  uu?: string | null;
  altitude?: number | null;
  relief_proximite?: number | null;
  distance_cote_km: number;
};

// LA DOCTRINE DE LA TAILLE (chantier C) : une commune dans une unité urbaine porte la taille de son
// agglomération ; une commune hors UU est son propre bassin. Population absente -> null, jamais 0 :
// une commune sans population n'est pas une commune vide.
export function tailleVilleFrom(
  uu: string | null | undefined,
  population: number | null | undefined,
  uuPop: Map<string, number>,
): number | null {
  if (uu) {
    const p = uuPop.get(uu);
    if (p != null) return p;
  }
  return population ?? null;
}

export function communeAttributesFrom(c: IndexCommuneLike, tailleVille: number | null): CommuneAttributes {
  return {
    insee: c.insee,
    nom: c.nom,
    dept: c.dept,
    lat: c.lat,
    lon: c.lon,
    population: c.population ?? null,
    tailleVille,
    uu: c.uu ?? null,
    altitude: c.altitude ?? null,
    reliefProximite: c.relief_proximite ?? null,
    distanceCoteKm: c.distance_cote_km,
  };
}
