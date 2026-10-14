// FUT-93 · UNE RELECTURE QUI NE S'AFFICHE PAS SE RATTRAPE, UNE FOIS.
//
// Constaté en production le 14/10/2026 (`docs/audits/2026-10-14-fut93-test-production.md`) : après un
// geste du lecteur (lien avec le bien, critère, projet…), la relecture du routeur arrive en entier,
// mais React ne la valide pas et l'écran garde l'ancien état. La course vit sur la frontière
// EXTÉRIEURE de `/rapport` (la section du bien), qu'on ne peut pas remonter à chaque rendu sans
// réafficher 7 s le dossier communal. On ne la résout pas : on la rattrape, comme Q1.
//
// ── LE SIGNAL ────────────────────────────────────────────────────────────────────────────────
// La section du bien porte un TÉMOIN (`TemoinDeRendu`) dont le jeton change à chaque rendu serveur, et
// qui note dans un effet, donc après validation par React, le jeton qu'il a reçu. Tant que le jeton
// validé est l'ancien, la relecture n'est pas affichée ; dès qu'il change (ou disparaît, la page ayant
// changé de forme), elle l'est. Aucun délai ne décide d'un succès.
//
// ── LA DÉCISION D'ÉCHEC ──────────────────────────────────────────────────────────────────────
// Au-delà du délai de Q1 (`DELAI_RELECTURE_MS`) sans nouveau jeton : un rechargement complet, un seul.
// La fin de la réponse du serveur n'avance jamais ce rechargement (un préchargement du même chemin s'en
// distingue mal) ; son ABSENCE le retarde, jusqu'au plafond : un serveur lent n'est pas un blocage.
import { DELAI_RELECTURE_MS } from "./etat-action.ts";

/**
 * Au-delà, même sans réponse reçue, on recharge : le lecteur a assez attendu. Plus de quatre fois le
 * rendu de la section du bien mesuré en production (7 à 8 s). Sur le banc, une relecture bloquée
 * peut aussi ne jamais TERMINER sa réponse : c'est ce plafond, et non le délai de Q1, qui la rattrape.
 */
export const PLAFOND_RELECTURE_MS = 30_000;

export type EtapeRelecture = "affichee" | "attendre" | "recharger";

export function etapeRelecture(o: {
  /** Le jeton du témoin au moment de la demande. */
  jetonAvant: string;
  /** Le dernier jeton validé à l'écran, `null` si le témoin a disparu. */
  jetonAffiche: string | null;
  /** Une réponse de relecture de cette page est-elle arrivée depuis la demande ? */
  reponseRecue: boolean;
  ecouleMs: number;
}): EtapeRelecture {
  if (o.jetonAffiche !== o.jetonAvant) return "affichee";
  if (o.ecouleMs < DELAI_RELECTURE_MS) return "attendre";
  if (!o.reponseRecue && o.ecouleMs < PLAFOND_RELECTURE_MS) return "attendre";
  return "recharger";
}

/** Une ressource chargée est-elle une relecture du routeur pour CETTE page ? */
export function estRelectureDeLaPage(url: string, initiateur: string, page: { origin: string; pathname: string }): boolean {
  if (initiateur !== "fetch") return false;
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  return u.origin === page.origin && u.pathname === page.pathname && u.searchParams.has("_rsc");
}

/**
 * CE QUI SURVIT AU RECHARGEMENT : l'adresse rechargée et la position de lecture, pour la rendre une
 * fois la section du bien arrivée (le rechargement la sert après plusieurs secondes : la restauration
 * du navigateur, faite plus tôt, tombe sur une page encore courte).
 *
 * La position est d'abord une ANCRE : l'élément identifié le plus proche de ce que lit le lecteur, et
 * sa hauteur à l'écran. La page rechargée affiche ce que la relecture n'avait pas affiché (un bandeau
 * au-dessus) : une position absolue ferait glisser le lecteur d'autant (102 à 173 px sur le banc).
 */
export type MemoireSecours = { chemin: string; y: number; le: number; ancre?: string; decalage?: number };
export const CLE_MEMOIRE_SECOURS = "futuree:relecture-secours";
export const DUREE_MEMOIRE_SECOURS_MS = 60_000;

export function lireMemoireSecours(brut: string | null, chemin: string, maintenant: number): MemoireSecours | null {
  if (!brut) return null;
  let m: unknown;
  try { m = JSON.parse(brut); } catch { return null; }
  if (!m || typeof m !== "object") return null;
  const { chemin: c, y, le } = m as Record<string, unknown>;
  if (c !== chemin || typeof y !== "number" || !Number.isFinite(y) || y < 0) return null;
  if (typeof le !== "number" || maintenant - le < 0 || maintenant - le > DUREE_MEMOIRE_SECOURS_MS) return null;
  const { ancre, decalage } = m as Record<string, unknown>;
  if (typeof ancre === "string" && ancre && typeof decalage === "number" && Number.isFinite(decalage)) {
    return { chemin: c, y, le, ancre, decalage };
  }
  return { chemin: c, y, le };
}

/**
 * QUELLE ANCRE : l'élément identifié qui COMMENCE dans l'écran, le plus haut ; à défaut, celui qui
 * commence juste au-dessus. Jamais un ancêtre qui englobe la lecture de loin : un bandeau inséré en
 * lui le décalerait (mesuré : la section du dossier, dont le haut était 1 115 px au-dessus de l'écran).
 */
export function choisirAncre(candidats: { id: string; haut: number }[], hauteurEcran: number): { ancre: string; decalage: number } | null {
  let dedans: { id: string; haut: number } | null = null;
  let dessus: { id: string; haut: number } | null = null;
  for (const c of candidats) {
    if (!c.id || !Number.isFinite(c.haut)) continue;
    if (c.haut >= 0 && c.haut < hauteurEcran) { if (!dedans || c.haut < dedans.haut) dedans = c; }
    else if (c.haut < 0) { if (!dessus || c.haut > dessus.haut) dessus = c; }
  }
  const choisi = dedans ?? dessus;
  return choisi ? { ancre: choisi.id, decalage: Math.round(choisi.haut) } : null;
}
