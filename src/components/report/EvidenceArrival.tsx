"use client";

// L'ARRIVÉE SUR UNE PREUVE. Le lecteur a cliqué « Preuve · 44 nuits à l'horizon 2050 » dans le dossier ;
// il atterrit ici, dans un module dense de vingt cartes. Le navigateur a déjà fait le saut — l'ancre est
// native, elle fonctionne sans JavaScript — mais rien ne lui dit LAQUELLE des cartes visibles répond à
// ce qu'il vient de lire.
//
// Ce composant n'ajoute donc que ce que le fragment natif ne sait pas faire : désigner brièvement la
// carte, et y poser le focus pour qu'un lecteur d'écran suive le même déplacement que l'œil.
//
// Il ne CORRIGE pas la position : `scroll-mt-24` sur les cibles s'en charge en CSS, sans JS ni saut
// visible. Le hash reste dans l'URL — la page est partageable et rechargeable au même endroit.
import { useEffect } from "react";

export function EvidenceArrival() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("evidence-")) return;
    const cible = document.getElementById(hash);
    if (!cible) return; // le module ne présente pas (ou plus) ce phénomène : le lecteur reste en haut

    // Focusable par programme seulement : une carte du module n'entre pas dans l'ordre de tabulation
    // pour autant.
    if (!cible.hasAttribute("tabindex")) cible.setAttribute("tabindex", "-1");
    cible.focus({ preventScroll: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // `data-visee` plutôt qu'une classe : React réécrit `className` à la réconciliation et effaçait le
    // repère aussitôt posé. Un attribut qu'aucune prop ne décrit y survit.
    cible.setAttribute("data-visee", "");
    const t = window.setTimeout(() => cible.removeAttribute("data-visee"), 2200);
    return () => window.clearTimeout(t);
  }, []);

  return null;
}
