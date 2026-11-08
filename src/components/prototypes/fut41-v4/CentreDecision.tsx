"use client";
// FUT-41 / FUT-22 · PROTOTYPE V4 DU CENTRE DE DÉCISION (revue produit, DEV UNIQUEMENT).
//
// Une seule page, cinq vues d'un même espace : Ma décision, la fiche d'un logement, la comparaison,
// « Faire le point » et le Relevé (simplifié). La vue est portée par l'URL (`#/lieu/…`), si bien que
// le bouton retour, un signet et un rafraîchissement rouvrent le même lieu (décision Y3 de la V3.3).
// Données fictives, gestes en mémoire : rien n'est enregistré, payé, analysé ni envoyé.
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BandeauPrototype, releve as s } from "@/components/releve/primitives";
import { etatInitial, reduire, vueVersHash, hashVersVue, type Geste, type Etat } from "./etat";
import { SCENARIOS, type Vue } from "./scenarios";
import { MaDecision } from "./vues/MaDecision";
import { Fiche } from "./vues/Fiche";
import { Comparer } from "./vues/Comparer";
import { FaireLePoint } from "./vues/FaireLePoint";
import { Releve } from "./vues/Releve";
import { EtSi } from "./EtSi";
import v from "./v4.module.css";

export type Api = {
  etat: Etat;
  envoyer: (g: Geste) => void;
  aller: (vue: Vue) => void;
  ouvrirEtSi: (declencheur?: HTMLElement | null) => void;
};

function lireScenario(): string {
  if (typeof window === "undefined") return "complet";
  return new URLSearchParams(window.location.search).get("s") ?? "complet";
}

/** L'état de départ : le scénario et la vue que désigne l'URL (côté serveur : le scénario par défaut). */
function etatDepuisUrl(): Etat {
  if (typeof window === "undefined") return etatInitial("complet");
  const e = etatInitial(lireScenario());
  const v0 = hashVersVue(window.location.hash);
  return v0 ? { ...e, vue: v0 } : e;
}

const rien = () => () => {};

export function CentreDecision() {
  const [etat, envoyer] = useReducer(reduire, undefined, etatDepuisUrl);
  // Monté côté navigateur ? Faux au rendu serveur et pendant l'hydratation, vrai ensuite.
  const pret = useSyncExternalStore(rien, () => true, () => false);
  const [etSi, setEtSi] = useState(false);
  const declencheurEtSi = useRef<HTMLElement | null>(null);
  const titreVue = useRef<HTMLDivElement>(null);

  // Le bouton retour du navigateur : la vue suit l'URL.
  useEffect(() => {
    const surRetour = () => {
      const vh = hashVersVue(window.location.hash);
      if (vh) envoyer({ type: "naviguer", vue: vh });
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);

  // Chaque changement de vue écrit l'URL (une entrée d'historique) puis pose le focus sur le titre.
  const premierRendu = useRef(true);
  useEffect(() => {
    if (!pret) return;
    const h = vueVersHash(etat.vue);
    if (window.location.hash !== h) window.history.pushState(null, "", `${window.location.pathname}?s=${etat.scenario}${h}`);
    if (premierRendu.current) { premierRendu.current = false; return; }
    const cible = titreVue.current?.querySelector<HTMLElement>("[data-titre-vue]");
    cible?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [etat.vue, etat.scenario, pret]);

  const aller = useCallback((vue: Vue) => envoyer({ type: "naviguer", vue }), []);
  const ouvrirEtSi = useCallback((d?: HTMLElement | null) => { declencheurEtSi.current = d ?? null; setEtSi(true); }, []);
  const fermerEtSi = useCallback(() => { setEtSi(false); declencheurEtSi.current?.focus(); }, []);

  const changerScenario = (id: string) => {
    window.history.pushState(null, "", `${window.location.pathname}?s=${id}`);
    envoyer({ type: "charger", scenario: id });
  };

  const api: Api = { etat, envoyer, aller, ouvrirEtSi };
  // RENDU APRÈS MONTAGE. `EmblemeEchelles` (primitive de production) calcule ses graduations en
  // trigonométrie non arrondie : rendue par un composant client, elle diverge entre serveur et
  // navigateur (piège connu, docs mémoire « trigonométrie SVG en SSR »). Le prototype ne modifie pas
  // la primitive ; le correctif (arrondir les coordonnées) est inscrit au premier lot de production.
  if (!pret) return <div className={`${s.releve} ${v.racine}`} aria-busy="true" />;
  const sc = SCENARIOS.find((x) => x.id === etat.scenario)!;

  return (
    <div className={`${s.releve} ${v.racine}`}>
      <a href="#contenu" className={v.evitement}>Aller au contenu</a>
      <BandeauPrototype>
        <div className={v.demo}>
          <span className={v.demoTitre}>Prototype V4 · FUT-41 / FUT-22 · données fictives</span>
          <label className={v.demoChamp}>
            <span>Scénario</span>
            <select value={etat.scenario} onChange={(ev) => changerScenario(ev.target.value)}>
              {SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.numero} · {x.titre}</option>)}
            </select>
          </label>
          <span className={v.demoResume}>{sc.resume}</span>
          <span className={v.demoChamp} role="group" aria-label="Droits simulés">
            <span>Droits</span>
            {(["unite", "pass"] as const).map((m) => (
              <button key={m} type="button" className={v.demoOption} aria-pressed={etat.droits === m} onClick={() => envoyer({ type: "droits", mode: m })}>
                {m === "unite" ? "à l'unité" : "Pass Recherche (hypothèse)"}
              </button>
            ))}
          </span>
          <button type="button" className={v.demoOption} onClick={() => changerScenario(etat.scenario)}>Réinitialiser</button>
        </div>
      </BandeauPrototype>

      <header className={v.barre}>
        <div className={`${s.feuille} ${v.barreInterieur}`}>
          <span className={v.logo}>futur<span className={v.point}>•</span>e</span>
          <nav aria-label="Navigation principale (cible FUT-86)" className={v.nav}>
            <span className={v.navLien}>Où vivre</span>
            <span className={v.navLien}>Explorer</span>
            <button type="button" className={v.navLien} aria-current={etat.vue.ecran === "decision" ? "page" : undefined} onClick={() => aller({ ecran: "decision" })}>Ma décision</button>
          </nav>
          <BasculeTheme />
        </div>
      </header>

      <main id="contenu" className={s.feuille}>
        <div ref={titreVue} key={`${etat.scenario}:${vueVersHash(etat.vue)}`} className={v.vue}>
          {etat.vue.ecran === "decision" ? <MaDecision api={api} /> : null}
          {etat.vue.ecran === "fiche" ? <Fiche api={api} /> : null}
          {etat.vue.ecran === "comparer" ? <Comparer api={api} /> : null}
          {etat.vue.ecran === "point" ? <FaireLePoint api={api} /> : null}
          {etat.vue.ecran === "releve" ? <Releve api={api} /> : null}
        </div>
      </main>

      <footer className={`${s.feuille} ${v.pied}`}>
        Prototype de revue FUT-41 / FUT-22, V4. Communes (codes 99xxx), adresses, annonces, analyses, mesures et preuves sont inventées.
        Rien n&apos;est enregistré, payé ni analysé ; aucune IA n&apos;est appelée. Les règles de comparaison affichées sont le contrat proposé par la note FUT-22 ; le moteur de production ne les applique pas encore.
      </footer>

      <p className={v.sr} role="status" aria-live="polite">{etat.annonce ?? ""}</p>
      {etSi ? <EtSi api={api} fermer={fermerEtSi} /> : null}
    </div>
  );
}

function BasculeTheme() {
  // Rendu seulement après montage (cf. `pret`) : le document est lisible dès le premier rendu.
  const [theme, setTheme] = useState<"dark" | "light">(() => (document.documentElement.dataset.theme === "light" ? "light" : "dark"));
  const basculer = () => {
    const t = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    setTheme(t);
  };
  return (
    <button type="button" className={v.theme} onClick={basculer} aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg>
    </button>
  );
}
