// LA DÉFINITION CANONIQUE de la douceur hivernale. PURE. Source unique (comparateur + dossier).
//
// douceur_climat mesure EXCLUSIVEMENT la douceur des hivers : position nationale de la température moyenne
// DJF (NORTMm_seas_DJF), normale de référence DRIAS 1976-2005. Monotone (plus chaud = plus doux). L'été est
// traité par faible_chaleur. Le pct est déjà orienté 0 = plus froid, 100 = plus doux (vérifié sur la donnée).
//
// PAS d'`identityThreshold` ici : une décision absente ne doit pas être représentée par une fausse valeur
// provisoire. Le champ est AJOUTÉ à cette convention APRÈS le rapport d'impact + validation porteur (la gate).
export const WINTER_MILDNESS_CONVENTION = {
  id: "winter-mildness-v1",
  indicator: "NORTMm_seas_DJF",
  season: "DJF",
  direction: "higher_is_milder",
  scoring: "national_percentile",
  referencePeriod: "1976-2005",
  // Figé après le rapport d'impact (lot 4b) : le libellé identitaire « hivers parmi les plus doux du pays »
  // = le cinquième supérieur (20,5 % des communes). S'aligne sur le seuil `satisfied` de relative_position
  // (borne >= 0,80) : une commune identitairement « douce » est aussi satisfied au dossier.
  identityThreshold: 80,
} as const;

// Trivial mais grave les GARDES, la DIRECTION, l'ABSENCE DE REPLI (jamais un 50), la convention partagée.
export function winterMildnessScore(percentile: number | null | undefined): number | null {
  if (percentile == null || !Number.isFinite(percentile) || percentile < 0 || percentile > 100) return null;
  return percentile;
}
