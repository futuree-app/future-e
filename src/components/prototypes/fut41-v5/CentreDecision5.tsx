"use client";
// FUT-41 / FUT-22 · PROTOTYPE V5 DU CENTRE DE DÉCISION (revue produit, DEV UNIQUEMENT).
// Ma décision reste l'espace unique. Trois entrées : Vue d'ensemble, Comparer (communes ou
// logements), Mon Projet. Les fiches et le Relevé sont des profondeurs, avec leur fil d'Ariane ;
// les trois entrées n'en ont pas (la navigation les nomme déjà). Comparer est retrouvé tel qu'on l'a laissé.
// La V4 (/dev/centre-decision) et la V4.1 (/dev/centre-decision-v41) restent intactes.
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BandeauPrototype, releve as s } from "@/components/releve/primitives";
import { etatInitial5, reduire5, vueVersHash5, hashVersVue5, type Etat5, type Geste5 } from "./etat5";
import { SCENARIOS5, type Vue5 } from "./scenarios5";
import { gestePrincipal, type Geste, type Piste } from "./modele5";
import { Ensemble } from "./vues5/Ensemble";
import { Comparer5 } from "./vues5/Comparer5";
import { FicheLogement5 } from "./vues5/FicheLogement5";
import { FicheCommune5 } from "./vues5/FicheCommune5";
import { Projet5 } from "./vues5/Projet5";
import { Releve5 } from "./vues5/Releve5";
import { PanneauAnalyse } from "./PanneauAnalyse";
import v from "./v5.module.css";

export type Api5 = {
  etat: Etat5;
  envoyer: (g: Geste5) => void;
  aller: (vue: Vue5) => void;
  ouvrirPanneau: (p: Piste, geste: Geste["cle"], declencheur?: HTMLElement | null) => void;
};

/** Le geste principal d'une possibilité, branché : un geste payant ou une mise à jour passe par le panneau. */
export function faireGeste(api: Api5, p: Piste) {
  const g = gestePrincipal(api.etat, p, api.etat.droits);
  return (el?: HTMLElement | null) => {
    const id = p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id;
    if (g.cle === "analyser" || g.cle === "examiner_commune" || g.cle === "mettre_a_jour") api.ouvrirPanneau(p, g.cle, el);
    else if (g.cle === "adresse") api.aller({ ecran: "logement", id, ancre: "adresse" });
    else if (g.cle === "ouvrir" || g.cle === "ouvrir_rapport") api.aller({ ecran: "releve", id });
    else api.aller({ ecran: "commune", id });
  };
}

function depuisUrl(): Etat5 {
  if (typeof window === "undefined") return etatInitial5("ref");
  const e = etatInitial5(new URLSearchParams(window.location.search).get("s") ?? "ref");
  const v0 = window.location.hash ? hashVersVue5(window.location.hash) : null;
  return v0 ? { ...e, vue: v0 } : e;
}
const rien = () => () => {};

export function CentreDecision5({ lienV4 = "/dev/centre-decision", lienV41 = "/dev/centre-decision-v41" }: { lienV4?: string; lienV41?: string }) {
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
  if (!pret) return <div className={`${s.releve} ${v.racine}`} aria-busy="true" />;
  const api: Api5 = { etat, envoyer, aller, ouvrirPanneau };
  const sc = SCENARIOS5.find((x) => x.id === etat.scenario)!;
  const ecran = etat.vue.ecran;
  const onglet = ecran === "comparer" ? "comparer" : ecran === "projet" ? "projet" : ecran === "ensemble" ? "ensemble" : null;
  // Le panneau relit la piste dans l'état courant (une analyse lancée la change).
  const pistePanneau = panneau ? (panneau.p.type === "commune"
    ? { type: "commune" as const, commune: etat.communes.find((c) => c.insee === (panneau.p as { commune: { insee: string } }).commune.insee)! }
    : { type: "logement" as const, logement: etat.logements.find((l) => l.id === (panneau.p as { logement: { id: string } }).logement.id)! }) : null;

  return (
    <div className={`${s.releve} ${v.racine}`}>
      <a href="#contenu" className={v.evitement}>Aller au contenu</a>
      <BandeauPrototype>
        <div className={v.demo}>
          <span>Prototype V5 · données fictives (valeurs inventées, y compris pour Nantes, Rennes et Angers)</span>
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
          <a className={v.demoOption} href={lienV4}>V4</a>
          <a className={v.demoOption} href={lienV41}>V4.1</a>
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
          {ecran === "ensemble" ? <Ensemble api={api} /> : null}
          {ecran === "comparer" ? <Comparer5 api={api} /> : null}
          {ecran === "logement" ? <FicheLogement5 api={api} /> : null}
          {ecran === "commune" ? <FicheCommune5 api={api} /> : null}
          {ecran === "projet" ? <Projet5 api={api} /> : null}
          {ecran === "releve" ? <Releve5 api={api} /> : null}
        </div>
      </main>
      <footer className={`${s.feuille} ${v.pied}`}>
        Prototype de revue FUT-41 / FUT-22, V5. Toutes les valeurs, analyses, annonces et preuves sont inventées. Rien n&apos;est enregistré, payé ni analysé ; aucune IA n&apos;est appelée.
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
