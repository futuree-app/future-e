"use client";
// MA DÉCISION, V4.1 · où en est ma recherche, quoi faire ensuite, et mes pistes rangées par commune.
// Une commune porte sa lecture une seule fois ; ses logements se rangent dessous et disent, en mots,
// ce que futur•e sait d'eux et le seul geste utile maintenant.
import { useState } from "react";
import { GlypheGrain, releve as s } from "@/components/releve/primitives";
import {
  aFaire, analyseServie, communeCommeLieu, dateCourte, gestePrincipal, lire, logementsDe, montantAnnonce, savoirLogement,
  libelleCritere, montantFr, LIBELLE_STATUT, type Commune, type Logement, type Piste,
} from "../modele41";
import { AUJOURDHUI } from "../scenarios41";
import { PASS_INCLUSES } from "../etat41";
import type { Api41 } from "../CentreDecision41";
import { BoutonGeste, Declare, Section, Triade, Vignette, lier } from "../communs41";
import { Ajout41 } from "../Ajout41";
import { Plan } from "../Plan";
import v from "../v41.module.css";

export function pistesActives(api: Api41): Piste[] {
  const { etat } = api;
  return [
    ...etat.communes.filter((c) => c.statut !== "ecartee").map((commune) => ({ type: "commune" as const, commune })),
    ...etat.logements.filter((l) => l.statut !== "ecarte").map((logement) => ({ type: "logement" as const, logement })),
  ];
}

/** Le geste d'une piste, branché sur les gestes du prototype. */
export function faireGeste(api: Api41, p: Piste) {
  const g = gestePrincipal(api.etat, p, api.etat.droits);
  return () => {
    if (p.type === "commune") {
      const id = `c:${p.commune.insee}`;
      if (g.cle === "examiner_commune") api.envoyer({ type: "examiner", insee: p.commune.insee });
      else if (g.cle === "mettre_a_jour") api.envoyer({ type: "mettre_a_jour", id });
      else api.aller({ ecran: "commune", id });
      return;
    }
    const l = p.logement;
    if (g.cle === "analyser" && l.id === "convention") api.envoyer({ type: "analyser", id: l.id });
    else if (g.cle === "mettre_a_jour") api.envoyer({ type: "mettre_a_jour", id: l.id });
    else if (g.cle === "ouvrir") api.aller({ ecran: "releve", id: l.id });
    else api.aller({ ecran: "fiche", id: l.id });
  };
}

export function Accueil({ api }: { api: Api41 }) {
  const { etat, aller } = api;
  const [ajout, setAjout] = useState(etat.communes.length === 0 && etat.logements.length === 0);
  const pistes = pistesActives(api);
  const communes = etat.communes.filter((c) => c.statut !== "ecartee");
  const logementsActifs = etat.logements.filter((l) => l.statut !== "ecarte");
  const lecture = lire(etat, pistes);
  const actions = aFaire(etat, AUJOURDHUI, etat.droits);
  const ecartes = [...etat.logements.filter((l) => l.statut === "ecarte"), ...etat.communes.filter((c) => c.statut === "ecartee")];

  const titre = pistes.length === 0 ? "Votre recherche commence ici"
    : communes.length > 1 ? `${communes.map((c) => c.nom).join(" ou ")} ?`
      : communes.length === 1 ? `Vivre à ${communes[0]!.nom}` : "Votre recherche";
  const sous = pistes.length === 0 ? "Gardez ici les communes et les logements que vous envisagez. futur•e les lit pour votre Projet, vous dit ce qui les départage et ce qu'il reste à vérifier."
    : `${communes.length} commune${communes.length > 1 ? "s" : ""} envisagée${communes.length > 1 ? "s" : ""}${logementsActifs.length ? `, ${logementsActifs.length} logement${logementsActifs.length > 1 ? "s" : ""} en vue` : ", aucun logement pour l'instant"}.`;

  return (
    <>
      <div className={v.tete}>
        <p className={s.surtitre}><span>Ma décision</span></p>
        <h1 className={`${s.display} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{titre}</h1>
        <p className={s.chapo}>{lier(sous)}</p>
        <div className={v.gestesTete}>
          <button type="button" className={`${s.bouton} ${s.boutonMarque}`} disabled={pistes.length < 2}
            onClick={() => aller({ ecran: "comparer", selection: pistes.map((p) => (p.type === "commune" ? `c:${p.commune.insee}` : p.logement.id)) })}>
            {pistes.length < 2 ? "Comparer (à partir de deux pistes)" : "Comparer mes pistes"}
          </button>
          <button type="button" className={s.bouton} onClick={() => setAjout((x) => !x)} aria-expanded={ajout}>{ajout ? "Fermer" : "Ajouter une commune ou un logement"}</button>
        </div>
      </div>

      {ajout ? <Ajout41 api={api} fermer={() => setAjout(false)} /> : null}
      {/* Sur téléphone : le Projet en une ligne sous le titre ; le détail, le plan et l'accès viennent après les pistes. */}
      <div className={v.projetMobile}><ProjetCarte api={api} compacte /></div>

      <div className={v.grille}>
        <div className={v.principal}>
          {pistes.length >= 2 ? (
            <Section titre="Où vous en êtes" id="ou">
              <ul className={v.points}>
                {lecture.bloque.map((b, i) => <li key={`b${i}`} data-genre="bloque"><span className={v.pointGenre}>Bloque</span>{lier(b.phrase)}</li>)}
                {lecture.difference.slice(0, 2).map((d, i) => <li key={`d${i}`} data-genre="difference"><span className={v.pointGenre}>Fait la différence</span>{lier(d.phrase)}</li>)}
                {lecture.pourrait.slice(0, 1).map((d, i) => <li key={`p${i}`} data-genre="verifier"><span className={v.pointGenre}>À vérifier</span>{lier(d.phrase)}</li>)}
                {lecture.manque.slice(0, 2).map((m, i) => <li key={`m${i}`} data-genre="manque"><span className={v.pointGenre}>Manque</span>{lier(m.phrase)}</li>)}
              </ul>
            </Section>
          ) : null}

          {actions.length ? (
            <Section titre="À faire maintenant" id="a-faire" sous="Dans cet ordre : une visite qui approche, une question qui pourrait tout changer, puis ce qui manque pour comparer.">
              <ol className={v.actions}>
                {actions.map((a, i) => (
                  <li key={i}>
                    <span className={v.actionNum}>{i + 1}</span>
                    <span className={s.pileSerree}>
                      <span className={v.actionTexte}>{lier(a.texte)}</span>
                      <span className={s.nuance}>{lier(a.pourquoi)}</span>
                    </span>
                    <button type="button" className={s.action} onClick={() => aller(a.pisteId.startsWith("c:") ? { ecran: "commune", id: a.pisteId } : { ecran: "fiche", id: a.pisteId })}>Ouvrir</button>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          <Section titre="Vos pistes" id="pistes" sous={pistes.length ? "Rangées par commune. Ce qui est lu à la commune vaut pour tous ses logements ; c'est dit une fois, en tête." : undefined}>
            {communes.length === 0 && !ajout ? <p className={s.corps}>Aucune piste pour l&apos;instant. Une commune, une annonce, un lien : tout peut commencer par là.</p> : null}
            <div className={v.groupes}>
              {communes.map((c) => <GroupeCommune key={c.insee} api={api} commune={c} />)}
            </div>
            {ecartes.length ? (
              <details className={`${s.details} ${v.ecartes}`}>
                <summary>{ecartes.length} piste{ecartes.length > 1 ? "s" : ""} écartée{ecartes.length > 1 ? "s" : ""}, et pourquoi</summary>
                <ul className={v.listeSimple}>
                  {ecartes.map((x) => {
                    if ("insee" in x && !("libelle" in x)) return <li key={x.insee} className={v.ecarte}><span><strong className={s.encre}>{x.nom}</strong> · « {x.raisonEcart} »</span><button type="button" className={s.action} onClick={() => api.envoyer({ type: "reactiver", id: `c:${x.insee}` })}>Remettre en course</button></li>;
                    const l = x as Logement;
                    const e = [...l.journal].reverse().find((j) => j.type === "ecarte");
                    const c = e?.contexte?.cle ? etat.projet.criteres.find((k) => k.cle === e.contexte!.cle) : undefined;
                    return (
                      <li key={l.id} className={v.ecarte}>
                        <span className={s.pileSerree}>
                          <span><button type="button" className={v.lien} onClick={() => aller({ ecran: "fiche", id: l.id })}>{l.libelle}</button> · écarté le {e ? dateCourte(e.date) : "?"} : « {e?.raison} »</span>
                          {c && e?.contexte?.valeur !== c.valeur ? <span className={v.change}>Votre condition était « {e!.contexte!.condition} » ; elle est aujourd&apos;hui « {libelleCritere(c).toLowerCase()} ».</span> : e?.contexte?.condition ? <span className={s.nuance}>Votre condition d&apos;alors : {e.contexte.condition}.</span> : null}
                        </span>
                        <button type="button" className={s.action} onClick={() => api.envoyer({ type: "reactiver", id: l.id })}>Remettre en course</button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : null}
          </Section>
        </div>

        <aside className={v.cote} aria-label="Votre Projet et vos pistes sur le plan">
          <ProjetCarte api={api} />
          {communes.length ? <Plan api={api} /> : null}
          <Acces api={api} />
        </aside>
      </div>
    </>
  );
}

function GroupeCommune({ api, commune }: { api: Api41; commune: Commune }) {
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
            {a ? <>Rapport de territoire du {dateCourte(a.generatedAt)}{a.simulee ? " (simulé)" : ""}{commune.viaPass ? " · Pass" : ""}</> : commune.lecture === "gratuite" ? "Lecture gratuite : repères nationaux, rien de conclu pour votre Projet" : "Pas encore lue"}
          </p>
          {a ? <p className={v.citation}>« {lier(a.conclusion.phrase)} »</p> : null}
        </div>
        {g.cle !== "ouvrir_rapport" ? <BoutonGeste geste={g} faire={faireGeste(api, piste)} avecApport={false} /> : null}
      </header>
      {logements.length ? (
        <ul className={v.logements} aria-label={`Vos logements à ${commune.nom}`}>
          {logements.map((l) => <LigneLogement key={l.id} api={api} logement={l} />)}
        </ul>
      ) : <p className={v.aucunLogement}>Aucun logement à {commune.nom} pour l&apos;instant.</p>}
    </article>
  );
}

function LigneLogement({ api, logement }: { api: Api41; logement: Logement }) {
  const { etat, aller } = api;
  const a = analyseServie(logement);
  const piste: Piste = { type: "logement", logement };
  const g = gestePrincipal(etat, piste, etat.droits);
  const savoir = savoirLogement(etat, logement);
  return (
    <li className={v.logement}>
      <button type="button" className={v.vignetteBouton} onClick={() => aller({ ecran: "fiche", id: logement.id })} aria-label={`Ouvrir ${logement.libelle}`}><Vignette logement={logement} taille={56} /></button>
      <div className={v.logementCorps}>
        <div className={v.logementTete}>
          <h4 className={v.logementNom}><button type="button" className={v.lien} onClick={() => aller({ ecran: "fiche", id: logement.id })}>{logement.libelle}</button></h4>
          <span className={v.statut} data-statut={logement.statut}>{LIBELLE_STATUT[logement.statut]}{logement.visiteLe && logement.statut === "a_visiter" ? ` · ${dateCourte(logement.visiteLe)}` : ""}</span>
        </div>
        <p className={v.logementSous}>{[montantAnnonce(logement.annonce), logement.annonce?.surface ? `${logement.annonce.surface} m²` : null].filter(Boolean).join(" · ")} <Declare /></p>
        {a && a.perimetre === "commune+adresse" ? <p className={v.citationLogement}>« {lier(a.conclusion.phrase)} »</p> : null}
        <Triade savoir={savoir} compacte />
      </div>
      <div className={v.logementGeste}>
        <BoutonGeste geste={g} faire={faireGeste(api, piste)} avecApport={g.commercial || g.cle === "adresse"} court />
      </div>
    </li>
  );
}

export function ProjetCarte({ api, compacte = false }: { api: Api41; compacte?: boolean }) {
  const { projet } = api.etat;
  const durs = projet.criteres.filter((c) => c.nature === "sans_compromis");
  const prefs = projet.criteres.filter((c) => c.nature === "priorite").sort((a, b) => (b.poids ?? 0) - (a.poids ?? 0));
  return (
    <section className={v.projet} aria-labelledby="projet-t">
      <div className={v.projetTete}>
        <h2 className={v.projetTitre} id="projet-t">Votre Projet</h2>
        <span className={v.projetMeta}>{projet.intention === "achat" ? "acheter" : "louer"} · révision {projet.revision} du {dateCourte(projet.date)}</span>
      </div>
      {!compacte ? (
        <>
          <p className={v.projetCle}>Sans compromis</p>
          <ul className={v.projetListe}>{durs.map((c) => <li key={c.cle} data-dur>{libelleCritere(c)}</li>)}</ul>
          <p className={v.projetCle}>Ce qui compte</p>
          <ul className={v.projetListe}>{prefs.map((c) => <li key={c.cle}>{libelleCritere(c)}{c.poids === 3 ? <span className={v.beaucoup}> · beaucoup</span> : null}</li>)}</ul>
          {projet.budget ? <p className={v.projetBudget}>Budget : {montantFr(projet.budget.montant)}{projet.budget.periodicite === "mois" ? " par mois" : ""} <Declare>non mesuré par futur•e</Declare></p> : null}
        </>
      ) : (
        <p className={v.projetLigne}>{[...durs.map((c) => `${libelleCritere(c)} (sans compromis)`), ...prefs.map((c) => libelleCritere(c))].join(" · ")}</p>
      )}
      <div className={v.projetGestes}>
        <button type="button" className={s.bouton} onClick={(e) => api.ouvrirEtSi(e.currentTarget)}>Et si… ?</button>
        <span className={s.nuance}>Essayez une autre valeur sans rien modifier.</span>
      </div>
    </section>
  );
}

function Acces({ api }: { api: Api41 }) {
  const { etat } = api;
  return (
    <section className={v.acces} aria-labelledby="acces-t">
      <h2 className={v.projetTitre} id="acces-t">Votre accès</h2>
      {etat.droits === "pass" ? (
        <>
          <p className={s.dense}>Vous pouvez encore analyser <strong className={s.encre}>{PASS_INCLUSES - etat.passUtilisees} adresses</strong> jusqu&apos;au 18 janv.</p>
          <div className={v.jauge} aria-hidden>{Array.from({ length: PASS_INCLUSES }, (_, i) => <span key={i} data-plein={i < etat.passUtilisees || undefined} />)}</div>
          <p className={s.nuance}>Pass Recherche, hypothèse de revue : ni prix ni quota décidés. Comparer et faire le point restent inclus.</p>
        </>
      ) : (
        <>
          <p className={s.dense}>Garder des pistes, comparer ce qui est déjà lu, noter vos visites : sans paiement.</p>
          <p className={s.nuance}>Analyser une adresse : 39 €. Lire une commune pour votre Projet : 14 €. Aucun paiement dans ce prototype.</p>
        </>
      )}
    </section>
  );
}
