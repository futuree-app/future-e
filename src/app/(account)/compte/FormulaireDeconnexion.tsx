"use client";

import type { ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { purgerRecherchesDuNavigateur } from "@/components/interaction/purge-recherche-navigateur";

// SE DÉCONNECTER (FUT-27). La fermeture de la session Supabase et la redirection restent à la Server Action ;
// le serveur n'atteint pas le stockage du navigateur. Avant qu'elle parte, ce formulaire efface les
// recherches temporaires de ce navigateur et prévient les autres onglets : le compte suivant sur ce
// navigateur ne retrouve pas la dernière recherche du précédent. Rien n'est effacé à la connexion.
// Le bouton reste dessiné par la page : ce composant ne porte que le comportement.
export function FormulaireDeconnexion({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <form action={signOutAction} onSubmit={() => purgerRecherchesDuNavigateur()} className={className}>
      {children}
    </form>
  );
}
