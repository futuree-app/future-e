// LES PHRASES GASPAR DES PAGES PUBLIQUES /inondation/[insee_code] ET /chaleur/[insee_code].
//
// Pur, sans réseau : les deux pages en tirent leurs phrases, et les tests les vérifient telles qu'elles
// s'affichent.

/**
 * FUT-161 · « a déjà été reconnue 17 fois ». La phrase était écrite en JSX, le nombre en expression suivi
 * du texte : le rendu compilé perdait l'espace (« 17fois », en production le 28/10/2026). Elle est donc
 * composée ici, en une seule chaîne, avec une espace insécable : le nombre ne se sépare jamais de « fois »,
 * même en fin de ligne sur mobile.
 */
export function phraseReconnaissancesCatnat(n: number, communeName: string, villeCatnat: string | null): string {
  const sujet = villeCatnat
    ? `À l'échelle de ${villeCatnat} (GASPAR ne publie pas les arrondissements), la ville`
    : communeName;
  return `${sujet} a déjà été reconnue ${n}\u00a0fois en état de catastrophe naturelle`;
}

/**
 * FUT-159 · TROIS ÉTATS POUR CHAQUE BLOC GASPAR, jamais deux. La page reçoit `null` quand la lecture a ÉCHOUÉ
 * (la lib lève, la page attrape), et un résumé quand GASPAR a répondu, même vide. Jusqu'ici les deux cas
 * retiraient le bloc : pendant l'incident du 28/10/2026, une commune exposée se lisait comme une commune
 * sans risque ni historique.
 *
 *   - `indisponible` : la source n'a pas répondu ; la page le dit, à la place du bloc ;
 *   - `vide`         : la source a répondu, sans fait pour ce bloc ; le bloc reste absent, comme avant ;
 *   - `disponible`   : le bloc s'affiche.
 */
export type EtatBlocGaspar = "indisponible" | "vide" | "disponible";

export function etatBlocGaspar(lecture: unknown, nombre: number): EtatBlocGaspar {
  if (lecture == null) return "indisponible";
  return nombre > 0 ? "disponible" : "vide";
}

/**
 * Le libellé et la phrase de l'état `indisponible`. Ils ne disent rien du risque, ni dans un sens ni dans l'autre.
 * La phrase date la panne de la dernière génération de la page : le rendu est gardé 24 h (ISR), elle peut
 * donc s'afficher bien après le moment où GASPAR n'a pas répondu.
 */
export const GASPAR_INDISPONIBLE = {
  libelle: "Donnée temporairement indisponible",
  phrase: (objet: string) =>
    `Lors de la dernière mise à jour de cette page, la base GASPAR (Géorisques) n'a pas répondu : ${objet} n'ont pas pu être lus. Rien n'en est déduit ici. Vous pouvez les consulter sur georisques.gouv.fr.`,
} as const;
