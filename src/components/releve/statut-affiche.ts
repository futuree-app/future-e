// FUT-126 · LA PRIORITÉ ET LE CONSTAT, DISTINGUÉS. Logique pure, testée (`finitions-releve.test.ts`, C).
//
// Sur un écart, le titre de la carte est la priorité du lecteur (« Une ville à taille humaine ») et l'état
// est ce que futur•e a constaté (« Une grande agglomération ») : côte à côte, la recette les a lus comme
// deux affirmations du même ordre. L'état d'un écart se préfixe donc de « Constat : ». Le texte du moteur
// n'est pas réécrit ; seule l'initiale passe en minuscule après les deux-points, sauf sur un sigle (« DPE … »).
import type { EntreeLue } from "./lecture-dossier.ts";

export function statutAffiche(e: Pick<EntreeLue, "nature" | "statut">): string {
  const st = e.statut ?? "";
  if (e.nature !== "mismatch" || !st) return st;
  const deuxieme = st.charAt(1);
  const sigle = deuxieme !== deuxieme.toLowerCase();
  return `Constat : ${sigle ? st : st.charAt(0).toLowerCase() + st.slice(1)}`;
}
