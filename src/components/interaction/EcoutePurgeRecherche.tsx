"use client";

import { useEffect } from "react";
import { purgeRechercheConnue, ecouterPurgeRecherche } from "./purge-recherche-navigateur";

// FUT-27 : le sessionStorage est propre à chaque onglet, la déconnexion n'efface que celui de son onglet.
// Monté une fois par page (layout racine), ce composant aligne l'onglet sur la dernière purge du navigateur :
// au montage (onglet rechargé ou rouvert après avoir manqué la purge) et à chaque signal (autre onglet, retour
// arrière, réveil). `purgeRechercheConnue` applique la purge différée puis cet alignement. Sans lui, le
// questionnaire d'un compte parti serait poussé dans le profil du compte suivant connecté sur cet onglet.
// Ne rend rien.
export function EcoutePurgeRecherche() {
  useEffect(() => {
    purgeRechercheConnue();
    return ecouterPurgeRecherche(() => {
      purgeRechercheConnue();
    });
  }, []);
  return null;
}
