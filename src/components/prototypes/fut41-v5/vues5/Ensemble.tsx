"use client";
// VUE D'ENSEMBLE, V5 · l'ordre de lecture est l'ordre des questions d'une personne :
//   1. où en suis-je ? (titre, Projet en une ligne, trois phrases au plus)
//   2. que faire maintenant ? (trois gestes au plus, chacun avec son bouton)
//   3. mes communes et mes logements (visibles sans défiler sur ordinateur), et l'accès à Comparer.
// Aucun tableau de bord, aucun compteur ; aucun ordre de mérite : on range par commune, ou sur une
// dimension nommée (prix, surface, trajet mesuré) qui dit d'où vient sa valeur.
import { useId, useState } from "react";
import { GlypheGrain, Plaque, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  aFaire5, analyseServie, communeCommeLieu, criteresDepasses, dateCourte, gestePrincipal, libelleCritere, logementsDe, montantAnnonce, montantFr, ouVousEnEtes, trier,
  LIBELLE_DIMENSION, LIBELLE_STATUT, type Commune, type DimensionTri, type Logement, type Piste,
} from "../modele5";
import { AUJOURDHUI } from "../scenarios5";
import { faireGeste, type Api5 } from "../CentreDecision5";
import { BoutonGeste, Declare, Section, Vignette, lier } from "../communs5";
import { Ajout5 } from "../Ajout5";
import v from "../v5.module.css";

type Rangement = "commune" | Exclude<DimensionTri, "maintenant">;
const RANGEMENTS: Rangement[] = ["commune", "montant", "surface", "trajet", "ajout"];

export function Ensemble({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const logements = etat.logements.filter((l) => l.statut !== "ecarte");
  const vide = !communes.length && !logements.length;
  const [ajout, setAjout] = useState<null | "commune" | "logement">(null);
  const [rang, setRang] = useState<Rangement>("commune");
  const idRang = useId();
  const resume = ouVousEnEtes(etat);
  const faire = aFaire5(etat, AUJOURDHUI, etat.droits);
  const ecartes = [...etat.logements.filter((l) => l.statut === "ecarte"), ...etat.communes.filter((c) => c.statut === "ecartee")];

  const titre = vide ? "Où aimeriez-vous vivre ?"
    : communes.length > 1 ? `${communes.map((c) => c.nom).join(" ou ")} ?`
      : communes.length === 1 ? `Vivre à ${communes[0]!.nom}` : "Votre recherche";

  return (
    <>
      <div className={v.tete}>
        <p className={s.surtitre}><span>Ma décision</span></p>
        <h1 className={`${s.titre} ${v.titreAccueil}`} tabIndex={-1} data-titre-vue>{titre}</h1>
        <ProjetCompact api={api} />
      </div>

      {vide ? (
        <section className={v.entrees} aria-labelledby="entrees-t">
          <h2 className={v.sectionTitre} id="entrees-t">Par où commencer ?</h2>
          <p className={s.corps}>Une commune qui vous tente, ou une annonce déjà repérée : les deux se valent, et vous pourrez rattacher l&apos;une à l&apos;autre plus tard.</p>
          <div className={v.entreesChoix}>
            <button type="button" className={v.entree} onClick={() => setAjout("commune")} aria-expanded={ajout === "commune"}>
              <GlypheGrain grain="commune" taille={22} />
              <span className={v.entreeTitre}>Je pense à une commune</span>
              <span className={v.entreeSous}>Nantes, Rennes… sans adresse pour l&apos;instant.</span>
            </button>
            <button type="button" className={v.entree} onClick={() => setAjout("logement")} aria-expanded={ajout === "logement"}>
              <GlypheGrain grain="batiment" taille={22} />
              <span className={v.entreeTitre}>J&apos;ai une adresse ou une annonce</span>
              <span className={v.entreeSous}>La commune sera ajoutée avec lui.</span>
            </button>
          </div>
          {ajout ? <Ajout5 key={ajout} api={api} depart={ajout} fermer={() => setAjout(null)} /> : null}
        </section>
      ) : (
        <>
          <div className={v.debut}>
          <Plaque etiquette="Où vous en êtes" className={v.ouPlaque}>
            <p className={s.etiquette}>Où vous en êtes</p>
            <dl className={v.lignesTitrees}>{resume.map((x) => <div key={x.titre}><dt>{x.titre}</dt><dd>{lier(x.texte)}</dd></div>)}</dl>
          </Plaque>

          {faire.length ? (
            <section className={v.faire} aria-labelledby="faire-t">
              <div className={v.faireTete}>
                <h2 className={v.sectionTitre} id="faire-t">À faire maintenant</h2>
                <p className={s.nuance}>Une visite qui approche, une question ouverte, puis ce qui manque pour comparer. Cet ordre ne classe pas vos logements.</p>
              </div>
              <ol className={v.actions}>
                {faire.map((a, i) => {
                  const p = pisteDe(api, a.pisteId);
                  return (
                    <li key={i}>
                      <span className={v.actionNum}>{i + 1}</span>
                      <span className={s.pileSerree}>
                        <span className={v.actionTexte}>{lier(a.texte)}</span>
                        <span className={s.nuance}>{lier(a.pourquoi)}</span>
                      </span>
                      <button type="button" className={s.bouton} onClick={(e) => {
                        if (a.action.type === "panneau" && p) api.ouvrirPanneau(p, a.action.geste, e.currentTarget);
                        else aller(a.pisteId.startsWith("c:") ? { ecran: "commune", id: a.pisteId } : { ecran: "logement", id: a.pisteId, ...(a.action.type === "fiche" && a.action.ancre ? { ancre: a.action.ancre } : {}) });
                      }}>{a.bouton}</button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}
          </div>

          <Section titre="Vos communes et vos logements" id="lieux" action={
            <div className={v.ligneGestes}>
              <button type="button" className={`${s.bouton} ${s.boutonMarque}`} disabled={communes.length < 2} onClick={() => aller({ ecran: "comparer", mode: "communes", selection: communes.map((c) => `c:${c.insee}`) })}>Comparer les communes</button>
              <button type="button" className={s.bouton} disabled={logements.length < 2} onClick={() => aller({ ecran: "comparer", mode: "logements", selection: logements.length <= 4 ? logements.map((l) => l.id) : [] })}>Comparer les logements</button>
            </div>
          }>
            <div className={v.lieuxOutils}>
              {logements.length > 1 ? (
                <Selecteur id={`${idRang}-r`} question="Ranger" valeur={rang} onChoisir={setRang}
                  options={RANGEMENTS.map((d) => ({ valeur: d, libelle: d === "commune" ? "Par commune" : LIBELLE_DIMENSION[d] }))} />
              ) : null}
              <div className={v.ligneGestes}>
                <button type="button" className={s.action} onClick={() => setAjout(ajout === "commune" ? null : "commune")} aria-expanded={ajout === "commune"}>+ Une commune</button>
                <button type="button" className={s.action} onClick={() => setAjout(ajout === "logement" ? null : "logement")} aria-expanded={ajout === "logement"}>+ Un logement</button>
              </div>
            </div>
            {ajout ? <Ajout5 key={ajout} api={api} depart={ajout} fermer={() => setAjout(null)} /> : null}

            {rang === "commune" ? (
              <div className={v.groupes}>{communes.map((c) => <GroupeCommune key={c.insee} api={api} commune={c} />)}</div>
            ) : (
              <div className={v.groupes}>
                {trier(logements, rang, etat.projet, AUJOURDHUI).map((g) => (
                  <div key={g.titre} className={v.groupeTri}>
                    <p className={v.faceTitre}>{g.titre}</p>
                    {g.note ? <p className={s.nuance}>{lier(g.note)}</p> : null}
                    <ul className={`${v.logements} ${v.logementsPlats}`}>
                      {g.lieux.map((x) => <LigneLogement key={x.lieu.id} api={api} logement={x.lieu as Logement} valeur={x.valeur} raison={x.raison} />)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {ecartes.length ? <Ecartes api={api} ecartes={ecartes} /> : null}
          </Section>
        </>
      )}
    </>
  );
}

function pisteDe(api: Api5, id: string): Piste | null {
  if (id.startsWith("c:")) { const c = api.etat.communes.find((x) => `c:${x.insee}` === id); return c ? { type: "commune", commune: c } : null; }
  const l = api.etat.logements.find((x) => x.id === id); return l ? { type: "logement", logement: l } : null;
}

/** Le Projet en une ligne, ouvrable ; « Et si… ? » mène à la simulation de Mon Projet. */
export function ProjetCompact({ api }: { api: Api5 }) {
  const { projet } = api.etat;
  const [ouvert, setOuvert] = useState(false);
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const prefs = projet.criteres.filter((c) => c.nature === "priorite").sort((a, b) => (b.poids ?? 0) - (a.poids ?? 0));
  return (
    <section className={v.projetCompact} aria-label="Votre Projet">
      <p className={v.projetLigne}>
        <strong className={s.encre}>Votre Projet</strong> · {projet.intention === "achat" ? "acheter" : "louer"} · {durs.map((c) => `${libelleCritere(c).toLowerCase()} (sans compromis)`).join(", ")}, puis {prefs.map((c) => libelleCritere(c).toLowerCase()).join(", ")}.
      </p>
      <div className={v.ligneGestes}>
        <button type="button" className={s.action} aria-expanded={ouvert} onClick={() => setOuvert((x) => !x)}>{ouvert ? "Replier" : "Voir le détail"}</button>
        <button type="button" className={s.action} onClick={() => api.aller({ ecran: "projet", ancre: "et-si" })}>Et si… ?</button>
        <button type="button" className={s.action} onClick={() => api.aller({ ecran: "projet" })}>Modifier</button>
      </div>
      {ouvert ? (
        <div className={v.projetDetail}>
          <p className={v.projetCle}>Sans compromis</p>
          <ul className={v.projetListe}>{durs.map((c) => <li key={c.cle} data-dur>{libelleCritere(c)}</li>)}</ul>
          <p className={v.projetCle}>Ce qui compte</p>
          <ul className={v.projetListe}>{prefs.map((c) => <li key={c.cle}>{libelleCritere(c)}<span className={v.beaucoup}> · {c.poids === 3 ? "compte beaucoup" : c.poids === 2 ? "compte" : "compte un peu"}</span></li>)}</ul>
          {projet.budget ? <p className={v.projetBudget}>Budget : {montantFr(projet.budget.montant)}{projet.budget.periodicite === "mois" ? " par mois" : ""} <Declare>déclaré par vous, non mesuré</Declare></p> : null}
          <p className={s.nuance}>Révision {projet.revision}, du {dateCourte(projet.date)}</p>
        </div>
      ) : null}
    </section>
  );
}

function GroupeCommune({ api, commune }: { api: Api5; commune: Commune }) {
  const { etat, aller } = api;
  const a = commune.lecture === "rapport" ? analyseServie(communeCommeLieu(commune)) : null;
  const logements = logementsDe(etat, commune).filter((l) => l.statut !== "ecarte");
  const piste: Piste = { type: "commune", commune };
  const g = gestePrincipal(etat, piste, etat.droits);
  return (
    <article className={v.groupe} aria-labelledby={`c-${commune.insee}`}>
      <header className={v.groupeTete}>
        <span className={v.groupeGlyphe} aria-hidden><GlypheGrain grain="commune" taille={22} /></span>
        <div className={v.groupeCorps}>
          <h3 className={v.groupeNom} id={`c-${commune.insee}`}><button type="button" className={v.lien} onClick={() => aller({ ecran: "commune", id: `c:${commune.insee}` })}>{commune.nom}</button></h3>
          <p className={v.groupeEtat}>
            {a ? <>Rapport de territoire du {dateCourte(a.generatedAt)}{a.simulee ? " (simulé)" : ""}</> : commune.lecture === "gratuite" ? "Lecture gratuite : des repères, rien de conclu pour votre Projet" : "Pas encore lue"}
          </p>
          {a ? (criteresDepasses(a, etat.projet).length
            ? <p className={v.citationAncienne}>Conclusion du {dateCourte(a.generatedAt)}, écrite sous votre Projet d&apos;alors : « {lier(a.conclusion.phrase)} » Elle est à revoir pour {criteresDepasses(a, etat.projet).map((d) => d.apres.toLowerCase()).join(", ")}.</p>
            : <p className={v.citation}>« {lier(a.conclusion.phrase)} »</p>) : null}
        </div>
        {g.cle !== "ouvrir_rapport" ? <BoutonGeste geste={g} faire={faireGeste(api, piste)} /> : null}
      </header>
      {logements.length ? (
        <ul className={v.logements} aria-label={`Vos logements à ${commune.nom}`}>
          {logements.map((l) => <LigneLogement key={l.id} api={api} logement={l} />)}
        </ul>
      ) : <p className={v.aucunLogement}>Aucun logement à {commune.nom} pour l&apos;instant : la commune se compare déjà aux autres.</p>}
    </article>
  );
}

/** Ce que futur•e sait d'un logement, en une ligne de mots. */
export function savoirCourt(api: Api5, l: Logement): string {
  const a = analyseServie(l);
  if (a?.perimetre === "commune+adresse") return `Commune, abords et logement lus · dossier du ${dateCourte(a.generatedAt)}`;
  const c = api.etat.communes.find((x) => x.insee === l.commune.insee);
  const commune = c?.lecture === "rapport" ? "Commune lue" : "Commune pas encore lue";
  return `${commune} · ${l.adresse ? "adresse pas encore analysée" : "adresse inconnue"}`;
}

function LigneLogement({ api, logement, valeur, raison }: { api: Api5; logement: Logement; valeur?: string | null; raison?: string }) {
  const { etat, aller } = api;
  const piste: Piste = { type: "logement", logement };
  const g = gestePrincipal(etat, piste, etat.droits);
  return (
    <li className={v.logement}>
      <button type="button" className={v.vignetteBouton} onClick={() => aller({ ecran: "logement", id: logement.id })} aria-label={`Ouvrir ${logement.libelle}`}><Vignette logement={logement} taille={48} /></button>
      <div className={v.logementCorps}>
        <div className={v.logementTete}>
          <h4 className={v.logementNom}><button type="button" className={v.lien} onClick={() => aller({ ecran: "logement", id: logement.id })}>{logement.libelle}</button></h4>
          <span className={v.statut} data-statut={logement.statut}>{LIBELLE_STATUT[logement.statut]}{logement.visiteLe && logement.statut === "a_visiter" ? ` · ${dateCourte(logement.visiteLe)}` : ""}</span>
        </div>
        <p className={v.logementSous}>{[montantAnnonce(logement.annonce), logement.annonce?.surface ? `${logement.annonce.surface} m²` : null].filter(Boolean).join(" · ") || "Rien de déclaré"} <Declare /></p>
        <p className={v.savoir}>{savoirCourt(api, logement)}</p>
        {valeur ? <p className={v.valeurTri}>{valeur}</p> : null}
        {raison ? <p className={v.change}>{lier(raison)}</p> : null}
      </div>
      <div className={v.logementGeste}>
        <BoutonGeste geste={g} faire={faireGeste(api, piste)} apport={g.commercial ? g.court ?? null : g.cle === "adresse" ? "Sans elle, seule la commune est lue." : null} />
      </div>
    </li>
  );
}

function Ecartes({ api, ecartes }: { api: Api5; ecartes: (Logement | Commune)[] }) {
  const { etat, aller, envoyer } = api;
  return (
    <details className={`${s.details} ${v.ecartes}`}>
      <summary>{ecartes.length} écarté{ecartes.length > 1 ? "s" : ""}, et pourquoi</summary>
      <ul className={v.listeSimple}>
        {ecartes.map((x) => {
          if (!("libelle" in x)) return <li key={x.insee} className={v.ecarte}><span><strong className={s.encre}>{x.nom}</strong> · « {x.raisonEcart} »</span><button type="button" className={s.action} onClick={() => envoyer({ type: "reactiver", id: `c:${x.insee}` })}>Remettre en course</button></li>;
          const e = [...x.journal].reverse().find((j) => j.type === "ecarte");
          const k = e?.contexte?.cle ? etat.projet.criteres.find((c) => c.cle === e.contexte!.cle) : undefined;
          return (
            <li key={x.id} className={v.ecarte}>
              <span className={s.pileSerree}>
                <span><button type="button" className={v.lien} onClick={() => aller({ ecran: "logement", id: x.id })}>{x.libelle}</button> · écarté le {e ? dateCourte(e.date) : "?"} : « {e?.raison} »</span>
                {k && e?.contexte?.valeur !== k.valeur ? <span className={v.change}>Votre condition était « {e!.contexte!.condition} » ; elle est aujourd&apos;hui « {libelleCritere(k).toLowerCase()} ».</span> : e?.contexte?.condition ? <span className={s.nuance}>Pour votre condition d&apos;alors : {e.contexte.condition}.</span> : null}
              </span>
              <button type="button" className={s.action} onClick={() => envoyer({ type: "reactiver", id: x.id })}>Remettre en course</button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
