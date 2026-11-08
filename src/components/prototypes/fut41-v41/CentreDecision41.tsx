"use client";
// FUT-41 / FUT-22 · PROTOTYPE V4.1 DU CENTRE DE DÉCISION (revue produit, DEV UNIQUEMENT).
// Trois écrans et un panneau : Ma décision (la recherche), une piste (commune ou logement), Comparer ;
// le Relevé reste la profondeur d'une analyse ; « Et si… ? » est un panneau du Projet.
// La V4 reste intacte sur /dev/centre-decision pour la comparaison.
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { BandeauPrototype, releve as s } from "@/components/releve/primitives";
import { etatInitial41, reduire41, vueVersHash41, hashVersVue41, type Etat41, type Geste41 } from "./etat41";
import { SCENARIOS41, type Vue41 } from "./scenarios41";
import { Accueil } from "./vues41/Accueil";
import { FicheLogement } from "./vues41/FicheLogement";
import { FicheCommune } from "./vues41/FicheCommune";
import { Comparer41 } from "./vues41/Comparer41";
import { Releve41 } from "./vues41/Releve41";
import { EtSi41 } from "./EtSi41";
import v from "./v41.module.css";

export type Api41 = { etat: Etat41; envoyer: (g: Geste41) => void; aller: (vue: Vue41) => void; ouvrirEtSi: (d?: HTMLElement | null) => void };

function depuisUrl(): Etat41 {
  if (typeof window === "undefined") return etatInitial41("ref");
  const e = etatInitial41(new URLSearchParams(window.location.search).get("s") ?? "ref");
  const v0 = window.location.hash ? hashVersVue41(window.location.hash) : null;
  return v0 ? { ...e, vue: v0 } : e;
}
const rien = () => () => {};

export function CentreDecision41({ lienV4 = "/dev/centre-decision" }: { lienV4?: string }) {
  const [etat, envoyer] = useReducer(reduire41, undefined, depuisUrl);
  const pret = useSyncExternalStore(rien, () => true, () => false);
  const [etSi, setEtSi] = useState(false);
  const declencheur = useRef<HTMLElement | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const premier = useRef(true);

  useEffect(() => {
    const retour = () => { const vh = hashVersVue41(window.location.hash || "#/"); if (vh) envoyer({ type: "naviguer", vue: vh }); };
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, []);
  useEffect(() => {
    if (!pret) return;
    const h = vueVersHash41(etat.vue);
    if (window.location.hash !== h) window.history.pushState(null, "", `${window.location.pathname}?s=${etat.scenario}${h}`);
    if (premier.current) { premier.current = false; return; }
    zone.current?.querySelector<HTMLElement>("[data-titre-vue]")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [etat.vue, etat.scenario, pret]);

  const aller = useCallback((vue: Vue41) => envoyer({ type: "naviguer", vue }), []);
  const ouvrirEtSi = useCallback((d?: HTMLElement | null) => { declencheur.current = d ?? null; setEtSi(true); }, []);
  const fermerEtSi = useCallback(() => { setEtSi(false); declencheur.current?.focus(); }, []);
  const scenario = (id: string) => { window.history.pushState(null, "", `${window.location.pathname}?s=${id}`); envoyer({ type: "charger", scenario: id }); };

  // Rendu après montage : l'emblème de production n'est pas sûr à l'hydratation (cf. V4, § 11.1).
  if (!pret) return <div className={`${s.releve} ${v.racine}`} aria-busy="true" />;
  const api: Api41 = { etat, envoyer, aller, ouvrirEtSi };
  const sc = SCENARIOS41.find((x) => x.id === etat.scenario)!;

  return (
    <div className={`${s.releve} ${v.racine}`}>
      <a href="#contenu" className={v.evitement}>Aller au contenu</a>
      <BandeauPrototype>
        <div className={v.demo}>
          <span>Prototype V4.1 · données fictives (valeurs inventées, y compris pour Nantes, Rennes et Angers)</span>
          <label className={v.demoChamp}>
            <span>Situation</span>
            <select value={etat.scenario} onChange={(e) => scenario(e.target.value)}>
              {SCENARIOS41.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.titre}</option>)}
            </select>
          </label>
          <span className={v.demoChamp} role="group" aria-label="Droits simulés">
            <span>Droits</span>
            {(["unite", "pass"] as const).map((d) => (
              <button key={d} type="button" className={v.demoOption} aria-pressed={etat.droits === d} onClick={() => envoyer({ type: "droits", droits: d })}>{d === "unite" ? "à l'unité" : "Pass Recherche (hypothèse)"}</button>
            ))}
          </span>
          <button type="button" className={v.demoOption} onClick={() => scenario(etat.scenario)}>Réinitialiser</button>
          <a className={v.demoOption} href={lienV4}>Voir la V4</a>
          <span className={v.demoResume}>{sc.resume}</span>
        </div>
      </BandeauPrototype>

      <header className={v.barre}>
        <div className={`${s.feuille} ${v.barreIn}`}>
          <span className={v.logo}>futur<span className={v.point}>•</span>e</span>
          <nav aria-label="Navigation principale" className={v.nav}>
            <span className={v.navLien}>Où vivre</span>
            <span className={v.navLien}>Explorer</span>
            <button type="button" className={v.navLien} aria-current={etat.vue.ecran === "accueil" ? "page" : undefined} onClick={() => aller({ ecran: "accueil" })}>Ma décision</button>
          </nav>
          <Theme />
        </div>
      </header>

      <main id="contenu" className={s.feuille}>
        <div ref={zone} key={`${etat.scenario}:${vueVersHash41(etat.vue)}`} className={v.vue}>
          {etat.vue.ecran === "accueil" ? <Accueil api={api} /> : null}
          {etat.vue.ecran === "fiche" ? <FicheLogement api={api} /> : null}
          {etat.vue.ecran === "commune" ? <FicheCommune api={api} /> : null}
          {etat.vue.ecran === "comparer" ? <Comparer41 api={api} /> : null}
          {etat.vue.ecran === "releve" ? <Releve41 api={api} /> : null}
        </div>
      </main>
      <footer className={`${s.feuille} ${v.pied}`}>
        Prototype de revue FUT-41 / FUT-22, V4.1. Toutes les valeurs, analyses, annonces et preuves sont inventées. Rien n&apos;est enregistré, payé ni analysé ; aucune IA n&apos;est appelée.
        Les règles de comparaison sont le contrat proposé par la note FUT-22 ; le moteur de production ne les applique pas encore.
      </footer>
      <p className={v.sr} role="status" aria-live="polite">{etat.annonce ?? ""}</p>
      {etSi ? <EtSi41 api={api} fermer={fermerEtSi} /> : null}
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
