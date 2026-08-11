"use client";

// L'ARRIVÉE SUR UNE PREUVE. Le lecteur a cliqué « Preuve · 44 nuits à l'horizon 2050 » dans le dossier ;
// il atterrit ici, dans un module dense de vingt cartes. Le navigateur a déjà fait le saut — l'ancre est
// native, elle fonctionne sans JavaScript — mais rien ne lui dit LAQUELLE des cartes visibles répond à
// ce qu'il vient de lire.
//
// Ce composant n'ajoute donc que ce que le fragment natif ne sait pas faire : désigner brièvement la
// carte, et y poser le focus pour qu'un lecteur d'écran suive le même déplacement que l'œil.
//
// Il corrige la position SEULEMENT quand le navigateur a renoncé au saut natif, ce qui arrive dès que
// la carte visée arrive après le chargement (flux serveur, `Suspense`). Mesuré le 11/08/2026 : sur un
// rechargement de l'URL hashée, la page restait en haut, la cible se trouvant à ~2259 px. Quand le
// saut natif a bien eu lieu, `scroll-mt-24` suffit et ce composant ne fait qu'ajouter le repère.
//
// Le hash reste dans l'URL : la page est partageable et rechargeable au même endroit, et depuis ce
// lot c'est vrai.
import { useEffect } from "react";

export function EvidenceArrival() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("evidence-")) return;

    let annule = false;
    let horloge: number | undefined;

    // ── LA CIBLE PEUT NE PAS EXISTER ENCORE (revue navigateur du 11/08/2026) ────────────────────
    // Ce composant lisait le DOM une fois, au montage, et abandonnait quand la carte n'y était pas.
    // Mesuré : sur un chargement direct ou un rechargement de l'URL hashée, la page reste en haut,
    // la carte visée se trouvant à ~2259 px. Les cartes du module arrivent par un flux serveur et
    // par le remplacement d'un `Suspense` : au moment où cet effet s'exécute, la cible n'est pas
    // toujours là, et le navigateur a déjà renoncé à son propre saut natif pour la même raison.
    //
    // On l'ATTEND donc, par observation du DOM plutôt que par sondage, avec une borne : au-delà, la
    // page ne présente probablement pas ce phénomène, et insister ferait sauter le lecteur bien
    // après qu'il a commencé à lire.
    const observateur = new MutationObserver(() => {
      const trouve = document.getElementById(hash);
      if (trouve) arriver(trouve);
    });

    const cible = document.getElementById(hash);
    if (cible) arriver(cible);
    else {
      observateur.observe(document.body, { childList: true, subtree: true });
      horloge = window.setTimeout(() => observateur.disconnect(), 8000);
    }

    return () => {
      annule = true;
      observateur.disconnect();
      if (horloge) window.clearTimeout(horloge);
    };

    function arriver(cible: HTMLElement) {
      if (annule) return;
      annule = true; // une seule arrivée : une carte remontée deux fois relancerait le saut
      observateur.disconnect();

    // Focusable par programme seulement : une carte du module n'entre pas dans l'ordre de tabulation
    // pour autant.
    if (!cible.hasAttribute("tabindex")) cible.setAttribute("tabindex", "-1");
      cible.focus({ preventScroll: true });

      // LE SAUT EST FAIT ICI QUAND LE NAVIGATEUR A RENONCÉ AU SIEN. Il ne l'a pas fait si la cible
      // est apparue après le chargement, et `scroll-mt-24` ne corrige que la position d'un saut qui
      // a eu lieu. `block: "start"` reproduit le comportement natif.
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cible.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "start" });

      if (!doux) return;
      // `data-visee` plutôt qu'une classe : React réécrit `className` à la réconciliation et effaçait
      // le repère aussitôt posé. Un attribut qu'aucune prop ne décrit y survit.
      cible.setAttribute("data-visee", "");
      window.setTimeout(() => cible.removeAttribute("data-visee"), 2200);
    }
  }, []);

  return null;
}
