// Mapping PUR commune -> ModuleFacts. Imports type-only (aucun chargement de comparateur-vie, qui
// est server-only) : c'est ici que vit la doctrine « absence de donnée jamais un résultat » (catnat
// et risque absents -> null, jamais 0), donc c'est ce qui doit être testable en isolation.
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { CommuneAttributes } from "../hard-constraints.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { ClimatFacts } from "./climat-facts.ts";
import type { RadonFacts } from "./radon-facts.ts";
import { buildSanteFacts } from "./sante-facts.ts";
import type { RankBand } from "./mismatch-facts.ts";

export function mapCommuneToModuleFacts(
  entry: IndexCommune,
  scores: Partial<Record<PreferenceKey, number | null>>,
  // `tailleVille` est RÉSOLUE PAR L'APPELANT (l'index des unités urbaines vit dans comparateur-vie).
  // Le dossier n'a pas le droit de la recalculer autrement : ce serait rouvrir la divergence qu'on vient
  // de fermer (le comparateur jugeait la taille sur l'agglomération, le dossier sur la commune).
  // `climat` est chargé PAR L'APPELANT (les scénarios DRIAS vivent dans un fichier, et ce mapping doit
  // rester pur donc testable), exactement comme `tailleVille`.
  opts: { hasAddress: boolean; tailleVille: number | null; tailleVilleSource: "urban_unit" | "commune" | null; climat?: ClimatFacts | null; risquesDeclares?: { wildfire: boolean } | null; radon?: RadonFacts | null },
): ModuleFacts {
  return {
    insee: entry.insee,
    nom: entry.nom,
    dept: entry.dept,
    lat: entry.lat,
    lon: entry.lon,
    uu: entry.uu ?? null,
    tailleVille: opts.tailleVille,
    tailleVilleSource: opts.tailleVilleSource,
    reliefProximite: entry.relief_proximite ?? null,
    distanceCoteKm: entry.distance_cote_km,
    population: entry.population ?? null,
    altitude: entry.altitude ?? null,
    catnatInondation: entry.inondation ? entry.inondation.catnat : null,
    // Chargé par l'APPELANT (comme le climat) : le mapping reste pur, sans I/O.
    risquesDeclares: opts.risquesDeclares ?? null,
    // La composition du couvert naturel vit dans l'index (OSO 2023) : aucune I/O de plus.
    boisementPct: (() => {
      const f = entry.nature?.composition?.foret;
      return typeof f === "number" ? f : null;
    })(),
    inondationRisque: entry.inondation ? entry.inondation.risque : null,
    climat: opts.climat ?? null,
    // La santé se construit ICI, sans I/O : air, bruit et exposition industrielle sont déjà dans l'index.
    // (Le climat, lui, exige les scénarios DRIAS complets, qui vivent dans un fichier à part.)
    sante: buildSanteFacts(entry),
    // Le radon est un APPEL (Géorisques), donc chargé par l'appelant comme le climat : ce mapping
    // reste pur. Absent = la règle se tait.
    radon: opts.radon ?? null,
    // Le rang est DANS l'index (forme COMPACTE : points de base 0..10000, l'index fait déjà 67 Mo). On le
    // reconstitue en fractions, sans le recalculer : la distribution nationale a été figée à l'enrichissement.
    rankBands: (() => {
      const raw = (entry as { rankBands?: Record<string, [number, number]> }).rankBands;
      if (!raw) return null;
      const out: Record<string, RankBand> = {};
      for (const [k, band] of Object.entries(raw)) {
        if (Array.isArray(band) && band.length === 2) out[k] = { low: band[0] / 10000, high: band[1] / 10000 };
      }
      return out;
    })(),
    // Attestations d'absence (lot 2a), champs FRÈRES. On sépare le RÉSULTAT (reseauLocal, etudes_acces) de la
    // PROVENANCE (reseauLocalMeasured, etudesSup.measured). Sans marqueur -> measured:false -> uncertain : le
    // nouveau moteur ne considère jamais une donnée historique comme attestée sans sa provenance.
    localNetwork: entry.reseauLocalMeasured === true
      ? { measured: true, access: entry.reseauLocal?.acces ?? null }
      : { measured: false, access: null },
    higherEd: (() => {
      const e = entry.etudesSup;
      if (e == null || e.measured !== true) return { measured: false as const };
      return { measured: true as const, weightedAccess: e.weightedAccess, radiusKm: e.radiusKm, establishmentCount: e.establishmentCount ?? null };
    })(),
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
