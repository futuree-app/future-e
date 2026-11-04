import type { Face3Snapshot } from "./logement-autour-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA REPRISE CÔTÉ PAGE, BORNÉE (04/11/2026).
//
// Le client redemandait UNE fois, 4,5 s après un voisinage `pending`, puis plus jamais. Quand la
// cartographie n'était pas arrivée à ce moment-là, l'écran affichait « en cours de récupération »
// sans fin, alors que plus rien ne la récupérait sous ses yeux.
//
// Désormais : quelques reprises, espacées de plus en plus, puis l'écran dit franchement que la
// source n'a pas répondu (le texte d'indisponibilité existant, jamais une absence d'infrastructure
// ou d'espace vert) et propose de vérifier à nouveau. Le serveur, lui, ne sollicite pas Overpass à
// chaque reprise : un échec récent est mémorisé dans le cache de tuile (cf. `logement-osm.ts`).
//
// Délais : une tuile froide se remplit d'ordinaire en moins de 10 s ; la dernière reprise tombe
// environ 35 s après l'ouverture, au-delà de ce qu'une recherche Overpass saine demande. Ce sont
// des conventions, pas des mesures.
// ════════════════════════════════════════════════════════════════════════════════════════════
export const DELAIS_REPRISE_OSM_MS = [4_500, 10_000, 20_000] as const;

function osmEnAttente(s: Face3Snapshot): boolean {
  return s.sourceStatus.osmInfrastructure === "pending" || s.sourceStatus.osmGreenSpaces === "pending";
}

/** Le délai avant la prochaine reprise, ou `null` s'il n'y en a plus à faire. */
export function prochaineRepriseOsm(s: Face3Snapshot | null, tentatives: number): number | null {
  if (!s || !osmEnAttente(s)) return null;
  return DELAIS_REPRISE_OSM_MS[tentatives] ?? null;
}

/**
 * Le voisinage à AFFICHER. Reprises épuisées et cartographie toujours en attente : le volet en
 * attente s'affiche comme indisponible. Rien n'est écrit, rien n'est inventé : seul le statut
 * affiché change, et la donnée vide reste lue comme « non établie ».
 */
export function snapshotAffiche(s: Face3Snapshot | null, tentatives: number): Face3Snapshot | null {
  if (!s || !osmEnAttente(s) || tentatives < DELAIS_REPRISE_OSM_MS.length) return s;
  const bascule = (v: "complete" | "pending" | "failed") => (v === "pending" ? "failed" : v);
  return {
    ...s,
    sourceStatus: {
      ...s.sourceStatus,
      osmInfrastructure: bascule(s.sourceStatus.osmInfrastructure),
      osmGreenSpaces: bascule(s.sourceStatus.osmGreenSpaces),
    },
  };
}
