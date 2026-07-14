// Mapping PUR commune -> ModuleFacts. Imports type-only (aucun chargement de comparateur-vie, qui
// est server-only) : c'est ici que vit la doctrine « absence de donnée jamais un résultat » (catnat
// et risque absents -> null, jamais 0), donc c'est ce qui doit être testable en isolation.
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { CommuneAttributes } from "../hard-constraints.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { ClimatFacts } from "./climat-facts.ts";
import { buildSanteFacts } from "./sante-facts.ts";

export function mapCommuneToModuleFacts(
  entry: IndexCommune,
  scores: Partial<Record<PreferenceKey, number | null>>,
  // `tailleVille` est RÉSOLUE PAR L'APPELANT (l'index des unités urbaines vit dans comparateur-vie).
  // Le dossier n'a pas le droit de la recalculer autrement : ce serait rouvrir la divergence qu'on vient
  // de fermer (le comparateur jugeait la taille sur l'agglomération, le dossier sur la commune).
  // `climat` est chargé PAR L'APPELANT (les scénarios DRIAS vivent dans un fichier, et ce mapping doit
  // rester pur donc testable), exactement comme `tailleVille`.
  opts: { hasAddress: boolean; tailleVille: number | null; climat?: ClimatFacts | null },
): ModuleFacts {
  return {
    insee: entry.insee,
    nom: entry.nom,
    dept: entry.dept,
    lat: entry.lat,
    lon: entry.lon,
    uu: entry.uu ?? null,
    tailleVille: opts.tailleVille,
    reliefProximite: entry.relief_proximite ?? null,
    distanceCoteKm: entry.distance_cote_km,
    population: entry.population ?? null,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation ? entry.inondation.catnat : null,
    inondationRisque: entry.inondation ? entry.inondation.risque : null,
    climat: opts.climat ?? null,
    // La santé se construit ICI, sans I/O : air, bruit et exposition industrielle sont déjà dans l'index.
    // (Le climat, lui, exige les scénarios DRIAS complets, qui vivent dans un fichier à part.)
    sante: buildSanteFacts(entry),
    scores,
    hasAddress: opts.hasAddress,
  };
}

// ModuleFacts est un SUR-ENSEMBLE de CommuneAttributes : cette vue ne CONVERTIT rien, elle sélectionne.
// Si elle devait convertir, c'est que les deux moteurs auraient recommencé à diverger.
export function toCommuneAttributes(f: ModuleFacts): CommuneAttributes {
  return {
    insee: f.insee,
    nom: f.nom,
    dept: f.dept,
    lat: f.lat,
    lon: f.lon,
    population: f.population,
    tailleVille: f.tailleVille,
    uu: f.uu,
    altitude: f.altitude,
    reliefProximite: f.reliefProximite,
    distanceCoteKm: f.distanceCoteKm,
  };
}
