// FUT-93 · `router.refresh()`, AVEC UN SECOURS : voir `src/lib/interaction/relecture-secours.ts`.
//
// Pour les gestes qui relisent la page après un enregistrement confirmé (critères du projet, lien
// avec le bien, projet, relation à la commune, reprise de recherche, commune). Q1 garde sa propre
// récupération, qui suit une VERSION (`AnalyseAncienProjet`) ; celle-ci suit le témoin de rendu.
//
// Le suivi vit ici, hors de tout composant : le geste qui l'a lancé peut être démonté ou remonté par
// la relecture elle-même, et son échéance ne doit pas disparaître avec lui.
import { estRelectureDeLaPage, etapeRelecture } from "@/lib/interaction/relecture-secours";
import { dernierJetonValide } from "@/components/interaction/TemoinDeRendu";
import { memoriserLaPosition, rendreLaPosition } from "@/components/interaction/position-de-lecture";

// Après un rechargement de secours, la position revient dès que la page est là, sans attendre la
// section du bien (le témoin l'ajustera à son arrivée). Ce module est chargé par les gestes, hors de
// la frontière : il s'exécute tôt.
if (typeof window !== "undefined") window.requestAnimationFrame(() => rendreLaPosition(false));

type Suivi = {
  jetonAvant: string;
  chemin: string;
  debut: number;
  reponseRecue: boolean;
  minuterie: number;
  observateur: PerformanceObserver | null;
};
let suivi: Suivi | null = null;

const jetonAffiche = (): string | null => dernierJetonValide();
const cheminCourant = () => location.pathname + location.search;

function arreter() {
  if (!suivi) return;
  window.clearInterval(suivi.minuterie);
  suivi.observateur?.disconnect();
  suivi = null;
}

function observerLesReponses(s: Suivi): PerformanceObserver | null {
  try {
    const o = new PerformanceObserver((liste) => {
      for (const e of liste.getEntries() as PerformanceResourceTiming[]) {
        if (e.startTime >= s.debut && estRelectureDeLaPage(e.name, e.initiatorType, location)) s.reponseRecue = true;
      }
    });
    o.observe({ type: "resource" });
    return o;
  } catch {
    return null;
  }
}

function verifier() {
  const s = suivi;
  if (!s) return;
  // Le lecteur est parti ailleurs : ce suivi ne concerne plus la page affichée.
  if (cheminCourant() !== s.chemin) { arreter(); return; }
  const etape = etapeRelecture({
    jetonAvant: s.jetonAvant, jetonAffiche: jetonAffiche(), reponseRecue: s.reponseRecue,
    ecouleMs: performance.now() - s.debut,
  });
  if (etape === "attendre") return;
  arreter();
  if (etape === "recharger") {
    // UN SEUL RECHARGEMENT PAR GESTE : le suivi est clos avant, et une page rechargée n'en ouvre aucun
    // (seul un nouveau geste du lecteur le fait). Rien n'est recalculé : c'est la même adresse, relue.
    // Sans mémoire possible, seule la position de lecture se perd : le rechargement reste juste.
    memoriserLaPosition();
    window.location.reload();
  }
}

/** Relit la page, et la recharge une fois si la relecture n'arrive pas à l'écran. */
export function relireLaPage(router: { refresh(): void }): void {
  const jetonAvant = jetonAffiche();
  router.refresh();
  // Sans témoin, aucune frontière exposée à la course sur cette page : la relecture simple suffit.
  if (jetonAvant === null) return;
  // Un second geste pendant le suivi le prolonge : même écran à quitter, nouvelle échéance.
  if (suivi && suivi.jetonAvant === jetonAvant && suivi.chemin === cheminCourant()) {
    suivi.debut = performance.now();
    suivi.reponseRecue = false;
    return;
  }
  arreter();
  const s: Suivi = {
    jetonAvant, chemin: cheminCourant(), debut: performance.now(), reponseRecue: false,
    minuterie: 0, observateur: null,
  };
  s.observateur = observerLesReponses(s);
  s.minuterie = window.setInterval(verifier, 250);
  suivi = s;
}
