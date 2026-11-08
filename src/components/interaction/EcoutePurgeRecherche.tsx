"use client";

import { useEffect } from "react";
import { purgeRechercheConnue, ecouterPurgeRecherche } from "./purge-recherche-navigateur";
import { purgerOnglet } from "@/lib/purge-recherche";

// FUT-27 : le sessionStorage est propre à chaque onglet, la déconnexion n'efface que celui de son onglet.
// Monté une fois par page (layout racine), ce composant efface aussi celui des AUTRES onglets dès qu'ils
// apprennent une purge qu'ils n'avaient pas encore vue. Sans lui, le questionnaire d'un compte parti serait
// poussé dans le profil du compte suivant connecté sur cet onglet. Ne rend rien.
export function EcoutePurgeRecherche() {
  useEffect(() => {
    // Lire la date applique aussi une purge différée (déconnexion envoyée avant l'hydratation, ou sans JS).
    let vue = purgeRechercheConnue();
    return ecouterPurgeRecherche(() => {
      const purge = purgeRechercheConnue();
      if (purge == null || purge === vue) return;
      vue = purge;
      try {
        purgerOnglet(window.sessionStorage);
      } catch {
        // stockage indisponible : rien à effacer
      }
    });
  }, []);
  return null;
}
