// LE SCHÉMA DES CONTRAINTES DURES. Lib PURE et NEUTRE : ni server-only, ni index, ni moteur.
//
// Il vivait dans comparateur-vie.ts. Le noyau canonique (hard-constraints.ts) en a besoin, et il ne peut
// pas dépendre, fût-ce en type, du module server-only de 3 000 lignes qu'il remplace : la direction
// serait mauvaise (noyau -> moteur), et le noyau en deviendrait l'otage. comparateur-vie le RÉEXPORTE,
// pour qu'aucun appelant existant ne change.
import type { ZoneAnchor, ZoneMatch, ZoneStrength } from "./geo-zones.ts";
export type { ZoneAnchor, ZoneMatch, ZoneStrength };

export type HardConstraints = {
  departements?: string[];
  // Ancres géographiques avec gradient de force (cf. geo-zones.ts). Chaque ancre
  // porte une force : hard (filtre, définit le périmètre, ancres dures
  // intersectées), preferred / inspiration (bonus de score, sans exclusion). Les
  // régions administratives sont des jetons de zone comme les autres (plus de champ
  // region séparé). excludeZones = ancres négatives, dures en V1. Le parse n'émet
  // que des jetons d'une liste fermée ; le moteur détient la table jeton → départements.
  zones?: ZoneAnchor[];
  // FUT-5. Comment se composent le périmètre dur : les ancres `hard` de `zones` ET la liste
  // `departements`. Absent ou "all" = INTERSECTION, le comportement historique (« le Sud-Ouest, près des
  // Pyrénées » ; « la Bretagne » + « le 35 »). "any" = UNION, quand le lecteur a dit « ou » (« la
  // Bretagne ou la Loire-Atlantique »). Sans ce champ, deux ancres dures d'un « ou » devenaient une
  // intersection vide.
  zonesMatch?: ZoneMatch | null;
  excludeZones?: string[];
  // Montagne générique = critère d'ALTITUDE propre à la commune (distinct des
  // massifs nommés, qui sont des zones). Même gradient de force : hard = filtre
  // (altitude ≥ ~600 m), preferred / inspiration = bonus proportionnel à la
  // montagnosité.
  montagne?: { strength: ZoneStrength } | null;
  // « Proche d'une montagne » = PROXIMITÉ au relief (massif à portée), distincte de
  // l'altitude propre (montagne). Grenoble (214 m) est proche d'une montagne sans
  // être en altitude. Même gradient : hard = filtre (relief_proximite ≥ 50),
  // preferred / inspiration = bonus proportionnel. Adossé à relief_proximite (index).
  reliefProche?: { strength: ZoneStrength } | null;
  nearSea?: { active: boolean; maxKm?: number | null };
  excludeSea?: boolean;
  // « Près de {lieu} » : le lieu n'est PAS forcément une commune (une gare, un hôpital, un campus). Deux
  // métriques, et elles ne se convertissent pas l'une dans l'autre : une distance à vol d'oiseau n'établit
  // pas un temps de trajet. Le mode est un PARAMÈTRE de l'évaluation, pas une décoration : sans lui, « à
  // 30 minutes » ne veut rien dire (à pied ou en voiture, ce n'est pas le même territoire).
  nearPlace?: {
    label: string;
    maxKm?: number | null;
    maxMinutes?: number | null;
    mode?: "car" | "walk" | "bike" | null;
  } | null;
  communeSize?: { min?: number | null; max?: number | null } | null;
  // « Quitter {ville} » : exclut l'unité urbaine de la ville (le moteur résout label -> UU).
  excludePlace?: { label: string }[];
  // « Plus petit / grand que {ville} » : le moteur résout label -> population d'agglomération de
  // référence (cf. chantier C : la taille se lit sur l'unité urbaine).
  sizeRelativeTo?: { label: string; direction: "smaller" | "larger" } | null;
};

/**
 * LES DÉPARTEMENTS REJOIGNENT-ILS LE PÉRIMÈTRE DES ZONES ? (FUT-5)
 *
 * Seulement en « au moins une » (`zonesMatch: "any"`) ET quand une ancre DURE existe à côté : « la
 * Bretagne ou la Loire-Atlantique » est un seul périmètre, et le tester en deux familles séparées
 * (zones ET départements) reviendrait à l'intersection que le lecteur n'a pas demandée. Sans ancre dure,
 * la liste de départements est déjà une union, et reste ce qu'elle était.
 *
 * Une seule définition, empruntée par l'hydratation (ce que le moteur teste) et par la vue du projet
 * (ce que le dossier déclare et nomme) : si les deux divergeaient, le dossier attendrait une contrainte
 * « départements » que le moteur n'évalue plus.
 */
export function departementsDansLesZones(hc: HardConstraints | null | undefined): boolean {
  return (
    hc?.zonesMatch === "any" &&
    (hc.departements?.length ?? 0) > 0 &&
    (hc.zones ?? []).some((z) => z?.strength === "hard")
  );
}
