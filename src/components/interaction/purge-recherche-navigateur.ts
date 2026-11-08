// La purge des recherches temporaires, appliquée au navigateur (FUT-27). La règle vit dans
// lib/purge-recherche.ts ; ce module ne fait que lui donner le stockage et prévenir les écrans ouverts.
//
// Trois façons d'apprendre la purge, une seule fonction pour s'y abonner :
//   · un autre onglet : l'événement `storage` sur la clé de purge ;
//   · le même document : un événement maison (le `storage` n'y parvient pas) ;
//   · une page rendue par le cache du retour arrière (`pageshow` persisté), ou un onglet qui redevient
//     visible : il a pu dormir pendant la purge, il relit la date.
import { useEffect, useRef } from "react";
import { anterieurALaPurge, PURGE_RECHERCHE_KEY, lirePurgeRecherche } from "@/lib/comparateur/session-ou-vivre";
import { EVENEMENT_PURGE_RECHERCHE, purgerRecherchesTemporaires } from "@/lib/purge-recherche";

function stockage(type: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return window[type];
  } catch {
    return null;
  }
}

/** Déconnexion explicite : efface les recherches temporaires et prévient tous les écrans ouverts. */
export function purgerRecherchesDuNavigateur(): void {
  if (typeof window === "undefined") return;
  purgerRecherchesTemporaires(stockage("localStorage"), stockage("sessionStorage"), Date.now());
  try {
    window.dispatchEvent(new Event(EVENEMENT_PURGE_RECHERCHE));
  } catch {
    // sans effet : les autres onglets l'apprennent par `storage`
  }
}

/** La date de la dernière purge connue de ce navigateur, ou `null`. */
export function purgeRechercheConnue(): number | null {
  try {
    return lirePurgeRecherche(window.localStorage.getItem(PURGE_RECHERCHE_KEY));
  } catch {
    return null;
  }
}

/**
 * Appelle `rappel` quand une purge a PEUT-ÊTRE eu lieu. Le rappel compare lui-même la date de ce qu'il tient
 * en mémoire à `purgeRechercheConnue()` : il n'efface que ce qui date d'avant la purge, jamais une recherche
 * lancée depuis.
 */
export function ecouterPurgeRecherche(rappel: () => void): () => void {
  const surStockage = (e: StorageEvent) => {
    if (e.key === PURGE_RECHERCHE_KEY) rappel();
  };
  const surRetour = (e: PageTransitionEvent) => {
    if (e.persisted) rappel();
  };
  const surVisible = () => {
    if (document.visibilityState === "visible") rappel();
  };
  window.addEventListener("storage", surStockage);
  window.addEventListener(EVENEMENT_PURGE_RECHERCHE, rappel);
  window.addEventListener("pageshow", surRetour);
  document.addEventListener("visibilitychange", surVisible);
  return () => {
    window.removeEventListener("storage", surStockage);
    window.removeEventListener(EVENEMENT_PURGE_RECHERCHE, rappel);
    window.removeEventListener("pageshow", surRetour);
    document.removeEventListener("visibilitychange", surVisible);
  };
}

/**
 * Pour un écran qui tient une recherche en mémoire : `oublier` est appelé si cette mémoire date d'avant une
 * purge. Rend la date d'origine de la mémoire, que l'écran avance quand il lance une NOUVELLE recherche
 * (`origine.current = Date.now()`) et qu'il compare avant toute écriture (`peutEcrireRecherche`).
 */
export function useOubliALaPurge(oublier: () => void) {
  const origine = useRef(0);
  const rappel = useRef(oublier);
  useEffect(() => {
    rappel.current = oublier;
  });
  useEffect(() => {
    origine.current = Date.now();
    return ecouterPurgeRecherche(() => {
      if (!anterieurALaPurge(origine.current, purgeRechercheConnue())) return;
      origine.current = Date.now();
      rappel.current();
    });
  }, []);
  return origine;
}

/** Faux si la mémoire de l'écran date d'avant la dernière purge : écrire recréerait la recherche effacée. */
export function peutEcrireRecherche(origine: number): boolean {
  return !anterieurALaPurge(origine, purgeRechercheConnue());
}
