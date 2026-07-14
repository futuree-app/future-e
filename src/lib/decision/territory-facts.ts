// Accès données Territoire (frontière d'intégration : importe comparateur-vie, qui est server-only,
// donc non testable en node --test). Le mapping pur vit dans module-facts-map.ts (testé). Aucune
// valeur de repli : subScore garde déjà les absences, on ne les enveloppe pas d'un try/catch (une
// erreur inattendue doit exploser, ce n'est pas une « donnée indisponible »).
import {
  getCommuneEntry, subScore, PREFERENCE_KEYS, placeDirectory, tailleVilleOf, type IndexCommune,
} from "../comparateur-vie.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import {
  PRODUCT_CONVENTIONS_VERSION, type EvaluationContext, type EvaluationPoint,
} from "../hard-constraints.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { ModuleFacts, Dossier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  // La taille d'agglomération vient de comparateur-vie (tailleVilleOf), jamais d'un calcul refait ici :
  // c'est exactement la divergence qu'on vient de fermer (le comparateur jugeait la taille sur l'unité
  // urbaine, le dossier sur la population communale).
  return mapCommuneToModuleFacts(entry, scores, { hasAddress: opts.hasAddress, tailleVille: tailleVilleOf(entry) });
}

export async function loadModuleFacts(insee: string, opts: { hasAddress: boolean }): Promise<ModuleFacts | null> {
  const entry = await getCommuneEntry(insee);
  return entry ? buildModuleFacts(entry, opts) : null;
}

// LE CONTEXTE DES CONTRAINTES DURES, hydraté AU-DESSUS des deux moteurs : le MÊME annuaire et la MÊME
// hydratation que matchProjects. C'est ce qui interdit au dossier et au comparateur de résoudre
// « Brest » différemment, ou de conclure différemment sur la même commune.
export async function buildHardContext(
  project: UserProject,
  facts: ModuleFacts,
  point?: EvaluationPoint,
): Promise<EvaluationContext> {
  return {
    constraints: hydrateHardConstraints(project.parsed?.hardConstraints, await placeDirectory()),
    // LE POINT RÉELLEMENT TESTÉ. Sans coordonnées, il reste NULL : une commune sans lat/lon repliée sur
    // (0, 0) atterrit dans le golfe de Guinée, et la contrainte de proximité en tirerait une
    // incompatibilité ÉTABLIE, avec sa carte et sa preuve, sur un point inventé.
    point:
      point ??
      (facts.lat != null && facts.lon != null
        ? {
            lat: facts.lat, lon: facts.lon,
            grain: "commune_reference", source: "commune_centroid",
            label: `le point de référence de ${facts.nom}`,
          }
        : null),
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

// Orchestrateur du hub : commune -> ModuleFacts -> règles -> assemblage. `hasAddress` reflète la
// présence d'une analyse logement déjà sauvegardée pour cette commune (l'appelant le détermine) :
// il coupe la règle « confort sans adresse ». parsed null est géré par l'assembleur.
//
// `hard` est RENDU à l'appelant : le dossier commune+adresse (DossierAvecLogement) repart du même socle
// et n'en change que le POINT (l'adresse), sans re-résoudre les références.
export async function buildCommuneDossier(
  insee: string,
  project: UserProject,
  opts?: { hasAddress?: boolean },
): Promise<{ moduleFacts: ModuleFacts; dossier: Dossier; hard: EvaluationContext } | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: opts?.hasAddress ?? false });
  if (!facts) return null;
  const hard = await buildHardContext(project, facts);
  // moduleFacts retournés pour que l'augmentation Logement reparte du MÊME socle (pas de reload).
  return {
    moduleFacts: facts,
    dossier: assembleDossier(runRules(facts, project, hard), project, "commune", facts.nom),
    hard,
  };
}
