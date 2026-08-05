import type { VigieauSummary } from "@/lib/vigieau";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉCRAN DIT DES RESTRICTIONS D'EAU, et surtout ce qu'il refuse de dire.
//
// PURE, testable sous `node --test` : `vigieau.ts` est `server-only` et ne se charge pas hors Next,
// mais son TYPE s'importe (un `import type` est effacé à la compilation). Même procédé que
// `QuartierClimatData`, qui est un composant client.
//
// ── LA DISTINCTION QUE CE MODULE EXISTE POUR TENIR ───────────────────────────────────────────
// Trois états, pas deux :
//
//   • une restriction est en vigueur          → on la nomme ;
//   • le registre a répondu, rien en vigueur  → « aucune restriction » ;
//   • le registre n'a pas répondu             → « non disponible », JAMAIS « aucune ».
//
// Le troisième manquait. `getVigieauSummary` rendait, en cas de panne, un objet indistinguable
// d'une consultation réussie sans restriction, et l'écran annonçait « Aucune restriction en cours »
// alors que personne n'avait pu demander. Sur la donnée qui dit ce qui est INTERDIT en ce moment,
// c'était l'absence inventée la plus coûteuse du produit.
// ════════════════════════════════════════════════════════════════════════════════════════════

const NIVEAU_LABEL: Record<string, string> = {
  vigilance: "Vigilance",
  alerte: "Alerte",
  alerte_renforcee: "Alerte renforcée",
  crise: "Crise",
};

/**
 * La phrase affichée, et l'état qu'elle décrit.
 *
 * `etat` est rendu à côté du texte pour que l'appelant puisse traiter le cas indisponible
 * autrement qu'en lisant la chaîne : une décision qui dépend d'un libellé casse au premier
 * ajustement éditorial.
 */
export function libelleRestrictions(
  v: VigieauSummary | null | undefined,
): { texte: string; etat: "en_vigueur" | "aucune" | "indisponible" } {
  if (!v || v.status === "unavailable") {
    return { texte: "État des restrictions non disponible", etat: "indisponible" };
  }
  if (!v.maxLevel) {
    return { texte: "Aucune restriction en cours", etat: "aucune" };
  }
  // « Vigilance » est le niveau le plus bas de VigiEau : c'est de la sensibilisation, pas une
  // restriction d'usage. La nommer « restriction » contredirait le reste de la carte.
  if (v.maxLevel === "vigilance") {
    return { texte: "Vigilance sécheresse, sans restriction", etat: "en_vigueur" };
  }
  const niveau = (NIVEAU_LABEL[v.maxLevel] ?? v.maxLevel).toLowerCase();
  return { texte: `Restriction « ${niveau} » en cours`, etat: "en_vigueur" };
}
