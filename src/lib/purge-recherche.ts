// PURGE DES RECHERCHES TEMPORAIRES À LA DÉCONNEXION EXPLICITE (FUT-27). Lib PURE : le stockage est passé
// en argument, le navigateur l'applique (components/interaction/purge-recherche-navigateur.ts).
//
// Ce qui est effacé : ce que le visiteur a cherché sans compte et qui survivrait à son départ.
//   · localStorage, partagé par tous les onglets : la session « Où vivre » et ses trois copies (Pack, paywall).
//   · sessionStorage, propre à chaque onglet : les réponses du questionnaire (poussées dans le profil du
//     PROCHAIN compte connecté sur cet onglet, sinon) et la commune choisie sur l'accueil.
// Ce qui ne l'est jamais : le thème, le consentement, l'horizon, le compteur de questions de l'accueil, et
// tout ce qui vit côté serveur (Projet, dossiers, factures, droits). Jamais de `clear()`.
//
// La purge ne se fait QU'à la déconnexion : à la connexion ou à l'inscription, la recherche faite sans compte
// doit rester là pour être reprise (cas E).
import {
  CLE_PACK_LABEL, CLE_PACK_PARSED, CLE_PAYWALL_LABELS, PURGE_RECHERCHE_KEY, SESSION_OUVIVRE_KEY,
} from "./comparateur/session-ou-vivre.ts";
import { WIZARD_STORAGE_KEY } from "../components/wizard/types.ts";

// La commune choisie sur l'accueil (restaurée au retour arrière).
export const CLE_LANDING_COMMUNE = "futuree:landing-commune";

export const CLES_RECHERCHE_NAVIGATEUR = [SESSION_OUVIVRE_KEY, CLE_PACK_PARSED, CLE_PACK_LABEL, CLE_PAYWALL_LABELS] as const;
export const CLES_RECHERCHE_ONGLET = [WIZARD_STORAGE_KEY, CLE_LANDING_COMMUNE] as const;

// Prévient les composants du MÊME document : l'événement `storage` ne parvient qu'aux autres onglets.
export const EVENEMENT_PURGE_RECHERCHE = "futuree:recherche-purgee";

type Stockage = Pick<Storage, "setItem" | "removeItem">;

const sansEchec = (f: () => void) => {
  try { f(); } catch { /* stockage indisponible : rien à effacer */ }
};

/** Efface les clés de cet onglet (sessionStorage). Appelé ici et, à la purge, dans chaque autre onglet. */
export function purgerOnglet(onglet: Stockage | null): void {
  if (!onglet) return;
  for (const k of CLES_RECHERCHE_ONGLET) sansEchec(() => onglet.removeItem(k));
}

/**
 * La purge elle-même. La date est écrite AVANT l'effacement : un onglet qui écrirait au même moment lit déjà
 * la barrière et renonce, au lieu de recréer la recherche juste après sa suppression.
 */
export function purgerRecherchesTemporaires(local: Stockage | null, onglet: Stockage | null, maintenant: number): void {
  if (local) {
    sansEchec(() => local.setItem(PURGE_RECHERCHE_KEY, String(maintenant)));
    for (const k of CLES_RECHERCHE_NAVIGATEUR) sansEchec(() => local.removeItem(k));
  }
  purgerOnglet(onglet);
}
