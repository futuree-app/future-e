// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DIAGNOSTICS DU MÊME BÂTIMENT, VUS AVANT ACHAT (FUT-143, 26/10/2026).
//
// LE DÉFAUT. Villeurbanne, 2 rue des Alliés : la qualification disait « aucun diagnostic à cette adresse »,
// puis en déduisait que le dossier ne pourrait pas qualifier la performance du logement. Le dossier payé
// proposait ensuite 18 diagnostics de logements enregistrés aux autres adresses du même bâtiment RNB
// (FUT-80). La phrase était vraie à l'adresse et fausse pour le dossier.
//
// LA MESURE QUI AUTORISE CETTE SONDE (`scripts/fut143/mesure-sonde-batiment.mjs`, 67 adresses, sans
// cache) : RNB puis ADEME par `id_rnb` ajoutent 159 ms en médiane, 195 ms au 95e centile, aucun échec. Le
// dossier fait exactement ces appels à son ouverture, avec le même cache d'une journée.
//
// CE QU'ELLE ÉTABLIT, ET RIEN DE PLUS. Le dossier ne cherche au bâtiment que si le référentiel en désigne
// UN seul (`georisques-logement`) ; la sonde suit la même règle, sinon elle annoncerait une matière que le
// dossier ne montrera pas. Seuls les diagnostics DE LOGEMENT comptent : un DPE d'immeuble ne se retient
// jamais pour un appartement (FUT-74). Ce sont des CANDIDATS : rien n'est attribué ni promis au logement.
//
// ELLE NE BLOQUE RIEN. Bornée par un délai ; au-delà, ou sur toute erreur, l'état est `non_verifie` et la
// qualification rend sa réponse comme avant. Une panne ne devient jamais une absence.
//
// Pur (les sources sont passées en paramètre), testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { IdentiteBatiment } from "./batiment-rnb.ts";
import type { DpeRecord } from "./dpe-attribution.ts";
import { grainDpe } from "./dpe-grain.ts";

/**
 * - `candidats` : au moins un diagnostic de logement est enregistré à une autre adresse du bâtiment ;
 * - `aucun` : le bâtiment est identifié, les deux jeux ADEME ont répondu en entier (non tronqués), aucun
 *   diagnostic de logement ;
 * - `sans_objet` : le référentiel ne désigne pas un bâtiment unique, le dossier ne cherchera pas ;
 * - `non_verifie` : une source n'a pas répondu, ou trop tard. On ne sait pas.
 */
export type MemeBatimentState = "candidats" | "aucun" | "sans_objet" | "non_verifie";

/** La forme rendue par `lookupDpeMemeBatiment` (dpe.ts). */
export type RechercheMemeBatiment = {
  status: "present" | "absent" | "unavailable";
  candidates: DpeRecord[];
  tronque: boolean;
};

/** Le délai au-delà duquel la qualification n'attend plus : dix fois le 95e centile mesuré. */
export const DELAI_SONDE_MS = 2_000;

export function etatMemeBatiment(
  identite: IdentiteBatiment | undefined,
  recherche: RechercheMemeBatiment | undefined,
): MemeBatimentState {
  if (!identite || identite.statut === "indisponible") return "non_verifie";
  if (identite.statut !== "confirme") return "sans_objet";
  if (!recherche) return "non_verifie";
  // Un candidat LU est établi, même si l'autre jeu est tombé ou si la page est tronquée.
  if (recherche.candidates.some((c) => grainDpe(c) === "logement")) return "candidats";
  // L'absence ne s'établit que sur une liste COMPLÈTE : une panne ou une page tronquée ne disent pas ce que
  // contient la partie non lue (revue du 27/10/2026 : immeuble seul lu, liste tronquée → « aucun »).
  return recherche.status === "unavailable" || recherche.tronque ? "non_verifie" : "aucun";
}

/**
 * La sonde elle-même. `identite` est une promesse déjà lancée : la route la démarre en même temps que la
 * sonde exacte et le cadastre, et ne paie ici que la recherche ADEME, quand elle a lieu.
 */
export async function sonderMemeBatiment({
  identite, banId, chercher, delaiMs = DELAI_SONDE_MS,
}: {
  identite: Promise<IdentiteBatiment>;
  banId: string;
  chercher: (rnbId: string, banId: string) => Promise<RechercheMemeBatiment>;
  delaiMs?: number;
}): Promise<MemeBatimentState> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<MemeBatimentState>((resolve) => {
    minuterie = setTimeout(() => resolve("non_verifie"), delaiMs);
  });
  const sonde = (async (): Promise<MemeBatimentState> => {
    try {
      const id = await identite;
      const recherche = id.statut === "confirme" ? await chercher(id.batiment.rnb_id, banId) : undefined;
      return etatMemeBatiment(id, recherche);
    } catch {
      return "non_verifie";
    }
  })();
  try {
    return await Promise.race([sonde, delai]);
  } finally {
    clearTimeout(minuterie);
  }
}
