// L'ASSEMBLEUR DE LA RÉPONSE « AUTOUR DE L'ADRESSE ».
//
// POURQUOI IL EXISTE. La route a trois chemins qui rendent le bloc : snapshot recalculé, snapshot
// figé relu en base, et rehydratation de page. Le 29/07, l'équipement automobile n'était produit que
// par le premier : cliquer « J'y vis » empruntait le chemin du snapshot figé (« la posture peut avoir
// changé sans invalider le calcul ») et la donnée disparaissait de l'écran.
//
// Corriger chaque `return` un par un est une discipline, pas une architecture — le prochain
// enrichissement referait le même trou. La règle est donc structurelle :
//
//   AUCUN chemin ne renvoie le snapshot directement ; tous passent par ici.
//
// DEUX FAMILLES DE DONNÉES, ET C'EST LE FOND DU SUJET :
//
//   • LE SNAPSHOT est historique. Il fige ce que les sources disaient au moment de l'analyse (BPE,
//     OSM, îlot de chaleur), et c'est voulu : le dossier doit rester ce qu'il était.
//   • LES ENRICHISSEMENTS sont relus au rendu. Ils viennent d'artefacts versionnés régénérés à
//     chaque millésime ; les figer ferait cohabiter des dossiers annonçant des millésimes
//     différents sans le dire.
//
// CONSÉQUENCE ASSUMÉE : un dossier ouvert six mois après sa génération mêle deux temporalités. Ce
// n'est acceptable QUE parce que chaque enrichissement affiche sa source et son millésime là où il
// s'affiche (« Insee, recensement 2022 »). Un enrichissement muet sur sa date n'a rien à faire ici.

import type { Face3Snapshot } from "@/lib/logement-autour-types";
import { getCarOwnershipAtPoint } from "@/lib/server/iris-logement-store";
import type { CarOwnership } from "@/lib/iris-logement";

export type AutourResponse = {
  snapshot: Face3Snapshot;
  /** Relu au rendu, jamais figé dans le snapshot. Cf. les deux familles ci-dessus. */
  carOwnership: CarOwnership;
};

/**
 * Complète un snapshot — d'où qu'il vienne — des lectures vivantes du secteur.
 *
 * Ne lève jamais : un enrichissement en panne rend `unknown`, et le bloc correspondant disparaît.
 * Le dossier reste lisible sans lui.
 */
export async function buildAutourResponse(input: {
  snapshot: Face3Snapshot;
  lat: number;
  lon: number;
  insee: string | null;
}): Promise<AutourResponse> {
  const carOwnership = await getCarOwnershipAtPoint(input.lat, input.lon, input.insee).catch(
    () => ({ kind: "unknown" as const }),
  );
  return { snapshot: input.snapshot, carOwnership };
}
