import "server-only";
import { getCommuneEntry, getMetaLogement } from "@/lib/comparateur-vie";
import type { LecturePrix } from "@/lib/prix-immobiliers";

// LES PRIX IMMOBILIERS D'UNE COMMUNE, lus dans l'index (FUT-138). Aucun appel externe, aucun calcul : le champ
// `logement` et sa provenance, tels que scripts/populate-logement.mjs les a écrits. Toutes les surfaces
// passent par ici, puis par `prix-immobiliers.ts` pour les phrases.
//
// Paris, Lyon, Marseille : l'index est par arrondissement. Le code d'un arrondissement se lit tel quel ; le
// code de la ville (75056, 69123, 13055) lit les prix de la ville entière, calculés sur toutes ses ventes.

export async function getLecturePrix(insee: string, nom?: string | null): Promise<LecturePrix> {
  const code = insee.trim();
  const [entree, meta] = await Promise.all([getCommuneEntry(code).catch(() => null), getMetaLogement().catch(() => null)]);
  const ville = meta?.villesPLM?.[code] ?? null;
  return {
    code,
    nom: nom?.trim() || entree?.nom || code,
    logement: entree?.logement ?? ville ?? null,
    meta,
  };
}

/** Plusieurs communes (les cartes du comparateur), une seule lecture de l'index. */
export async function getLecturesPrix(communes: { insee: string; nom?: string | null }[]): Promise<Record<string, LecturePrix>> {
  const lues = await Promise.all(communes.map((c) => getLecturePrix(c.insee, c.nom)));
  return Object.fromEntries(lues.map((l) => [l.code, l]));
}
