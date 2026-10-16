// FUT-50 · L'IDENTITÉ D'UNE COMMUNE, PARTAGÉE PAR LES ROUTES DU PROTOTYPE (serveur seulement ; les routes qui
// l'importent renvoient 404 en production).
//
// Le code INSEE validé décide du nom présenté ; un nom envoyé par le navigateur n'a jamais d'autorité. Une seule
// fonction pour la confirmation de la commune (`/dev/fut50/api/commune`) et pour chaque lecture
// (`/dev/fut50/api/lecture`) : les deux ne peuvent pas diverger.
import "server-only";
import { getCommuneEntry } from "@/lib/comparateur-vie";
import { estCodeOutremer, getEntiteOutremer } from "@/lib/outremer";
import { villePLM } from "@/lib/territoire/plm-communal";

/** Cinq chiffres, ou 2A / 2B suivis de trois chiffres (Corse). L'ancienne forme acceptait « 1A234 ». */
export const FORMAT_INSEE = /^(?:\d{2}|2[AB])\d{3}$/;

/**
 * LA COMMUNE CANONIQUE D'UN CODE INSEE, par les référentiels du produit, sans réseau :
 *   - Paris, Lyon, Marseille (75056, 69123, 13055) : `villePLM`, la règle du dossier Territoire (FUT-43) ;
 *   - toute autre commune, arrondissements compris : l'index des communes (`getCommuneEntry`), celui du moteur et
 *     des dossiers, chargé une fois et gardé en mémoire.
 * `null` : code absent de ces référentiels (inexistant, ancien code d'une commune fusionnée, outre-mer que l'index
 * ne couvre pas). On ne devine jamais une identité.
 */
export async function communeCanonique(insee: string): Promise<{ insee: string; nom: string } | null> {
  // OUTRE-MER (FUT-104) : l'identité vient du COG embarqué (`@/lib/outremer`), jamais de l'index du comparateur, qui
  // ne contient que l'Hexagone et la Corse, et jamais du navigateur. Le nom est désambiguïsé : « Saint-Denis (La Réunion) ».
  if (estCodeOutremer(insee)) {
    const e = getEntiteOutremer(insee);
    return e ? { insee: e.code, nom: e.nomComplet } : null;
  }
  const plm = villePLM(insee);
  if (plm) return { insee, nom: plm.nom };
  const entree = await getCommuneEntry(insee).catch(() => null);
  return entree ? { insee: entree.insee, nom: entree.nom } : null;
}

