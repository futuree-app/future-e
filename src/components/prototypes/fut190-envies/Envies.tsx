"use client";
// FUT-190 · PROTOTYPE « J'AIMERAIS DONNER PLUS DE PLACE À… » (DEV UNIQUEMENT).
//
// L'envie n'ouvre aucun espace nouveau : elle s'écrit dans Mon Projet, se lit dans Comparer, et sa
// vérification rejoint celles du lieu. La barre, la sous-navigation et la plaque « À retenir » sont
// celles de la V5.1 du centre de décision (mêmes feuilles de style, mêmes primitives du Relevé).
//
// Rien n'est enregistré, aucun modèle de langage n'est appelé, aucune requête ne part de cette page :
// les temps de trajet et les recensements ont été relus une fois, le 10/11/2026 (`donnees.ts`).
import { useCallback, useEffect, useId, useReducer, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { BandeauPrototype, GlypheGrain, Selecteur, releve as s } from "@/components/releve/primitives";
import { Agir, Preuves, Retenir, Signe } from "../fut41-v51/communs51";
import { lier } from "../fut41-v4/communs";
import {
  AUJOURDHUI_LIEU, CATALOGUE, DATE_DU_JOUR, EXEMPLES, HORS_LECTURE, LIEUX, LIGNES_PROJET, NOM_ECHELLE, NOM_STATUT, PROJET, SOURCES, lieu as lieuDe,
  type CleSource, type Fait, type IdLieu, type Question,
} from "./donnees";
import {
  LIBELLE_INTENTION, LIBELLE_RYTHME, LIMITES, MODE, QUESTION_INTENTION, SITUATIONS, TITRE_CHANGEMENT, TITRE_ECART,
  aRetenir, catalogue, comparer, dateFr, faceAAujourdhui, lireLieu, nouvelleEnvie, ordonner, ouVousEnEtes, questionUtile, questionsDe, reconnaitre, reglerEnvie, texteReponse, titreEnvie,
  type Envie, type Intention, type LecturePortee, type Reponses, type Rythme, type Vue,
} from "./modele";
import v from "../fut41-v5/v5.module.css";
import w from "../fut41-v51/v51.module.css";
import x from "./envies.module.css";

// ── État (en mémoire) ────────────────────────────────────────────────────────────────────────

type Version = "envies" | "minimale";
type Etat = { situation: string; vue: Vue; envies: Envie[]; reponses: Reponses; notes: Record<string, string>; version: Version; annonce: string | null; compteur: number };
type Geste =
  | { type: "charger"; situation: string }
  | { type: "naviguer"; vue: Vue }
  | { type: "version"; version: Version }
  | { type: "ajouter"; texte: string; intention: Intention; rythme: Rythme }
  | { type: "retirer"; id: string }
  | { type: "regler"; id: string; rythme?: Rythme; limite?: number; intention?: Intention }
  | { type: "repondre"; question: string; valeur: string | null }
  | { type: "noter"; id: string; texte: string };

function initial(id = "depart"): Etat {
  const sc = SITUATIONS.find((z) => z.id === id) ?? SITUATIONS[0]!;
  return { situation: sc.id, vue: sc.vue, envies: structuredClone(sc.envies), reponses: structuredClone(sc.reponses), notes: {}, version: "envies", annonce: null, compteur: 10 };
}

function reduire(e: Etat, g: Geste): Etat {
  switch (g.type) {
    case "charger": return { ...initial(g.situation), version: e.version };
    case "naviguer": return { ...e, vue: g.vue, annonce: null };
    case "version": return { ...e, version: g.version };
    case "ajouter": {
      const n = nouvelleEnvie(g.texte, g.intention, g.rythme, e.compteur);
      return { ...e, envies: [...e.envies, n], compteur: e.compteur + 1, annonce: `« ${titreEnvie(n)} » est ajoutée à votre Projet.` };
    }
    case "retirer": return { ...e, envies: e.envies.filter((z) => z.id !== g.id), annonce: "Envie retirée de votre Projet." };
    case "regler":
      return { ...e, envies: e.envies.map((z) => (z.id !== g.id ? z : reglerEnvie(z, { ...(g.intention ? { intention: g.intention } : {}), ...(g.rythme ? { rythme: g.rythme } : {}), ...(g.limite ? { limite: g.limite } : {}) }))) };
    case "repondre": {
      const reponses = { ...e.reponses };
      if (g.valeur) reponses[g.question] = { valeur: g.valeur, date: DATE_DU_JOUR }; else delete reponses[g.question];
      return { ...e, reponses, annonce: g.valeur ? "Réponse enregistrée avec sa date. Les données publiques ne changent pas." : "Réponse retirée." };
    }
    case "noter": return { ...e, notes: { ...e.notes, [g.id]: g.texte } };
  }
}

const versHash = (vue: Vue) => (vue.ecran === "ensemble" ? "#/" : vue.ecran === "lieu" ? `#/lieu/${vue.id}` : `#/${vue.ecran}`);
function depuisHash(h: string): Vue | null {
  const p = h.replace(/^#\/?/, "").split("/");
  if (!p[0]) return { ecran: "ensemble" };
  if (p[0] === "comparer" || p[0] === "projet") return { ecran: p[0] };
  if (p[0] === "lieu" && (p[1] === "angers" || p[1] === "chalonnes")) return { ecran: "lieu", id: p[1] };
  return null;
}
function depuisUrl(): Etat {
  if (typeof window === "undefined") return initial();
  const e = initial(new URLSearchParams(window.location.search).get("s") ?? "depart");
  const v0 = window.location.hash ? depuisHash(window.location.hash) : null;
  return v0 ? { ...e, vue: v0 } : e;
}
const rien = () => () => {};

type Api = { etat: Etat; envoyer: (g: Geste) => void; aller: (vue: Vue, ancre?: string) => void };

// ── Coquille ─────────────────────────────────────────────────────────────────────────────────

export function Envies() {
  const [etat, envoyer] = useReducer(reduire, undefined, depuisUrl);
  const pret = useSyncExternalStore(rien, () => true, () => false);
  const zone = useRef<HTMLDivElement>(null);
  const ancre = useRef<string | null>(null);
  const premier = useRef(true);

  useEffect(() => {
    const retour = () => { const vh = depuisHash(window.location.hash || "#/"); if (vh) envoyer({ type: "naviguer", vue: vh }); };
    window.addEventListener("popstate", retour);
    return () => window.removeEventListener("popstate", retour);
  }, []);
  useEffect(() => {
    if (!pret) return;
    const h = versHash(etat.vue);
    if (window.location.hash !== h) window.history.pushState(null, "", `${window.location.pathname}?s=${etat.situation}${h}`);
    const cible = ancre.current ? document.getElementById(ancre.current) : null;
    ancre.current = null;
    if (premier.current && !cible) { premier.current = false; return; }
    premier.current = false;
    if (cible) { window.dispatchEvent(new CustomEvent("envies:ouvrir", { detail: cible.id })); requestAnimationFrame(() => { cible.scrollIntoView({ block: "start" }); (cible.querySelector<HTMLElement>("h2, h3, h4") ?? cible).focus({ preventScroll: true }); }); return; }
    zone.current?.querySelector<HTMLElement>("[data-titre-vue]")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [etat.vue, etat.situation, pret]);

  const aller = useCallback((vue: Vue, a?: string) => {
    ancre.current = a ?? null;
    if (a) window.dispatchEvent(new CustomEvent("envies:ouvrir", { detail: a }));
    envoyer({ type: "naviguer", vue });
    // Même écran : l'effet ne se relance pas, on défile ici.
    if (a) requestAnimationFrame(() => requestAnimationFrame(() => { const c = document.getElementById(a); if (c) { c.scrollIntoView({ block: "start" }); (c.querySelector<HTMLElement>("h2, h3, h4") ?? c).focus({ preventScroll: true }); ancre.current = null; } }));
  }, []);
  const charger = (id: string) => { window.history.pushState(null, "", `${window.location.pathname}?s=${id}`); envoyer({ type: "charger", situation: id }); };

  if (!pret) return <div className={`${s.releve} ${v.racine} ${w.racine}`} aria-busy="true" />;
  const api: Api = { etat, envoyer, aller };
  const sc = SITUATIONS.find((z) => z.id === etat.situation)!;
  const ecran = etat.vue.ecran;

  return (
    <div className={`${s.releve} ${v.racine} ${w.racine}`}>
      <a href="#contenu" className={v.evitement}>Aller au contenu</a>
      <BandeauPrototype>
        <div className={v.demo}>
          <span>Prototype FUT-190 · envies · faits communaux réels et sourcés, personne et annonces fictives</span>
          <label className={v.demoChamp}>
            <span>Situation</span>
            <select value={etat.situation} onChange={(e) => charger(e.target.value)}>
              {SITUATIONS.map((z) => <option key={z.id} value={z.id}>{z.titre}</option>)}
            </select>
          </label>
          <span className={v.demoChamp} role="group" aria-label="Version comparée">
            <span>Version</span>
            {(["envies", "minimale"] as const).map((d) => (
              <button key={d} type="button" className={v.demoOption} aria-pressed={etat.version === d} onClick={() => envoyer({ type: "version", version: d })}>{d === "envies" ? "avec la lecture des envies" : "minimale (index local)"}</button>
            ))}
          </span>
          <button type="button" className={v.demoOption} onClick={() => charger(etat.situation)}>Réinitialiser</button>
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
            <button key={k} type="button" className={v.sousNavLien} aria-current={ecran === k ? "page" : undefined} onClick={() => aller({ ecran: k })}>{t}</button>
          ))}
        </nav>
        <div ref={zone} key={`${etat.situation}:${versHash(etat.vue)}`} className={v.vue}>
          {ecran === "ensemble" ? <Ensemble api={api} /> : null}
          {ecran === "comparer" ? <Comparer api={api} /> : null}
          {ecran === "projet" ? <Projet api={api} /> : null}
          {etat.vue.ecran === "lieu" ? <FicheLieu api={api} id={etat.vue.id} /> : null}
        </div>
      </main>
      <footer className={`${s.feuille} ${v.pied}`}>
        Prototype d&apos;exploration FUT-190. Les faits sur Angers et Chalonnes-sur-Loire viennent de sources publiques relues le 10 novembre 2026, chacune citée avec ses limites.
        La personne, son Projet, ses habitudes, les deux annonces et les réponses aux vérifications sont inventés. Rien n&apos;est enregistré ; aucune IA n&apos;est appelée.
        Les limites de trajet proposées par rythme (20, 40, 60 minutes) sont une hypothèse de conception.
      </footer>
      <p className={x.sr} role="status" aria-live="polite">{etat.annonce ?? ""}</p>
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

function Section({ titre, sous, id, action, children }: { titre: string; sous?: string; id: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={v.section} aria-labelledby={`${id}-t`} id={id}>
      <div className={v.sectionTete}>
        <div><h2 className={v.sectionTitre} id={`${id}-t`} tabIndex={-1}>{titre}</h2>{sous ? <p className={s.nuance}>{sous}</p> : null}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProjetCompact({ api }: { api: Api }) {
  const n = api.etat.envies.length;
  return (
    <section className={v.projetCompact} aria-label="Votre Projet">
      <p className={v.projetLigne}>
        <strong className={s.encre}>Votre Projet</strong> · {PROJET.intention.toLowerCase()} · {PROJET.priorites.join(", ")}
        {n ? <> · et {n === 1 ? "une envie" : `${n} envies`} : {ordonner(api.etat.envies).map((e) => titreEnvie(e).toLowerCase()).join(", ")}</> : null}.
      </p>
      <div className={v.ligneGestes}>
        <button type="button" className={`${s.action} ${v.cible}`} onClick={() => api.aller({ ecran: "projet" })}>Voir mon Projet</button>
      </div>
    </section>
  );
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────────────────────────

function Ensemble({ api }: { api: Api }) {
  const { etat, aller } = api;
  const utile = etat.version === "envies" ? questionUtile(etat.envies, etat.reponses) : null;
  return (
    <>
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreAccueil}`} tabIndex={-1} data-titre-vue>{LIEUX.map((l) => l.nom).join(" ou ")} ?</h1>
        <ProjetCompact api={api} />
      </div>
      <div className={v.debut}>
        <section className={v.ouPlaque} aria-label="Où vous en êtes">
          <p className={s.etiquette}>Où vous en êtes</p>
          <p className={v.ouCourt}>{lier(ouVousEnEtes(etat.envies, etat.reponses))}</p>
        </section>
        <section className={v.faire} aria-labelledby="faire-t">
          <h2 className={v.sectionTitre} id="faire-t">Le plus utile maintenant</h2>
          <div className={v.premierGeste}>
            {utile ? (
              <>
                <span className={s.pileSerree}>
                  <span className={v.actionTexte}>{lier(utile.question.question)}</span>
                  <span className={s.nuance}>{lieuDe(utile.question.lieu).nom} · pour « {titreEnvie(utile.envie).toLowerCase()} » · {utile.question.moment}</span>
                </span>
                <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => aller({ ecran: "comparer" }, `q-${utile.question.id}`)}>Voir la question</button>
              </>
            ) : (
              <>
                <span className={s.pileSerree}>
                  <span className={v.actionTexte}>Comparer vos deux communes pour votre Projet.</span>
                  <span className={s.nuance}>{etat.envies.length ? "Vos questions ont reçu une réponse, ou votre envie ne se lit pas encore. Des inconnues peuvent rester." : "Elles se distinguent déjà sur trois de vos priorités."}</span>
                </span>
                <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => aller({ ecran: "comparer" })}>Comparer</button>
              </>
            )}
          </div>
        </section>
      </div>

      <Section titre="Vos communes et vos logements" id="lieux" action={<button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer" })}>Comparer les communes</button>}>
        <div className={x.candidats}>
          {LIEUX.map((l) => {
            const ouvertes = etat.version === "envies" ? etat.envies.flatMap(questionsDe).filter((q) => q.lieu === l.id && !etat.reponses[q.id]).length : 0;
            return (
              <article key={l.id} className={x.candidat} aria-labelledby={`c-${l.id}`}>
                <span className={v.groupeGlyphe} aria-hidden><GlypheGrain grain="commune" taille={22} /></span>
                <div className={x.candidatCorps}>
                  <h3 className={x.candidatNom} id={`c-${l.id}`}><button type="button" className={v.lien} onClick={() => aller({ ecran: "lieu", id: l.id })}>{l.nom}</button></h3>
                  <p className={s.nuance}>{l.population} · lecture de la commune</p>
                  <p className={s.dense}><strong className={s.encre}>{l.annonce.libelle}</strong> · {l.annonce.prix} · {l.annonce.surface} <span className={x.fictif}>annonce fictive</span></p>
                  {etat.envies.length && etat.version === "envies" ? (
                    <p className={s.dense}>{ordonner(etat.envies).map((e) => { const lecture = lireLieu(e, l.id, etat.reponses); return `${titreEnvie(e)} : ${lecture.court}. ${lecture.reserve}`; }).join(" · ")}</p>
                  ) : null}
                </div>
                <div className={x.candidatGeste}>
                  <button type="button" className={s.bouton} onClick={() => aller({ ecran: "lieu", id: l.id })}>{ouvertes ? `${ouvertes} vérification${ouvertes > 1 ? "s" : ""} à faire` : "Ouvrir"}</button>
                </div>
              </article>
            );
          })}
        </div>
        <p className={s.nuance}>Vous vivez aujourd&apos;hui à {AUJOURDHUI_LIEU.nom}, dans {AUJOURDHUI_LIEU.detail} <span className={x.fictif}>déclaré</span>.</p>
      </Section>

      {!etat.envies.length ? (
        <div className={x.invitation}>
          <div className={x.invitationTexte}>
            <p className={x.invitationTitre}>Pour aller plus loin, si vous le souhaitez</p>
            <p className={s.nuance}>Y a-t-il quelque chose à quoi vous aimeriez donner plus de place, ou que vous ne voulez pas perdre en changeant de lieu ?</p>
          </div>
          <button type="button" className={s.bouton} onClick={() => aller({ ecran: "projet" }, "envies")}>Ajouter une envie</button>
        </div>
      ) : null}
    </>
  );
}

// ── Mon Projet ───────────────────────────────────────────────────────────────────────────────

function Projet({ api }: { api: Api }) {
  const { etat, envoyer, aller } = api;
  const [ouvert, setOuvert] = useState(!etat.envies.length);
  return (
    <>
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>Mon Projet</h1>
        <p className={s.nuance}>Vos priorités orientent chaque lecture ; aucun score ne les remplace.</p>
      </div>
      <Section titre="Ce que vous cherchez" id="cherchez">
        <p className={s.corps}>{PROJET.intention} un logement, pour {PROJET.budget} <span className={x.fictif}>déclaré</span>.</p>
        <div className={v.projetColonnes}>
          <div>
            <p className={v.projetCle}>Ce qui compte</p>
            <ul className={v.projetListe}>{LIGNES_PROJET.map((l) => <li key={l.cle}>{l.libelle}<span className={v.beaucoup}> · {l.poids.replace(" pour vous", "")}</span></li>)}</ul>
          </div>
          <div>
            <p className={v.projetCle}>Là où vous vivez aujourd&apos;hui</p>
            <ul className={v.projetListe}><li>{AUJOURDHUI_LIEU.nom}, {AUJOURDHUI_LIEU.detail}</li></ul>
            <p className={s.nuance}>Sert de point de comparaison : ce que vous gagneriez, ce que vous perdriez.</p>
          </div>
        </div>
      </Section>

      <Section titre="Ce que vous aimeriez y vivre" id="envies" sous="Facultatif. Une envie ne filtre aucun lieu et ne note personne : elle ajoute une question à vos comparaisons.">
        {etat.envies.length ? (
          <ul className={x.envies}>
            {ordonner(etat.envies).map((e) => {
              const c = catalogue(e);
              return (
                <li key={e.id} className={x.envie}>
                  <div className={x.envieTete}>
                    <span className={x.envieNom}>{titreEnvie(e)}</span>
                    <span className={x.intention} data-intention={e.intention}>{LIBELLE_INTENTION[e.intention]}</span>
                  </div>
                  <p className={s.dense}>{LIBELLE_RYTHME[e.rythme]}{c?.porteeUtile ? `, à ${e.limite} minutes au plus` : ""}{c ? <> · aujourd&apos;hui : {c.aujourdhui.texte.toLowerCase()} <span className={x.fictif}>déclaré</span></> : null}</p>
                  <p className={s.nuance}>{c ? `futur•e sait lire : ${c.capacite.lit.toLowerCase()}` : "futur•e ne sait pas lire cette envie. Elle reste ici, avec vos propres vérifications."}</p>
                  <div className={v.ligneGestes}>
                    <button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "comparer" }, `envie-${e.id}`)}>Voir ce qu&apos;elle change entre vos lieux</button>
                    <button type="button" className={`${s.action} ${v.cible}`} onClick={() => envoyer({ type: "retirer", id: e.id })}>Retirer</button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className={s.dense}>Aucune pour l&apos;instant. Votre Projet se lit très bien sans.</p>}
        {ouvert ? <Saisie api={api} fermer={() => setOuvert(false)} /> : etat.envies.length < 3 ? (
          <div className={v.ligneGestes} style={{ marginTop: 18 }}><button type="button" className={s.bouton} onClick={() => setOuvert(true)}>+ Ajouter une envie</button></div>
        ) : <p className={s.nuance} style={{ marginTop: 14 }}>Trois envies au plus : au-delà, la comparaison ne se lit plus.</p>}
      </Section>
    </>
  );
}

function Saisie({ api, fermer }: { api: Api; fermer: () => void }) {
  const id = useId();
  const [texte, setTexte] = useState("");
  const [intention, setIntention] = useState<Intention | null>(null);
  const [rythme, setRythme] = useState<Rythme | null>(null);
  const propre = texte.trim();
  const cle = propre.length > 2 ? reconnaitre(propre) : null;
  const c = cle && cle !== "libre" ? CATALOGUE[cle] : null;
  const deja = cle && cle !== "libre" && api.etat.envies.some((e) => e.cle === cle);
  return (
    <form className={x.saisie} onSubmit={(e) => { e.preventDefault(); if (propre && intention && rythme && !deja) { api.envoyer({ type: "ajouter", texte: propre, intention, rythme }); fermer(); } }}>
      <p className={x.saisieTitre}>J&apos;aimerais donner plus de place à…</p>
      <label className={x.saisieChamp}>
        <span className={s.etiquette}>Dites-le avec vos mots, le plus concrètement possible</span>
        <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={120} placeholder="aller plus souvent au théâtre" autoFocus />
      </label>
      <p className={x.exemples}>
        <span className={s.nuance}>Par exemple :</span>
        {EXEMPLES.map((ex) => <button key={ex.texte} type="button" className={`${s.action} ${v.cible}`} onClick={() => setTexte(ex.texte)}>{ex.texte}</button>)}
      </p>
      {cle ? (
        <div className={x.compris} aria-live="polite">
          <span className={x.comprisCle}>Ce que futur•e en comprend</span>
          {c ? (
            <>
              <p className={s.dense}><strong className={s.encre}>{c.compris}.</strong> Il sait lire : {c.capacite.lit.toLowerCase()}</p>
              <p className={s.nuance}>Il ne lira pas : {c.capacite.neLitPas.toLowerCase()}</p>
            </>
          ) : (
            <p className={s.dense}>futur•e n&apos;a pas de donnée pour lire cette envie. Vous pouvez la garder dans votre Projet : elle apparaîtra dans vos comparaisons comme une question à vous, sans conclusion.</p>
          )}
          {deja ? <p className={v.erreur}>Cette envie est déjà dans votre Projet.</p> : null}
        </div>
      ) : null}
      <Selecteur id={`${id}-i`} question="Est-ce déjà dans votre vie aujourd'hui ?" valeur={intention ?? undefined} onChoisir={setIntention}
        options={(["garder", "developper", "decouvrir"] as const).map((k) => ({ valeur: k, libelle: QUESTION_INTENTION[k] }))} />
      <Selecteur id={`${id}-r`} question="À quel rythme l'imaginez-vous ?" valeur={rythme ?? undefined} onChoisir={setRythme}
        options={(["semaine", "mois", "annee"] as const).map((k) => ({ valeur: k, libelle: LIBELLE_RYTHME[k] }))} />
      <div className={v.ligneGestes}>
        <button type="submit" className={`${s.bouton} ${s.boutonMarque}`} disabled={!propre || !intention || !rythme || !!deja}>Ajouter à mon Projet</button>
        <button type="button" className={`${s.action} ${v.cible}`} onClick={fermer}>Annuler</button>
        <span className={s.nuance}>Deux questions, pas davantage. Vous pourrez tout modifier.</span>
      </div>
    </form>
  );
}

// ── Comparer ─────────────────────────────────────────────────────────────────────────────────

function Comparer({ api }: { api: Api }) {
  const { etat, aller } = api;
  const envies = ordonner(etat.envies);
  const minimale = etat.version === "minimale";
  const lecture = aRetenir(envies, etat.reponses);
  const utile = minimale ? null : questionUtile(envies, etat.reponses);
  return (
    <>
      <div className={w.tete}><h1 className={`${s.titre} ${w.titre}`} tabIndex={-1} data-titre-vue>Comparer vos communes</h1></div>
      <div className={w.compares}>
        <div className={w.comparesLigne}>
          <p className={w.comparesNoms}><span className={w.comparesCle}>Vous comparez</span><strong>{LIEUX[0]!.nom}</strong> <span className={w.et}>et</span> <strong>{LIEUX[1]!.nom}</strong></p>
        </div>
      </div>

      <section className={w.aRetenir} aria-labelledby="retenir-t">
        <h2 className={w.aRetenirTitre} id="retenir-t">À retenir</h2>
        <ul className={w.retenirListe}>
          <Retenir genre="fait" titre="Ce que votre Projet distingue déjà">{lier("À Angers, 54 % des actifs vont travailler en voiture, contre 81 % à Chalonnes-sur-Loire. Les maisons vendues sont plus chères au mètre carré à Angers ; Chalonnes est moins bâtie. Ces faits communaux ne décrivent pas vos propres déplacements.")}</Retenir>
          {minimale && envies.length ? <Retenir genre="incertain" titre="Vos envies">{lier("Sur l'index local examiné, ces envies sont non mesurées ou ne distinguent pas ces communes. Elles restent des notes à vous.")}</Retenir> : null}
          {!minimale && lecture.perte ? <Retenir genre="fait" titre="Le compromis avec votre habitude actuelle">{lier(lecture.perte)}</Retenir> : null}
          {!minimale && lecture.distinguent.length ? <Retenir genre="fait" titre="Ce que vos envies changent">{lecture.distinguent.map((p, i) => <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>{lier(p)}</p>)}</Retenir> : null}
          {!minimale && lecture.aVerifier.length ? <Retenir genre="incertain" titre="Ce qui peut encore changer votre choix">{lecture.aVerifier.map((p, i) => <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>{lier(p)}</p>)}</Retenir> : null}
          {!minimale && lecture.nonLus.length ? <Retenir genre="incertain" titre="Ce que futur•e ne sait pas lire">{lecture.nonLus.map((p, i) => <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>{lier(p)}</p>)}</Retenir> : null}
        </ul>
        {utile ? (
          <div className={w.prochain}>
            <p className={w.prochainTexte}><Signe genre="action" /><span><span className={w.prochainCle}>Le plus utile maintenant</span>{lier(utile.question.question)}</span></p>
            <Agir principal onClick={() => aller({ ecran: "comparer" }, `q-${utile.question.id}`)}>Voir la question</Agir>
          </div>
        ) : !envies.length ? (
          <div className={w.prochain}>
            <p className={w.prochainTexte}><Signe genre="action" /><span><span className={w.prochainCle}>Pour aller plus loin, si vous le souhaitez</span>Dire ce que vous aimeriez vivre dans ce nouveau lieu, ou ne pas y perdre.</span></p>
            <Agir onClick={() => aller({ ecran: "projet" }, "envies")}>Ajouter une envie</Agir>
          </div>
        ) : null}
      </section>

      <Section titre="Pour votre Projet" id="projet" sous="À l'échelle des communes. Aucun logement n'est encore analysé à son adresse.">
        <div className={x.lignesProjet}>
          {LIGNES_PROJET.map((l) => (
            <div key={l.cle} className={x.ligneProjet}>
              <p className={x.ligneProjetNom}>{l.libelle}<span className={x.ligneProjetPoids}>{l.poids}</span></p>
              {LIEUX.map((c) => <div key={c.id} className={x.cell}><span className={x.cellNom} style={{ display: "block" }}>{c.nom}</span><UnFait fait={l.lectures[c.id]} /></div>)}
            </div>
          ))}
        </div>
      </Section>

      {envies.length ? (
        <Section titre="Pour ce que vous aimeriez y vivre" id="vos-envies" sous={minimale ? "Version minimale : les indicateurs de l'index local examiné, et vos notes. Version publiée non vérifiée." : "Départs différents : un point du quartier de la Doutre à Angers, le centre communal à Chalonnes. Ces temps ne sont pas ceux des logements fictifs. Transports collectifs non calculés."}>
          {!minimale && envies.length > 1 ? <Tableau api={api} envies={envies} /> : null}
          {envies.map((e) => (minimale ? <BlocMinimal key={e.id} api={api} envie={e} /> : <BlocEnvie key={e.id} api={api} envie={e} seule={envies.length === 1} ouvertAuDepart={envies.length === 1 || utile?.envie.id === e.id || (!utile && e === envies[0])} />))}
        </Section>
      ) : null}

      {envies.length ? <ToutesSources envies={envies} /> : null}
    </>
  );
}

const MOT_ETAT: Record<LecturePortee["etat"], string> = { sur_place: "Déclaré sur place", a_portee: "Trajet dans votre limite", hors_portee: "Au-delà de votre limite", non_su: "futur•e ne sait pas" };

function Tableau({ api, envies }: { api: Api; envies: Envie[] }) {
  return (
    <div className={x.table} role="table" aria-label="Vos envies, lieu par lieu">
      <div className={x.rang} data-tete role="row">
        <span role="columnheader" className={x.rangCol}><span className={x.sr}>Envie</span></span>
        <span role="columnheader" className={x.rangCol}>Aujourd&apos;hui<span className={x.rangColSous}>{AUJOURDHUI_LIEU.nom}, déclaré par vous</span></span>
        {LIEUX.map((l) => <span key={l.id} role="columnheader" className={x.rangCol}>{l.nom}<span className={x.rangColSous}>{l.depart}</span></span>)}
      </div>
      {envies.map((e) => {
        const c = catalogue(e);
        return (
          <div key={e.id} className={x.rang} role="row">
            <div className={x.rangNom} role="rowheader">
              <button type="button" className={x.rangLien} onClick={() => api.aller({ ecran: "comparer" }, `envie-${e.id}`)}>{titreEnvie(e)}</button>
              <span className={x.intention} data-intention={e.intention}>{LIBELLE_INTENTION[e.intention]}</span>
            </div>
            <div className={x.cell} role="cell">
              <span className={x.cellNom}>Aujourd&apos;hui</span>
              <span className={x.etat}><span className={x.pastille} data-etat="declare" aria-hidden />{c ? (c.aujourdhui.minutes != null ? `${c.aujourdhui.minutes} min ${c.aujourdhui.mode ? MODE[c.aujourdhui.mode] : ""}` : "Pas encore") : "Non renseigné"}</span>
            </div>
            {LIEUX.map((l) => {
              const r = lireLieu(e, l.id, api.etat.reponses);
              return (
                <div key={l.id} className={x.cell} data-etat={r.etat} role="cell">
                  <span className={x.cellNom}>{l.nom}</span>
                  <span className={x.etat}><span className={x.pastille} data-etat={r.etat} aria-hidden />{MOT_ETAT[r.etat]}</span>
                  <span className={x.cellSous}>{r.court}{r.deJustesse ? ", tout près de votre limite" : ""}</span>
                  <span className={x.cellSous}>{r.reserve}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function UnFait({ fait }: { fait: Fait }) {
  return (
    <span className={x.fait}>
      <span>{lier(fait.texte)}</span>
      <span className={x.faitMeta}>{NOM_ECHELLE[fait.echelle]} · {fait.illustratif ? "déclaré dans l'annonce fictive" : NOM_STATUT[fait.statut]}{fait.source ? ` · ${SOURCES[fait.source].nom.split(",")[0]}` : ""}</span>
    </span>
  );
}

function Groupe({ genre, titre, faits, vide }: { genre: "possible" | "demande" | "inconnu"; titre: string; faits: Fait[]; vide: string }) {
  return (
    <div className={x.groupe} data-genre={genre}>
      <p className={x.groupeCle}>{titre}</p>
      {faits.length ? <ul className={x.faits}>{faits.map((f, i) => <li key={i}><UnFait fait={f} /></li>)}</ul> : <p className={x.vide}>{vide}</p>}
    </div>
  );
}

function BlocEnvie({ api, envie, ouvertAuDepart, seule }: { api: Api; envie: Envie; ouvertAuDepart: boolean; seule: boolean }) {
  const { etat, envoyer } = api;
  const id = useId();
  const [ouvert, setOuvert] = useState(ouvertAuDepart);
  useEffect(() => {
    // Un lien vers ce bloc ou vers l'une de ses questions l'ouvre.
    const ouvrir = (ev: Event) => { const a = (ev as CustomEvent<string>).detail; if (a === `envie-${envie.id}` || questionsDe(envie).some((q) => a === `q-${q.id}`)) setOuvert(true); };
    window.addEventListener("envies:ouvrir", ouvrir);
    return () => window.removeEventListener("envies:ouvrir", ouvrir);
  }, [envie]);
  const c = catalogue(envie);
  const comp = comparer(envie, etat.reponses);
  const questions = questionsDe(envie);
  const principale = questions.find((q) => q.departage) ?? questions[0];
  const autres = questions.filter((q) => q !== principale);

  if (!c) {
    return (
      <article className={x.bloc} id={`envie-${envie.id}`} aria-labelledby={`${id}-t`}>
        <div className={x.blocTete}>
          <h3 className={x.blocTitre} id={`${id}-t`} tabIndex={-1}>{titreEnvie(envie)}</h3>
          <p><span className={x.intention} data-intention={envie.intention}>{LIBELLE_INTENTION[envie.intention]}</span></p>
        </div>
        <div className={x.ecart} data-ecart="non_lu"><span className={x.ecartCle}>{TITRE_ECART.non_lu}</span><p>{lier(comp.phrase)}</p></div>
        <div className={x.groupe} data-genre="inconnu">
          <p className={x.groupeCle}>Le seul fait disponible, et pourquoi il ne suffit pas</p>
          <ul className={x.faits}><li className={x.fait}><span>{lier(HORS_LECTURE.fait)}</span><span className={x.faitMeta}>commune · recensé · {SOURCES[HORS_LECTURE.source].nom}</span></li></ul>
          <p className={s.nuance}>{lier(HORS_LECTURE.limite)}</p>
        </div>
        <label className={x.note}>
          <span className={s.etiquette}>Votre propre vérification, pour ne pas l&apos;oublier</span>
          <textarea value={etat.notes[envie.id] ?? ""} onChange={(e) => envoyer({ type: "noter", id: envie.id, texte: e.target.value })} maxLength={400} placeholder="Par exemple : demander à la mairie de chaque commune comment les habitants participent aux décisions." />
        </label>
        <p className={s.nuance}>Gardée dans votre Projet, sans conclusion de futur•e.</p>
      </article>
    );
  }

  return (
    <article className={x.bloc} id={`envie-${envie.id}`} aria-labelledby={`${id}-t`}>
      <div className={x.blocTete}>
        <h3 className={x.blocTitre} id={`${id}-t`} tabIndex={-1}>{c.compris}</h3>
        <p className={x.blocSous}><span className={x.intention} data-intention={envie.intention}>{LIBELLE_INTENTION[envie.intention]}</span>{c.porteeUtile ? <span className={s.nuance}>{LIBELLE_RYTHME[envie.rythme]}, {envie.limite} min au plus</span> : null}</p>
      </div>

      {!ouvert ? (
        <>
          <div className={x.ecart} data-ecart={comp.ecart}><span className={x.ecartCle}>{TITRE_ECART[comp.ecart]}</span><p>{lier(comp.phrase)}</p></div>
          <div className={v.ligneGestes}><button type="button" className={s.bouton} aria-expanded={false} onClick={() => setOuvert(true)}>Voir la lecture et les vérifications</button></div>
        </>
      ) : (
      <>

      {c.porteeUtile ? (
        <>
        <p className={s.nuance}>20, 40 ou 60 min au départ : hypothèses ajustables, pas des normes. Changer le rythme conserve votre limite ; ajustez-la si nécessaire.</p>
        <div className={x.reglages}>
          <Selecteur id={`${id}-r`} question="À quel rythme ?" valeur={envie.rythme} onChoisir={(r) => envoyer({ type: "regler", id: envie.id, rythme: r })}
            options={(["semaine", "mois", "annee"] as const).map((k) => ({ valeur: k, libelle: LIBELLE_RYTHME[k] }))} />
          <Selecteur id={`${id}-l`} question="Jusqu'où iriez-vous, à ce rythme ?" valeur={String(envie.limite)} onChoisir={(l) => envoyer({ type: "regler", id: envie.id, limite: Number(l) })}
            options={LIMITES.map((k) => ({ valeur: String(k), libelle: `${k} min` }))} />
        </div>
        </>
      ) : null}

      <Regle envie={envie} lectures={comp.lectures} />

      <div className={x.ecart} data-ecart={comp.ecart} aria-live="polite">
        <span className={x.ecartCle}>{TITRE_ECART[comp.ecart]}</span>
        <p>{lier(comp.phrase)}</p>
      </div>

      {principale ? <UneQuestion api={api} question={principale} principale /> : null}

      <details className={`${s.details} ${x.detail}`} open={seule}>
      <summary>Lieu par lieu : les repères, les compromis, les inconnues</summary>
      <p className={x.capacite}>{lier(`futur•e sait lire : ${c.capacite.lit.toLowerCase()} Il ne lit pas : ${c.capacite.neLitPas.toLowerCase()}`)}</p>
      <div className={x.lieux}>
        {comp.lectures.map((l) => {
          const f = faceAAujourdhui(envie, l);
          return (
            <div key={l.lieu} className={x.lieuCol}>
              <h4 className={x.lieuNom}>{l.nom}</h4>
              <Groupe genre="possible" titre="Les repères recensés ou déclarés" faits={l.lecture!.possible} vide="Rien d'établi. Ce n'est pas un défaut du lieu : futur•e n'a pas de quoi le dire." />
              <Groupe genre="demande" titre="Ce qu'il demande" faits={l.lecture!.demande} vide="Rien de particulier d'après ce qui est connu." />
              <Groupe genre="inconnu" titre="Ce que futur•e ne sait pas" faits={l.lecture!.inconnu} vide="Rien d'important." />
              {l.verifiees.length ? (
                <div className={x.groupe} data-genre="verifie">
                  <p className={x.groupeCle}>Vos réponses personnelles</p>
                  <ul className={x.faits}>{l.verifiees.map((z) => <li key={z.question.id} className={x.fait}><span>{lier(texteReponse(z))}</span><span className={x.faitMeta}>réponse simulée, sans source vérifiée</span></li>)}</ul>
                </div>
              ) : null}
              <div className={x.change}><span className={x.changeCle}>{TITRE_CHANGEMENT[f.changement]}</span><span>{lier(f.phrase)}</span></div>
            </div>
          );
        })}
      </div>
      </details>

      {autres.length ? (
        <details className={s.details}>
          <summary>{autres.length === 1 ? "Une autre vérification utile" : `${autres.length} autres vérifications utiles`}</summary>
          <div className={x.autres}>{autres.map((q) => <UneQuestion key={q.id} api={api} question={q} />)}</div>
        </details>
      ) : null}

      <details className={s.details}>
        <summary>Ce que l&apos;analyse d&apos;une adresse ajouterait pour cette envie</summary>
        <div className={x.adresse}>
          <ul>{c.adresse.ajouterait.map((a) => <li key={a}>{lier(a)}</li>)}</ul>
          <p className={s.nuance}>{lier(c.adresse.neDiraPas)} L&apos;analyse d&apos;adresse est l&apos;offre existante de futur•e ; ce prototype ne la lance pas.</p>
        </div>
      </details>
      {!seule ? <div className={v.ligneGestes}><button type="button" className={`${s.action} ${v.cible}`} onClick={() => setOuvert(false)}>Replier</button></div> : null}
      </>
      )}
    </article>
  );
}

function UneQuestion({ api, question, principale = false }: { api: Api; question: Question; principale?: boolean }) {
  const { etat, envoyer } = api;
  const rep = etat.reponses[question.id];
  const choisie = rep ? question.reponses.find((r) => r.valeur === rep.valeur) : undefined;
  return (
    <div className={principale ? x.question : x.autre} id={`q-${question.id}`}>
      {principale ? <p className={x.questionCle}><Signe genre="incertain" /> {question.departage ? "La question qui peut départager" : "La vérification la plus utile"}</p> : null}
      <h4 className={x.questionTexte} tabIndex={-1} style={{ margin: 0 }}>{lier(question.question)}</h4>
      <p className={s.dense}>{lier(question.pourquoi)}</p>
      <p className={x.questionMeta}>{lieuDe(question.lieu).nom} · {question.moment} · à demander à : {question.aQui.toLowerCase()}</p>
      <div className={x.reponses} role="group" aria-label="Votre réponse">
        {question.reponses.map((r) => (
          <button key={r.valeur} type="button" className={x.reponse} aria-pressed={rep?.valeur === r.valeur} onClick={() => envoyer({ type: "repondre", question: question.id, valeur: rep?.valeur === r.valeur ? null : r.valeur })}>{r.libelle}</button>
        ))}
      </div>
      {choisie && rep ? (
        <div className={x.effet} aria-live="polite">
          <p className={s.dense}><span className={x.effetCle}>Ce que cela change pour vous</span>{lier(choisie.effet)}</p>
          {choisie.reste ? <p className={s.dense}><span className={x.effetCle}>Ce qui reste inconnu</span>{lier(choisie.reste)}</p> : null}
          <p className={s.nuance}>Votre réponse du {dateFr(rep.date)}, simulée dans ce prototype, sans source renseignée ni vérifiée. Elle s&apos;ajoute à la lecture ; les données publiques ne changent pas.</p>
        </div>
      ) : <p className={s.nuance}>Répondez quand vous saurez. Dans ce prototype, choisissez une réponse pour voir ce qu&apos;elle changerait.</p>}
    </div>
  );
}

// ── La règle de portée ───────────────────────────────────────────────────────────────────────

const MAX = 60;
const pc = (m: number) => `${Math.min(100, Math.round((m / MAX) * 1000) / 10)}%`;

function Regle({ envie, lectures }: { envie: Envie; lectures: LecturePortee[] }) {
  const c = catalogue(envie)!;
  const portee = c.porteeUtile;
  const marques = portee ? [0, 15, 30, 45, 60].filter((m) => Math.abs(m - envie.limite) > 6) : [];
  return (
    <div className={x.regle} role="group" aria-label={`Règle de portée : ${c.compris}`}>
      <div className={x.regleLegende} aria-hidden>
        <span><span className={x.pastille} data-etat="declare" /> déclaré par vous</span>
        <span><span className={x.repere} data-mode="a_pied" style={{ position: "static", margin: 0, width: 12, height: 12 }} /> à pied</span>
        <span><span className={x.repere} data-mode="en_voiture" style={{ position: "static", margin: 0, width: 12, height: 12 }} /> en voiture</span>
        {portee ? <span><span style={{ display: "inline-block", width: 0, height: 14, borderLeft: "2px dashed var(--r-encre)" }} /> votre limite</span> : null}
      </div>

      <div className={x.ligne}>
        <div className={x.ligneNom}><strong>Aujourd&apos;hui</strong><span className={x.ligneDepart}>{AUJOURDHUI_LIEU.nom}, déclaré par vous</span></div>
        <div>
          {portee && c.aujourdhui.minutes != null ? (
            <div className={x.piste}>
              <span className={x.trait} style={{ width: pc(c.aujourdhui.minutes) }} />
              <span className={x.limite} style={{ left: pc(envie.limite) }} />
              <span className={x.repere} data-declare style={{ left: pc(c.aujourdhui.minutes) }} />
            </div>
          ) : null}
          <p className={x.ligneInconnu} style={{ color: "var(--r-texte)" }}>{c.aujourdhui.texte}</p>
        </div>
      </div>

      {lectures.map((l) => {
        const reperes = l.lecture?.reperes ?? [];
        const proche = l.plusProche;
        const dehors = (m: number) => portee && m > envie.limite;
        return (
          <div key={l.lieu} className={x.ligne}>
            <div className={x.ligneNom}><strong>{l.nom}</strong><span className={x.ligneDepart}>{lieuDe(l.lieu).depart}</span></div>
            <div>
              {portee || reperes.length === 0 ? (
                <div className={`${x.piste} ${reperes.length ? "" : x.pisteInconnue}`}>
                  {proche ? <span className={x.trait} style={{ width: pc(Math.min(proche.minutes, envie.limite)) }} /> : null}
                  {proche && dehors(proche.minutes) ? <span className={x.traitAuDela} style={{ left: pc(envie.limite), width: `calc(${pc(proche.minutes)} - ${pc(envie.limite)})` }} /> : null}
                  {portee ? <span className={x.limite} style={{ left: pc(envie.limite) }} /> : null}
                  {reperes.map((r) => <span key={r.nom} className={x.repere} data-mode={r.mode} data-dehors={dehors(r.minutes) ? "" : undefined} style={{ left: pc(r.minutes) }} />)}
                </div>
              ) : null}
              {reperes.length ? (
                <ul className={x.ligneListe}>
                  {reperes.map((r) => (
                    <li key={r.nom} data-dehors={dehors(r.minutes) ? "" : undefined}>
                      <strong>{r.minutes === 0 ? "sur place" : `${r.minutes} min ${MODE[r.mode]}`}</strong>
                      <span>{r.nom}{r.precision ? `, ${r.precision}` : ""}{r.illustratif ? " (annonce fictive)" : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={x.ligneInconnu}>{l.lecture?.inconnuRegle ?? "Aucun repère connu de futur•e."}</p>}
            </div>
          </div>
        );
      })}

      {portee ? (
        <div className={x.ligne} style={{ paddingTop: 4, paddingBottom: 0 }} aria-hidden>
          <span />
          <div className={x.graduations}>
            {marques.map((m) => <span key={m} data-bord={m === 0 ? "debut" : m === 60 ? "fin" : undefined} style={{ left: pc(m) } as CSSProperties}>{m === 60 ? "60 min et plus" : m === 0 ? "0" : `${m} min`}</span>)}
            <span className={x.graduationLimite} data-bord={envie.limite >= 50 ? "fin" : undefined} style={{ left: pc(envie.limite) }}>votre limite : {envie.limite} min</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Version minimale : le moteur actuel et une note ──────────────────────────────────────────

const MOT_MOTEUR = { ne_distingue_pas: "Sur l'index local examiné, ce critère ne distingue pas les deux communes", non_mesure: "Les critères de l'index local examiné ne mesurent pas cela", distingue: "Sur l'index local examiné, ce critère distingue les deux communes" } as const;

function BlocMinimal({ api, envie }: { api: Api; envie: Envie }) {
  const { etat, envoyer } = api;
  const id = useId();
  const c = catalogue(envie);
  return (
    <article className={x.bloc} id={`envie-${envie.id}`} aria-labelledby={`${id}-t`}>
      <div className={x.blocTete}>
        <h3 className={x.blocTitre} id={`${id}-t`} tabIndex={-1}>{titreEnvie(envie)}</h3>
        <p className={s.nuance}>Gardée comme une note de votre Projet.</p>
      </div>
      <div className={x.minimal}>
        <div className={x.ecart} data-ecart={c?.moteurActuel.verdict === "distingue" ? "distingue" : "non_lu"}>
          <span className={x.ecartCle}>{c ? MOT_MOTEUR[c.moteurActuel.verdict] : MOT_MOTEUR.non_mesure}</span>
          <p>{lier(c ? c.moteurActuel.lecture : "Aucun critère du moteur ne correspond à cette envie.")}</p>
        </div>
        {c?.moteurActuel.critere ? <p className={s.nuance}>Critère utilisé : « {c.moteurActuel.critere} ». Source : {SOURCES.index.nom}. {SOURCES.index.limite}</p> : null}
        <label className={x.note}>
          <span className={s.etiquette}>Votre note ou votre question, pour chaque lieu</span>
          <textarea value={etat.notes[envie.id] ?? ""} onChange={(e) => envoyer({ type: "noter", id: envie.id, texte: e.target.value })} maxLength={400} placeholder="Ce que vous voulez vérifier vous-même." />
        </label>
      </div>
    </article>
  );
}

// ── Sources ──────────────────────────────────────────────────────────────────────────────────

function sourcesDe(envies: Envie[]): CleSource[] {
  const cles = new Set<CleSource>(["mobpro", "dvf", "oso"]);
  for (const e of envies) {
    const c = catalogue(e);
    if (!c) { cles.add(HORS_LECTURE.source); continue; }
    for (const l of Object.values(c.lieux)) {
      for (const r of l.reperes) if (r.source) cles.add(r.source);
      for (const f of [...l.possible, ...l.demande, ...l.inconnu]) if (f.source) cles.add(f.source);
    }
  }
  return [...cles];
}

function ToutesSources({ envies }: { envies: Envie[] }) {
  return (
    <Preuves titre="D'où viennent ces informations, et ce qu'elles ne disent pas">
      <ul className={x.sources}>
        {sourcesDe(envies).map((k) => <li key={k}><strong>{SOURCES[k].nom}</strong><span>{SOURCES[k].detail}</span><span>Limite : {SOURCES[k].limite}</span></li>)}
      </ul>
    </Preuves>
  );
}

// ── Fiche d'un lieu ──────────────────────────────────────────────────────────────────────────

function FicheLieu({ api, id }: { api: Api; id: IdLieu }) {
  const { etat, aller } = api;
  const l = lieuDe(id);
  const envies = ordonner(etat.envies);
  const minimale = etat.version === "minimale";
  const questions = minimale ? [] : envies.flatMap((e) => questionsDe(e).filter((q) => q.lieu === id).map((q) => ({ e, q })));
  return (
    <>
      <nav aria-label="Fil d'Ariane" className={v.fil}>
        <span className={v.filSeg}><button type="button" className={v.filLien} onClick={() => aller({ ecran: "ensemble" })}>Ma décision</button></span>
        <span className={v.filSeg}><span aria-hidden className={v.filSep}>/</span><span aria-current="page">{l.nom}</span></span>
      </nav>
      <div className={v.ficheTete}>
        <span className={v.communeGlyphe} aria-hidden><GlypheGrain grain="commune" taille={56} /></span>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>La commune</span></p>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{l.nom}</h1>
          <p className={s.nuance}>{l.population} · lecture de la commune · aucune adresse analysée</p>
        </div>
      </div>
      <div className={x.annonce}>
        <p className={s.dense}><strong className={s.encre}>{l.annonce.libelle}</strong> · {l.annonce.prix} · {l.annonce.surface} <span className={x.fictif}>annonce fictive</span></p>
        <p className={s.nuance}>{l.annonce.note}</p>
      </div>

      <Section titre="Pour votre Projet" id="projet" sous="À l'échelle de la commune.">
        <div className={x.lignesProjet}>
          {LIGNES_PROJET.map((p) => <div key={p.cle} className={x.ligneProjet} style={{ gridTemplateColumns: undefined }}><p className={x.ligneProjetNom}>{p.libelle}<span className={x.ligneProjetPoids}>{p.poids}</span></p><div className={x.cell} style={{ gridColumn: "2 / -1", display: "grid", gridTemplateColumns: "1fr" }}><UnFait fait={p.lectures[id]} /></div></div>)}
        </div>
      </Section>

      {envies.length && !minimale ? (
        <Section titre="Pour ce que vous aimeriez y vivre" id="envies-lieu">
          {envies.map((e) => {
            const r = lireLieu(e, id, etat.reponses);
            const f = faceAAujourdhui(e, r);
            return (
              <div key={e.id} className={x.lieuEnvie}>
                <p className={x.envieTete}><span className={x.envieNom}>{titreEnvie(e)}</span><span className={x.intention} data-intention={e.intention}>{LIBELLE_INTENTION[e.intention]}</span></p>
                <p className={s.dense}><span className={x.etat}><span className={x.pastille} data-etat={r.etat} aria-hidden /><strong className={s.encre}>{MOT_ETAT[r.etat]}</strong></span> · {r.court}</p>
                <p className={s.dense}>{r.reserve}</p>
                <p className={s.dense}>{TITRE_CHANGEMENT[f.changement]} · {lier(f.phrase)}</p>
                <div className={v.ligneGestes}><button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "comparer" }, `envie-${e.id}`)}>Voir le détail, face à {LIEUX.find((z) => z.id !== id)!.nom}</button></div>
              </div>
            );
          })}
        </Section>
      ) : null}

      <Section titre="À vérifier pour ce lieu" id="verifier" sous={questions.length ? "Peu de questions, chacune parce que sa réponse peut changer votre lecture." : undefined}>
        {questions.length ? (
          <ul className={x.verifs}>
            {questions.map(({ e, q }) => {
              const rep = etat.reponses[q.id];
              const choisie = rep ? q.reponses.find((z) => z.valeur === rep.valeur) : undefined;
              return (
                <li key={q.id} className={x.verif}>
                  <div className={x.verifTexte}>
                    <p className={s.dense}><strong className={s.encre}>{lier(q.question)}</strong></p>
                    <p className={s.nuance}>Pour « {titreEnvie(e).toLowerCase()} » · {q.moment}{choisie && rep ? ` · répondu le ${dateFr(rep.date)} : ${choisie.libelle.toLowerCase()}` : ""}</p>
                  </div>
                  <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer" }, `q-${q.id}`)}>{rep ? "Revoir" : "Répondre"}</button>
                </li>
              );
            })}
          </ul>
        ) : <p className={s.dense}>{envies.length && !minimale ? "Aucune vérification pour ce lieu." : "Rien pour l'instant. Les vérifications apparaissent quand une question reste ouverte."}</p>}
      </Section>

      <div className={v.piedFiche}>
        <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer" })}>Comparer avec {LIEUX.find((z) => z.id !== id)!.nom}</button>
      </div>
    </>
  );
}
