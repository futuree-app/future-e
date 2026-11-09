// ════════════════════════════════════════════════════════════════════════════════════════════
// LE STATUT D'UNE COMMUNE DANS LE ZONAGE EN UNITÉS URBAINES DE L'INSEE (FUT-176). Lib PURE.
//
// La source (base des unités urbaines 2020, géographie au 01/01/2025, statut calculé sur la population
// 2017) donne à chaque commune un statut parmi quatre. Ce module les traduit, et RIEN DE PLUS :
//
//   C  ville-centre      commune centrale d'une agglomération de plusieurs communes
//   B  banlieue          autre commune d'une agglomération de plusieurs communes
//   I  ville isolée      agglomération d'UNE SEULE commune (Corte). « Isolée » est un terme technique :
//                        il ne dit rien de l'isolement vécu. On ne l'écrit jamais au lecteur.
//   H  hors unité urbaine  pas de zone de bâti continu (sans coupure de plus de 200 m) de 2 000 habitants
//                        (Bony). Ce n'est PAS une « ville isolée ».
//
// TROIS INTERDITS, tenus ici pour tout le produit :
//   1. Une donnée absente n'est pas un statut. Sans statut connu, le rôle est `inconnu` et aucun texte
//      n'est produit ; il n'est jamais « hors agglomération » par défaut (c'était le cas d'Orée d'Anjou).
//   2. Appartenir à une unité urbaine ne fait pas une « ville » : Mont-Dauphin (171 habitants) est en banlieue
//      de l'agglomération de Guillestre. Le mot « ville » exige un centre (ou une agglomération à elle seule)
//      ET 2 000 habitants dans la commune même (`peutDireVille`).
//   3. Un statut statistique ne dit rien des services, de l'animation ni de l'isolement. Aucun texte d'ici
//      n'en parle (« pôle », « structure la vie locale », « concentre les fonctions urbaines » : retirés).
// ════════════════════════════════════════════════════════════════════════════════════════════

export type StatutUniteUrbaine = "C" | "B" | "I" | "H";

/**
 * Le rôle lu par l'écran. `dans_agglomeration` : la commune appartient à une unité urbaine dont on ne connaît
 * pas le statut (snapshot ancien, index d'avant FUT-176). `inconnu` : on ne sait rien, on ne dit rien.
 */
export type RoleUrbain = "ville_centre" | "banlieue" | "ville_isolee" | "hors_uu" | "dans_agglomeration" | "inconnu";

/** Les rôles d'avant FUT-176, encore lisibles dans un snapshot ou une synthèse en cache. */
export type RoleUrbainAncien = "isolee" | "pole" | "agglo";

export const ROLES_URBAINS: readonly RoleUrbain[] = [
  "ville_centre", "banlieue", "ville_isolee", "hors_uu", "dans_agglomeration", "inconnu",
];

/** Le seuil Insee d'une unité urbaine, réutilisé pour le mot « ville » (cf. interdit 2). */
export const SEUIL_HABITANTS_VILLE = 2_000;

export function statutUniteUrbaine(v: unknown): StatutUniteUrbaine | null {
  return v === "C" || v === "B" || v === "I" || v === "H" ? v : null;
}

/**
 * Le rôle d'une commune, depuis son code d'unité urbaine et son statut. Une INCOHÉRENCE entre les deux (statut
 * H avec un code d'unité urbaine, statut urbain sans code) ne se tranche pas : `inconnu`.
 */
export function roleUrbain(uu: string | null | undefined, statut: unknown): RoleUrbain {
  const s = statutUniteUrbaine(statut);
  const code = typeof uu === "string" && uu.trim() !== "" ? uu : null;
  if (s == null) return code ? "dans_agglomeration" : "inconnu";
  if (s === "H") return code ? "inconnu" : "hors_uu";
  if (!code) return "inconnu";
  return s === "C" ? "ville_centre" : s === "B" ? "banlieue" : "ville_isolee";
}

/**
 * Un rôle d'avant FUT-176 relu sans lui faire dire plus qu'il ne savait. « isolee » valait « pas de code
 * d'unité urbaine », ce qui mêlait hors unité urbaine et donnée absente : il devient `inconnu`. « pole »
 * (la commune la plus peuplée de son unité urbaine, ville isolée comprise) et « agglo » deviennent
 * `dans_agglomeration` : ils prouvaient l'appartenance, pas le statut.
 */
export function normaliserRoleUrbain(role: unknown): RoleUrbain {
  if (typeof role === "string" && (ROLES_URBAINS as readonly string[]).includes(role)) return role as RoleUrbain;
  if (role === "pole" || role === "agglo") return "dans_agglomeration";
  return "inconnu";
}

/** « Ville » n'est légitime que pour un centre ou une agglomération à elle seule, d'au moins 2 000 habitants. */
export function peutDireVille(role: RoleUrbain, populationCommune: number | null | undefined): boolean {
  return (role === "ville_centre" || role === "ville_isolee")
    && populationCommune != null && Number.isFinite(populationCommune) && populationCommune >= SEUIL_HABITANTS_VILLE;
}

export function appartientAgglomeration(role: RoleUrbain): boolean {
  return role === "ville_centre" || role === "banlieue" || role === "ville_isolee" || role === "dans_agglomeration";
}
