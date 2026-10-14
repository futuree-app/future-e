"use client";

import { useEffect } from "react";
import { rendreLaPosition } from "@/components/interaction/position-de-lecture";

// Le dernier jeton dont React a VALIDÉ le rendu (un effet ne s'exécute qu'après la validation).
let jetonValide: string | null = null;

/** Le jeton du dernier rendu serveur réellement affiché, ou `null` sans témoin sur la page. */
export function dernierJetonValide(): string | null {
  return jetonValide;
}

/**
 * FUT-93 · LE TÉMOIN QU'UNE RELECTURE EST ARRIVÉE À L'ÉCRAN. Son jeton change à chaque rendu serveur ;
 * `relireLaPage` attend de voir validé un jeton différent. Placé DANS la section du bien, derrière la
 * frontière exposée à la course : il ne change que si cette section a été validée.
 *
 * IL NE REND RIEN, ET C'EST VOULU (mesuré le 14/10/2026 sur le banc, build de production) : le même
 * témoin rendu comme élément de la page, son jeton dans un attribut, suffisait à bloquer la relecture
 * qu'il devait surveiller, dans les deux présentations. Un composant qui ne rend rien, en tête de
 * section, ne la bloque pas (c'est la forme de la sonde du banc, `src/app/dev/fut93/Sonde.tsx`).
 *
 * Après un rechargement de secours, il rend aussi la position de lecture, une fois la section arrivée.
 */
export function TemoinDeRendu({ jeton }: { jeton: string }) {
  useEffect(() => {
    jetonValide = jeton;
  }, [jeton]);
  useEffect(() => { rendreLaPosition(true); }, []);
  // Démonté (la page a changé de forme, ou on l'a quittée) : plus de témoin à suivre.
  useEffect(() => () => { if (jetonValide === jeton) jetonValide = null; }, [jeton]);
  return null;
}
