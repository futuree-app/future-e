"use client";
// FUT-41 / FUT-22 · PROTOTYPE V5.1 DU CENTRE DE DÉCISION (revue d'expérience, DEV UNIQUEMENT).
// Même état, mêmes situations, mêmes règles que la V5 (réducteur `reduire5`, contrat FUT-22) : seule la
// présentation change. Accueil, Comparer, fiche d'un logement et ajout d'une annonce sont réécrits ;
// Mon Projet est celui de la V5 ; « Analyse complète » remplace la page « Relevé » (le mot reste interne). Chaque écran a son lien « Voir en V5 »
// sur la même situation, pour comparer.
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BandeauPrototype, releve as s } from "@/components/releve/primitives";
import { etatInitial5, reduire5, vueVersHash5, hashVersVue5, type Etat5 } from "../fut41-v5/etat5";
import { SCENARIOS5, type Vue5 } from "../fut41-v5/scenarios5";
import type { Geste, Piste } from "../fut41-v5/modele5";
import type { Api5 } from "../fut41-v5/CentreDecision5";
import { Projet5 } from "../fut41-v5/vues5/Projet5";
import { PanneauAnalyse } from "../fut41-v5/PanneauAnalyse";
import { Ensemble51 } from "./vues51/Ensemble51";
import { Comparer51 } from "./vues51/Comparer51";
import { FicheLogement51 } from "./vues51/FicheLogement51";
import { FicheCommune51 } from "./vues51/FicheCommune51";
import { Analyse51 } from "./vues51/Analyse51";
import v from "../fut41-v5/v5.module.css";
import w from "./v51.module.css";

function depuisUrl(): Etat5 {
  if (typeof window === "undefined") return etatInitial5("ref");
  const e = etatInitial5(new URLSearchParams(window.location.search).get("s") ?? "ref");
  const v0 = window.location.hash ? hashVersVue5(window.location.hash) : null;
  return v0 ? { ...e, vue: v0 } : e;
}
const rien = () => () => {};

export function CentreDecision51({ lienV5 = "/dev/centre-decision-v5" }: { lienV5?: string }) {
  const [etat, envoyer] = useReducer(reduire5, undefined, depuisUrl);
  const pret = useSyncExternalStore(rien, () => true, () => false);
  const [panneau, setPanneau] = useState<{ p: Piste; geste: Geste["cle"] } | null>(null);
  const declencheur = useRef<HTMLElement | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const premier = useRef(true);

  useEffect(() => {
    const retour = () => { const vh = hashVersVue5(window.location.hash || "#/"); if (vh) envoyer({ type: "naviguer", vue: vh }); };
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, []);
  useEffect(() => {
    if (!pret) return;
    const h = vueVersHash5(etat.vue);
    if (window.location.hash !== h) window.history.pushState(null, "", `${window.location.pathname}?s=${etat.scenario}${h}`);
    const ancre = etat.vue.ancre ? document.getElementById(etat.vue.ancre) : null;
    if (premier.current && !ancre) { premier.current = false; return; }
    premier.current = false;
    if (ancre) {
      ancre.scrollIntoView({ block: "start" });
      (ancre.querySelector<HTMLElement>("input, textarea, h2") ?? ancre).focus({ preventScroll: true });
      return;
    }
    zone.current?.querySelector<HTMLElement>("[data-titre-vue]")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [etat.vue, etat.scenario, pret]);

  const aller = useCallback((vue: Vue5) => envoyer({ type: "naviguer", vue }), []);
  const ouvrirPanneau = useCallback((p: Piste, geste: Geste["cle"], d?: HTMLElement | null) => { declencheur.current = d ?? null; setPanneau({ p, geste }); }, []);
  const fermer = useCallback(() => { setPanneau(null); declencheur.current?.focus(); }, []);
  const scenario = (id: string) => { window.history.pushState(null, "", `${window.location.pathname}?s=${id}`); envoyer({ type: "charger", scenario: id }); };

  // Rendu après montage : l'emblème de production n'est pas sûr à l'hydratation (cf. V4, § 11.1).
  if (!pret) return <div className={`${s.releve} ${v.racine} ${w.racine}`} aria-busy="true" />;
  const api: Api5 = { etat, envoyer, aller, ouvrirPanneau };
  const sc = SCENARIOS5.find((x) => x.id === etat.scenario)!;
  const ecran = etat.vue.ecran;
  const onglet = ecran === "comparer" ? "comparer" : ecran === "projet" ? "projet" : ecran === "ensemble" ? "ensemble" : null;
  // Le panneau relit la piste dans l'état courant (une analyse lancée la change).
  const pistePanneau = panneau ? (panneau.p.type === "commune"
    ? { type: "commune" as const, commune: etat.communes.find((c) => c.insee === (panneau.p as { commune: { insee: string } }).commune.insee)! }
    : { type: "logement" as const, logement: etat.logements.find((l) => l.id === (panneau.p as { logement: { id: string } }).logement.id)! }) : null;

  return (
    <div className={`${s.releve} ${v.racine} ${w.racine}`}>
      <a href="#contenu" className={v.evitement}>Aller au contenu</a>
      <BandeauPrototype>
        <div className={v.demo}>
          <span>Prototype V5.1 · même situation et mêmes règles que la V5, présentation revue · données fictives</span>
          <label className={v.demoChamp}>
            <span>Situation</span>
            <select value={etat.scenario} onChange={(e) => scenario(e.target.value)}>
              {SCENARIOS5.map((x) => <option key={x.id} value={x.id}>{x.titre}</option>)}
            </select>
          </label>
          <span className={v.demoChamp} role="group" aria-label="Droits simulés">
            <span>Droits</span>
            {(["unite", "pass"] as const).map((d) => (
              <button key={d} type="button" className={v.demoOption} aria-pressed={etat.droits === d} onClick={() => envoyer({ type: "droits", droits: d })}>{d === "unite" ? "à l'unité" : "Pass Recherche (hypothèse)"}</button>
            ))}
          </span>
          <button type="button" className={v.demoOption} onClick={() => scenario(etat.scenario)}>Réinitialiser</button>
          <a className={v.demoOption} href={`${lienV5}?s=${etat.scenario}${vueVersHash5(etat.vue)}`}>Voir cette situation en V5</a>
          <span className={v.demoResume}>{sc.resume}</span>
        </div>
      </BandeauPrototype>

      <header className={v.barre}>
        <div className={`${s.feuille} ${v.barreIn}`}>
          <span className={v.logo}>futur<span className={v.point}>•</span>e</span>
          <nav aria-label="Navigation principale" className={v.nav}>
            <span className={v.navLien}>Où vivre</span>
            <span className={v.navLien}>Explorer</span>
            <button type="button" className={v.navLien} aria-current="page" onClick={() => aller({ ecran: "ensemble" })}>Ma décision</button>
          </nav>
          <Theme />
        </div>
      </header>

      <main id="contenu" className={s.feuille}>
        <nav aria-label="Ma décision" className={v.sousNav}>
          {([["ensemble", "Vue d'ensemble"], ["comparer", "Comparer"], ["projet", "Mon Projet"]] as const).map(([k, t]) => (
            <button key={k} type="button" className={v.sousNavLien} aria-current={onglet === k ? "page" : undefined}
              onClick={() => aller(k === "comparer" ? { ecran: "comparer", mode: etat.comparaison?.mode ?? (etat.communes.filter((c) => c.statut !== "ecartee").length > 1 && !etat.logements.some((l) => l.statut !== "ecarte") ? "communes" : "logements") } : { ecran: k })}>{t}</button>
          ))}
        </nav>
        <div ref={zone} key={`${etat.scenario}:${vueVersHash5({ ...etat.vue, ancre: undefined })}`} className={v.vue}>
          {ecran === "ensemble" ? <Ensemble51 api={api} /> : null}
          {ecran === "comparer" ? <Comparer51 api={api} /> : null}
          {ecran === "logement" ? <FicheLogement51 api={api} /> : null}
          {ecran === "commune" ? <FicheCommune51 api={api} /> : null}
          {ecran === "projet" ? <Projet5 api={api} /> : null}
          {ecran === "releve" ? <Analyse51 api={api} /> : null}
        </div>
      </main>
      <footer className={`${s.feuille} ${v.pied}`}>
        Prototype de revue FUT-41 / FUT-22, V5.1. Toutes les valeurs, analyses, annonces et preuves sont inventées. Rien n&apos;est enregistré, payé ni analysé ; aucune IA n&apos;est appelée.
        Les règles de comparaison sont le contrat proposé par la note FUT-22 ; le moteur de production ne les applique pas encore.
      </footer>
      <p className={v.sr} role="status" aria-live="polite">{etat.annonce ?? ""}</p>
      {panneau && pistePanneau ? <PanneauAnalyse api={api} piste={pistePanneau} geste={panneau.geste} fermer={fermer} /> : null}
    </div>
  );
}

function Theme() {
  const [t, setT] = useState<"dark" | "light">(() => (document.documentElement.dataset.theme === "light" ? "light" : "dark"));
  return (
    <button type="button" className={v.theme} aria-label={t === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
      onClick={() => { const n = t === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; setT(n); }}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" /></svg>
    </button>
  );
}
