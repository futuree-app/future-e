"use client";
// VUE D'ENSEMBLE, V5.1 · même ordre que la V5 (où j'en suis, le geste le plus utile, mes communes et
// mes logements), avec deux changements de fond :
//   · chaque logement montre DEUX dimensions distinctes, chacune avec son mot : votre suivi (Repéré,
//     Visite le 14 nov., Visité) et ce que futur•e en sait (trois paliers : commune, adresse, analyse) ;
//   · l'entrée principale devient « Ajouter une annonce » : un lien à coller, des valeurs à confirmer.
import { useId, useState } from "react";
import { GlypheGrain, Selecteur, releve as s } from "@/components/releve/primitives";
import {
  aFaire5, analyseServie, type Faire, communeCommeLieu, criteresDepasses, dateCourte, gestePrincipal, libelleCritere, logementsDe, montantAnnonce, ouVousEnEtes, trier,
  LIBELLE_DIMENSION, type Commune, type DimensionTri, type Logement, type Piste,
} from "../../fut41-v5/modele5";
import { AUJOURDHUI } from "../../fut41-v5/scenarios5";
import { faireGeste, type Api5 } from "../../fut41-v5/CentreDecision5";
import { BoutonGeste, Declare, Section, Vignette, lier } from "../../fut41-v5/communs5";
import { Ajout51 } from "../Ajout51";
import { Savoir, Suivi } from "../communs51";
import v from "../../fut41-v5/v5.module.css";
import w from "../v51.module.css";

type Rangement = "commune" | Exclude<DimensionTri, "maintenant">;
const RANGEMENTS: Rangement[] = ["commune", "montant", "surface", "trajet", "ajout"];

export function Ensemble51({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const logements = etat.logements.filter((l) => l.statut !== "ecarte");
  const vide = !communes.length && !logements.length;
  const [ajout, setAjout] = useState<null | "commune" | "logement">(null);
  const [rang, setRang] = useState<Rangement>("commune");
  const idRang = useId();
  const resume = ouVousEnEtes(etat);
  const faire = aFaire5(etat, AUJOURDHUI, etat.droits);
  const autres = faire.slice(1);
  const ecartes = [...etat.logements.filter((l) => l.statut === "ecarte"), ...etat.communes.filter((c) => c.statut === "ecartee")];

  const titre = vide ? "Où aimeriez-vous vivre ?"
    : communes.length > 1 ? `${communes.map((c) => c.nom).join(" ou ")} ?`
      : communes.length === 1 ? `Vivre à ${communes[0]!.nom}` : "Votre recherche";

  return (
    <>
      <div className={v.tete}>
        <h1 className={`${s.titre} ${v.titreAccueil}`} tabIndex={-1} data-titre-vue>{titre}</h1>
        <ProjetCompact api={api} />
      </div>

      {vide ? (
        <section className={v.entrees} aria-labelledby="entrees-t">
          <h2 className={v.sectionTitre} id="entrees-t">Par où commencer ?</h2>
          <p className={s.corps}>Une annonce déjà repérée, ou une commune qui vous tente : les deux se valent.</p>
          <div className={v.entreesChoix}>
            <button type="button" className={v.entree} onClick={() => setAjout("logement")} aria-expanded={ajout === "logement"}>
              <GlypheGrain grain="batiment" taille={22} />
              <span className={v.entreeTitre}>Ajouter une annonce</span>
              <span className={v.entreeSous}>Collez son lien, ou décrivez le logement. Sa commune suit.</span>
            </button>
            <button type="button" className={v.entree} onClick={() => setAjout("commune")} aria-expanded={ajout === "commune"}>
              <GlypheGrain grain="commune" taille={22} />
              <span className={v.entreeTitre}>Je pense à une commune</span>
              <span className={v.entreeSous}>Nantes, Rennes… sans annonce pour l&apos;instant.</span>
            </button>
          </div>
          {ajout ? <Ajout51 key={ajout} api={api} depart={ajout} fermer={() => setAjout(null)} /> : null}
        </section>
      ) : (
        <>
          <div className={v.debut}>
          {/* Revue « utilisateur » de Work : une phrase pour s'orienter, le développement à la demande. */}
          <section className={v.ouPlaque} aria-label="Où vous en êtes">
            <p className={s.etiquette}>Où vous en êtes</p>
            {resume[0] ? <p className={v.ouCourt}>{lier(resume[0].texte)}</p> : null}
            {resume.length > 1 ? (
              <details className={`${s.details} ${v.comprendre}`}>
                <summary>Comprendre</summary>
                <dl className={v.lignesTitrees}>{resume.slice(1).map((x) => <div key={x.titre}><dt>{x.titre}</dt><dd>{lier(x.texte)}</dd></div>)}</dl>
              </details>
            ) : null}
          </section>

          {faire[0] ? (
            <section className={v.faire} aria-labelledby="faire-t">
              <h2 className={v.sectionTitre} id="faire-t">Le plus utile maintenant</h2>
              <div className={v.premierGeste}>
                <span className={s.pileSerree}>
                  <span className={v.actionTexte}>{lier(faire[0].texte)}</span>
                  <span className={s.nuance}>{lier(faire[0].pourquoi)}</span>
                </span>
                <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={(e) => agir(api, faire[0]!, e.currentTarget)}>{faire[0].bouton}</button>
              </div>
              {autres.length ? <p className={s.nuance}>{autres.length === 1 ? "Un autre geste attend" : `${autres.length} autres gestes attendent`}, sous le lieu concerné.</p> : null}
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
                <button type="button" className={`${s.bouton} ${w.ajouterAnnonce}`} onClick={() => setAjout(ajout === "logement" ? null : "logement")} aria-expanded={ajout === "logement"}>+ Ajouter une annonce</button>
                <button type="button" className={`${s.action} ${v.cible}`} onClick={() => setAjout(ajout === "commune" ? null : "commune")} aria-expanded={ajout === "commune"}>+ Une commune</button>
              </div>
            </div>
            {ajout ? <Ajout51 key={ajout} api={api} depart={ajout} fermer={() => setAjout(null)} /> : null}

            {rang === "commune" ? (
              <div className={v.groupes}>{communes.map((c) => <GroupeCommune key={c.insee} api={api} commune={c} autres={autres} />)}</div>
            ) : (
              <div className={v.groupes}>
                {trier(logements, rang, etat.projet, AUJOURDHUI).map((g) => (
                  <div key={g.titre} className={v.groupeTri}>
                    <p className={v.faceTitre}>{g.titre}</p>
                    {g.note ? <p className={s.nuance}>{lier(g.note)}</p> : null}
                    <ul className={`${v.logements} ${v.logementsPlats}`}>
                      {g.lieux.map((x) => <LigneLogement key={x.lieu.id} api={api} logement={x.lieu as Logement} valeur={x.valeur} raison={x.raison} autres={autres} />)}
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

function agir(api: Api5, a: Faire, el: HTMLElement) {
  const p = pisteDe(api, a.pisteId);
  if (a.action.type === "panneau" && p) api.ouvrirPanneau(p, a.action.geste, el);
  else api.aller(a.pisteId.startsWith("c:") ? { ecran: "commune", id: a.pisteId } : { ecran: "logement", id: a.pisteId, ...(a.action.type === "fiche" && a.action.ancre ? { ancre: a.action.ancre } : {}) });
}

/** Les autres gestes à faire, sous le lieu qu'ils concernent. */
function Aussi({ api, gestes }: { api: Api5; gestes: Faire[] }) {
  return gestes.length ? (
    <ul className={v.aussi} aria-label="Aussi à faire">
      {gestes.map((a, i) => <li key={i}><span className={v.aussiTexte}>À faire · {lier(a.court)}</span><button type="button" className={`${s.action} ${v.cible}`} onClick={(e) => agir(api, a, e.currentTarget)}>{a.bouton}</button></li>)}
    </ul>
  ) : null;
}

function pisteDe(api: Api5, id: string): Piste | null {
  if (id.startsWith("c:")) { const c = api.etat.communes.find((x) => `c:${x.insee}` === id); return c ? { type: "commune", commune: c } : null; }
  const l = api.etat.logements.find((x) => x.id === id); return l ? { type: "logement", logement: l } : null;
}

/** Le Projet en une ligne ; une entrée vers Mon Projet, une autre pour essayer un changement. */
export function ProjetCompact({ api }: { api: Api5 }) {
  const { projet } = api.etat;
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const prefs = projet.criteres.filter((c) => c.nature === "priorite").sort((a, b) => (b.poids ?? 0) - (a.poids ?? 0));
  return (
    <section className={v.projetCompact} aria-label="Votre Projet">
      <p className={v.projetLigne}>
        <strong className={s.encre}>Votre Projet</strong> · {projet.intention === "achat" ? "acheter" : "louer"} · {durs.map((c) => `${libelleCritere(c).toLowerCase()} (sans compromis)`).join(", ")}, puis {prefs.map((c) => libelleCritere(c).toLowerCase()).join(", ")}.
      </p>
      <div className={v.ligneGestes}>
        <button type="button" className={`${s.action} ${v.cible}`} onClick={() => api.aller({ ecran: "projet" })}>Voir mon Projet</button>
        <button type="button" className={`${s.action} ${v.cible}`} onClick={() => api.aller({ ecran: "projet", ancre: "et-si" })}>Essayer un changement</button>
      </div>
    </section>
  );
}

function GroupeCommune({ api, commune, autres }: { api: Api5; commune: Commune; autres: Faire[] }) {
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
            {a ? <>Rapport de territoire du {dateCourte(a.generatedAt)}{a.simulee ? " (simulé)" : ""}</> : commune.lecture === "gratuite" ? "Lecture gratuite : des repères, rien de conclu pour votre Projet" : "Pas encore étudiée"}
          </p>
          {a ? (criteresDepasses(a, etat.projet).length
            ? <p className={v.citationAncienne}>Conclusion du {dateCourte(a.generatedAt)}, écrite sous votre Projet d&apos;alors : « {lier(a.conclusion.phrase)} » Elle est à revoir pour {criteresDepasses(a, etat.projet).map((d) => d.apres.toLowerCase()).join(", ")}.</p>
            : <p className={v.citation}>« {lier(a.conclusion.phrase)} »</p>) : null}
        </div>
        {g.cle !== "ouvrir_rapport" ? <BoutonGeste geste={g} faire={faireGeste(api, piste)} /> : null}
      </header>
      <Aussi api={api} gestes={autres.filter((a) => a.pisteId === `c:${commune.insee}`)} />
      {logements.length ? (
        <ul className={v.logements} aria-label={`Vos logements à ${commune.nom}`}>
          {logements.map((l) => <LigneLogement key={l.id} api={api} logement={l} autres={autres} />)}
        </ul>
      ) : <p className={v.aucunLogement}>Aucun logement à {commune.nom} pour l&apos;instant : la commune se compare déjà aux autres.</p>}
    </article>
  );
}

/** Ce que futur•e sait d'un logement, en une ligne de mots. */
export function savoirCourt(api: Api5, l: Logement): string {
  const a = analyseServie(l);
  if (a?.perimetre === "commune+adresse") return `Adresse analysée · dossier du ${dateCourte(a.generatedAt)}`;
  const c = api.etat.communes.find((x) => x.insee === l.commune.insee);
  const commune = c?.lecture === "rapport" ? "Commune étudiée" : "Commune pas encore étudiée";
  return `${commune} · ${l.adresse ? "adresse pas encore analysée" : "adresse inconnue"}`;
}

function LigneLogement({ api, logement, valeur, raison, autres = [] }: { api: Api5; logement: Logement; valeur?: string | null; raison?: string; autres?: Faire[] }) {
  const { etat, aller } = api;
  const piste: Piste = { type: "logement", logement };
  const g = gestePrincipal(etat, piste, etat.droits);
  return (
    <li className={v.logement}>
      <button type="button" className={v.vignetteBouton} onClick={() => aller({ ecran: "logement", id: logement.id })} aria-label={`Ouvrir ${logement.libelle}`}><Vignette logement={logement} taille={48} /></button>
      <div className={v.logementCorps}>
        <div className={v.logementTete}>
          <h4 className={v.logementNom}><button type="button" className={v.lien} onClick={() => aller({ ecran: "logement", id: logement.id })}>{logement.libelle}</button></h4>
        </div>
        <p className={w.prix}>{[montantAnnonce(logement.annonce), logement.annonce?.surface ? `${logement.annonce.surface} m²` : null].filter(Boolean).join(" · ") || "Rien de déclaré"} <Declare /></p>
        <div className={w.deuxDimensions}><Suivi logement={logement} /><Savoir r={etat} logement={logement} detail={false} /></div>
        {valeur ? <p className={v.valeurTri}>{valeur}</p> : null}
        {raison ? <p className={v.change}>{lier(raison)}</p> : null}
        <Aussi api={api} gestes={autres.filter((a) => a.pisteId === logement.id)} />
      </div>
      <div className={v.logementGeste}>
        <BoutonGeste geste={g} faire={faireGeste(api, piste)} apport={g.commercial ? g.court ?? null : g.cle === "adresse" ? "Sans elle, seule la commune peut être étudiée." : null} />
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
