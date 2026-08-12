"use client";

import { useEffect, useRef } from "react";

// LE SIGNAL D'OUVERTURE RÉELLE.
//
// Il ne rend rien. Sa seule fonction est de dire au serveur, une fois la page MONTÉE, quel bien le
// lecteur consulte, pour que le hub le lui resserve (`user_profiles.active_dossier_id` et le
// territoire qui va avec).
//
// POURQUOI CÔTÉ CLIENT. L'écriture se faisait dans `after()` au rendu serveur, qui s'exécute même
// quand la réponse n'aboutit pas : préchargement, navigation abandonnée, deux onglets qui finissent
// dans le désordre. Monté, ce composant prouve que la page est bien à l'écran.
//
// UN SEUL ENVOI PAR MONTAGE. `useEffect` se rejoue en développement (StrictMode) et à chaque
// changement de dépendance : sans ce garde, un simple aller-retour d'onglet reposerait le contexte.
// L'échec est silencieux pour le lecteur, et journalisé côté serveur : la préférence n'est pas ce
// pour quoi il est venu, et l'écran ne doit pas se charger d'un message qu'il ne peut pas exploiter.
export function MarquerBienActif({ dossierId }: { dossierId: string }) {
  const envoye = useRef<string | null>(null);

  useEffect(() => {
    if (envoye.current === dossierId) return;
    envoye.current = dossierId;
    fetch("/api/dossier/actif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dossierId }),
      keepalive: true, // la navigation suivante ne doit pas annuler le signal
    }).catch(() => {
      // Le lecteur n'a rien à faire de cette panne : il voit son bien, c'est ce qu'il voulait.
    });
  }, [dossierId]);

  return null;
}
