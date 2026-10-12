"use client";

// FUT-75 (2e itération) · LA CONTINUITÉ ENTRE DEUX ÉTATS, PAR L'API VIEW TRANSITIONS. DEV UNIQUEMENT.
//
// Le navigateur photographie l'état avant, l'état après, et fait se transformer l'un en l'autre les
// éléments qui portent le même `view-transition-name` (une forme qui change de fonction). Aucune
// bibliothèque. Sans prise en charge, en mouvement réduit ou sans animation, la mise à jour est
// appliquée directement : l'information est la même, seul le passage disparaît.
import { flushSync } from "react-dom";
import type { ModeMouvement } from "./motion";

type DocumentAvecTransition = Document & { startViewTransition?: (maj: () => void) => { finished: Promise<void> } };

/**
 * UNE TRANSITION NE PHOTOGRAPHIE QUE SA PORTÉE. Les noms de transition ne sont posés que sur les éléments
 * de la `portee` en cours (`html[data-vt]`, feuille `transitions.css`), et la racine est retirée de la
 * capture : sinon chaque passage photographie toute la page et tous les éléments nommés des autres
 * composants (mesuré : treize groupes et la racine, 20 i/s sur appareil lent).
 */
export function avecContinuite(mode: ModeMouvement, maj: () => void, portee?: string): void {
  const doc = typeof document === "undefined" ? null : (document as DocumentAvecTransition);
  if (mode !== "anime" || !doc?.startViewTransition) { maj(); return; }
  if (portee) doc.documentElement.dataset.vt = portee;
  const t = doc.startViewTransition(() => { flushSync(maj); });
  t.finished.finally(() => { if (doc.documentElement.dataset.vt === portee) delete doc.documentElement.dataset.vt; });
}
