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
  CLE_PACK_LABEL, CLE_PACK_PARSED, CLE_PAYWALL_LABELS, PURGE_RECHERCHE_KEY, SESSION_OUVIVRE_KEY, lirePurgeRecherche,
} from "./comparateur/session-ou-vivre.ts";
import { WIZARD_STORAGE_KEY } from "../components/wizard/types.ts";

// La commune choisie sur l'accueil (restaurée au retour arrière).
export const CLE_LANDING_COMMUNE = "futuree:landing-commune";

export const CLES_RECHERCHE_NAVIGATEUR = [SESSION_OUVIVRE_KEY, CLE_PACK_PARSED, CLE_PACK_LABEL, CLE_PAYWALL_LABELS] as const;
export const CLES_RECHERCHE_ONGLET = [WIZARD_STORAGE_KEY, CLE_LANDING_COMMUNE] as const;

// Prévient les composants du MÊME document : l'événement `storage` ne parvient qu'aux autres onglets.
export const EVENEMENT_PURGE_RECHERCHE = "futuree:recherche-purgee";

type Stockage = Pick<Storage, "setItem" | "removeItem">;

// La dernière purge que CET onglet a appliquée à son sessionStorage. Un onglet qui a manqué le signal (fermé
// au moment de la déconnexion, endormi, rechargé après coup) se compare à la date du navigateur à sa première
// lecture, et efface ses clés s'il est en retard. Une saisie faite après la purge garde la marque à jour.
export const PURGE_VUE_ONGLET_KEY = "futuree:recherche:purge-vue-onglet";

const sansEchec = (f: () => void) => {
  try { f(); } catch { /* stockage indisponible : rien à effacer */ }
};

/**
 * Efface les clés de cet onglet (sessionStorage) et, si `purge` est donnée, note que l'onglet l'a appliquée.
 * Appelé à la déconnexion dans son onglet, et par `alignerOngletSurPurge` dans les autres.
 */
export function purgerOnglet(onglet: Stockage | null, purge: number | null = null): void {
  if (!onglet) return;
  for (const k of CLES_RECHERCHE_ONGLET) sansEchec(() => onglet.removeItem(k));
  if (purge != null) sansEchec(() => onglet.setItem(PURGE_VUE_ONGLET_KEY, String(purge)));
}

/**
 * Met cet onglet à jour de la dernière purge du navigateur : s'il ne l'a pas encore appliquée, il efface ses
 * clés avant qu'on les lise. Vrai s'il a effacé. Sans purge connue, rien ne change (anonyme → connexion).
 */
export function alignerOngletSurPurge(
  local: Pick<Storage, "getItem"> | null,
  onglet: (Stockage & Pick<Storage, "getItem">) | null,
): boolean {
  if (!local || !onglet) return false;
  let purge: number | null;
  let vue: number | null;
  try {
    purge = lirePurgeRecherche(local.getItem(PURGE_RECHERCHE_KEY));
    vue = lirePurgeRecherche(onglet.getItem(PURGE_VUE_ONGLET_KEY));
  } catch {
    return false;
  }
  if (purge == null || (vue != null && vue >= purge)) return false;
  purgerOnglet(onglet, purge);
  return true;
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
  purgerOnglet(onglet, maintenant);
}

// ── PURGE DIFFÉRÉE : quand le navigateur n'a pas pu purger lui-même (FUT-27) ──────────────────────────
//
// Le formulaire de déconnexion purge dans son `onSubmit`, qui n'existe qu'une fois la page hydratée. Cliqué
// avant (page encore en chargement) ou sans JavaScript, il part en simple POST : la Server Action ferme la
// session, et rien n'a été effacé. Le formulaire porte donc un champ qui dit si le navigateur a purgé. S'il
// ne l'a pas fait, la Server Action dépose un cookie lisible par la page. La première page qui exécute du
// JavaScript le consomme avant toute lecture des recherches (`purgeRechercheConnue` et les lecteurs directs).
// Sans JavaScript, rien ne peut lire ces stockages : la purge attend la première page qui le peut.
export const CHAMP_PURGE = "purge-recherche";
export const PURGE_PAR_LE_NAVIGATEUR = "navigateur";
export const COOKIE_PURGE_DIFFEREE = "futuree-purge-recherche";
// Le jeton de la dernière purge différée appliquée : si le cookie ne s'efface pas, il ne purge qu'une fois,
// et ne revient pas effacer les recherches lancées depuis.
export const PURGE_DIFFEREE_VUE_KEY = "futuree:recherche:purge-differee-vue";

/** Vrai seulement si le formulaire dit avoir purgé : un champ absent ou inconnu demande la purge différée. */
export function purgeFaiteParLeNavigateur(valeur: unknown): boolean {
  return valeur === PURGE_PAR_LE_NAVIGATEUR;
}

/** Le jeton du cookie de purge différée, ou `null`. */
export function jetonPurgeDifferee(cookies: string): string | null {
  for (const morceau of cookies.split(";")) {
    const [nom, ...reste] = morceau.trim().split("=");
    if (nom !== COOKIE_PURGE_DIFFEREE) continue;
    const valeur = reste.join("=");
    return /^[a-z0-9]{1,64}$/i.test(valeur) ? valeur : null;
  }
  return null;
}

/** Applique une purge différée pas encore vue. Vrai si elle a purgé. */
export function appliquerPurgeDiffereeSur(
  cookies: string,
  local: (Stockage & Pick<Storage, "getItem">) | null,
  onglet: Stockage | null,
  maintenant: number,
): boolean {
  const jeton = jetonPurgeDifferee(cookies);
  if (!jeton || !local) return false;
  let vue: string | null = null;
  try { vue = local.getItem(PURGE_DIFFEREE_VUE_KEY); } catch { return false; }
  if (vue === jeton) return false;
  sansEchec(() => local.setItem(PURGE_DIFFEREE_VUE_KEY, jeton));
  purgerRecherchesTemporaires(local, onglet, maintenant);
  return true;
}
