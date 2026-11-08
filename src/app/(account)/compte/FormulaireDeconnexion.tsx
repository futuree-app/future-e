"use client";

import { useEffect, useState, type ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { purgerRecherchesDuNavigateur } from "@/components/interaction/purge-recherche-navigateur";
import { CHAMP_PURGE, PURGE_PAR_LE_NAVIGATEUR } from "@/lib/purge-recherche";

// SE DÉCONNECTER (FUT-27). La fermeture de la session Supabase et la redirection restent à la Server Action ;
// le serveur n'atteint pas le stockage du navigateur. Avant qu'elle parte, ce formulaire efface les
// recherches temporaires de ce navigateur et prévient les autres onglets : le compte suivant sur ce
// navigateur ne retrouve pas la dernière recherche du précédent. Rien n'est effacé à la connexion.
//
// Avant l'hydratation (ou sans JavaScript), `onSubmit` n'existe pas : le formulaire part en simple POST, avec
// le champ à « serveur ». La Server Action le lit et dépose alors une purge différée, appliquée par la
// première page qui exécute du JavaScript, avant toute lecture. Le bouton reste actif : inactif jusqu'à
// l'hydratation, il le resterait pour toujours sans JavaScript, et la déconnexion deviendrait impossible.
// Le bouton reste dessiné par la page : ce composant ne porte que le comportement.
export function FormulaireDeconnexion({ className = "", children }: { className?: string; children: ReactNode }) {
  const [hydrate, setHydrate] = useState(false);
  // Marque l'hydratation (une fois, client seulement) : pas un rendu en cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHydrate(true), []);
  return (
    <form action={signOutAction} onSubmit={() => purgerRecherchesDuNavigateur()} className={className}>
      <input type="hidden" name={CHAMP_PURGE} value={hydrate ? PURGE_PAR_LE_NAVIGATEUR : "serveur"} />
      {children}
    </form>
  );
}
