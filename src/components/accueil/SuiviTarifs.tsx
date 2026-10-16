"use client";
// L'ÉVÉNEMENT `pricing_page_viewed`, repris de l'ancien accueil (`FutureELanding`) à l'identique : une seule
// fois par visite de la page, quand 20 % de la section des offres (#pricing) entre à l'écran. Rien d'autre
// n'est mesuré ici.
import { useEffect } from "react";
import posthog from "posthog-js";

export function SuiviTarifs() {
  useEffect(() => {
    const section = document.getElementById("pricing");
    if (!section) return;
    let fired = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !fired) {
          fired = true;
          posthog.capture("pricing_page_viewed");
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return null;
}
