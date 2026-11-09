"use client";
// UN LOGEMENT, V5.1 · dans l'ordre de ce qu'une personne cherche :
//   1. ce logement (nom, prix et surface déclarés) et ses DEUX dimensions : votre suivi, ce que futur•e en sait ;
//   2. À retenir : ce que nous savons, ce qui manque, et le geste le plus utile ;
//   3. Face à votre Projet : une ligne par condition, la lecture la plus précise disponible, et OÙ elle
//      vaut (« pour toute la commune », « aux abords », « dans le logement »). Quand l'adresse n'est pas
//      étudiée, c'est dit UNE fois, en tête, au lieu d'être répété sous chaque condition ;
//   4. ce que vous apportez : questions à poser, notes ; puis l'annonce, l'historique, et les sources.
import { useId, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import {
  alertes, analyseServie, communeDe, confronter, criteresDepasses, dateCourte, gestePrincipal, libelleCritere, montantAnnonce,
  LIBELLE_NATURE, NOM_COUCHE, type CleCritere, type Logement,
} from "../../fut41-v5/modele5";
import { faireGeste, type Api5 } from "../../fut41-v5/CentreDecision5";
import { Declare, Fil, Marque, Mesure, Section, Vignette, lier } from "../../fut41-v5/communs5";
import { Adresse, Notes, Verifier } from "../../fut41-v5/vues5/FicheLogement5";
import { LIBELLE_SUIVI51 } from "../lecture51";
import { Agir, Preuves, Retenir, Savoir, Suivi } from "../communs51";
import v from "../../fut41-v5/v5.module.css";
import w from "../v51.module.css";

const POIDS = { 3: "compte beaucoup pour vous", 2: "compte pour vous", 1: "compte un peu pour vous" } as const;

export function FicheLogement51({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const l = etat.logements.find((x) => x.id === etat.vue.id);
  const [noter, setNoter] = useState(false);
  if (!l) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Ce logement n&apos;est pas dans cette situation</h1>;
  const c = communeDe(etat, l);
  const a = analyseServie(l);
  const adresseEtudiee = a?.perimetre === "commune+adresse";
  const piste = { type: "logement" as const, logement: l };
  const g = gestePrincipal(etat, piste, etat.droits);
  const dep = a ? criteresDepasses(a, etat.projet) : [];
  const al = alertes(etat, [piste]);
  const conf = confronter(etat, [piste]);
  const questions = l.verifications.filter((q) => !q.reponse).length;
  const communeEtudiee = c?.lecture === "rapport";

  // Pour chaque condition, la lecture la plus précise disponible, et l'échelle à laquelle elle vaut.
  const rangs = conf.lignes.map((li) => {
    const adr = li.couches.find((x) => x.couche !== "commune");
    const com = li.couches.find((x) => x.couche === "commune");
    const ca = adr?.cellules[0]; const cc = com?.cellules[0];
    const use = ca?.ligne ? { cell: ca, ou: adr!.couche } : cc?.ligne ? { cell: cc, ou: "commune" as const } : null;
    return { li, use, seLitAdresse: !!adr };
  });
  const sources = rangs.filter((x) => x.use?.cell.ligne?.constat);

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, ...(c ? [{ libelle: c.nom, aller: () => aller({ ecran: "commune", id: `c:${c.insee}` }) }] : []), { libelle: l.libelle }]} />

      <header className={w.ficheTete}>
        <Vignette logement={l} taille={72} />
        <div className={s.pileSerree}>
          <h1 className={`${s.titre} ${w.titre}`} tabIndex={-1} data-titre-vue>{l.libelle}</h1>
          <p className={w.adresse}>{l.adresse ?? `${l.commune.nom} · adresse exacte inconnue`}</p>
          <p className={w.prix}>{[montantAnnonce(l.annonce), l.annonce?.surface ? `${l.annonce.surface} m²` : null, l.annonce?.pieces ? `${l.annonce.pieces} pièces` : null, l.annonce ? LIBELLE_NATURE[l.annonce.nature ?? "non_precise"] : null].filter(Boolean).join(" · ")} <Declare>déclaré par l&apos;annonce</Declare></p>
        </div>
      </header>

      <Dimensions api={api} logement={l} />

      <section className={w.aRetenir} aria-labelledby="fiche-r">
        <h2 className={w.aRetenirTitre} id="fiche-r">À retenir</h2>
        <ul className={w.retenirListe}>
          {al.map((x) => <Retenir key={x.cle} genre={x.genre === "bloque" ? "fait" : "incertain"} titre={x.genre === "bloque" ? "Votre condition sans compromis" : "À revoir"}>{lier(x.phrase)}</Retenir>)}
          {adresseEtudiee ? (
            <>
              <Retenir genre="fait" titre={`Ce que conclut son dossier, du ${dateCourte(a!.generatedAt)}`}><span data-conclusion>{lier(a!.conclusion.phrase)}</span></Retenir>
              {dep.length ? <Retenir genre="incertain" titre="Écrite sous votre Projet d'alors">{`Conservée telle quelle : ${dep.map((d) => `${d.avant.toLowerCase()} (aujourd'hui : ${d.apres.toLowerCase()})`).join(", ")}. Elle ne vaut pas pour votre Projet actuel tant que le dossier n'est pas mis à jour.`}</Retenir> : null}
            </>
          ) : (
            <>
              <Retenir genre="fait" titre="Ce que nous savons">{communeEtudiee ? `${l.commune.nom} est étudiée pour votre Projet ; ce logement ne l'est pas encore.` : `Ni ${l.commune.nom} ni ce logement ne sont encore étudiés pour votre Projet.`}</Retenir>
              <Retenir genre="incertain" titre="Ce qui manque">{l.adresse ? "L'analyse de son adresse : ses abords (gare, bruit, commerces) et le logement lui-même." : "Son adresse exacte : sans elle, seule la commune peut être étudiée. Demandez-la à l'agence."}</Retenir>
            </>
          )}
          {questions ? <Retenir genre="incertain" titre="À vérifier vous-même" action={<button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "logement", id: l.id, ancre: "verifier" })}>{questions === 1 ? "Voir la question" : `Voir les ${questions} questions`}</button>}>{questions === 1 ? "Une question prête, pour la visite ou un appel." : `${questions} questions prêtes, pour la visite ou un appel.`}</Retenir> : null}
        </ul>
        {g.cle === "adresse" ? <div className={w.prochain}><Adresse api={api} logement={l} /></div>
          : g.cle !== "ouvrir" ? (
            <div className={w.prochain}>
              <p className={w.prochainTexte}><span><span className={w.prochainCle}>Le plus utile maintenant</span> {lier(g.apport)}</span></p>
              <Agir principal onClick={faireGeste(api, piste)}>{g.libelle}</Agir>
            </div>
          ) : (
            <div className={w.prochain}><Agir onClick={() => aller({ ecran: "releve", id: l.id })}>Voir l'analyse complète</Agir></div>
          )}
      </section>

      <Section titre="Face à votre Projet" id="projet">
        {!adresseEtudiee ? <p className={w.unefois}><strong className={s.encre}>Ce logement n&apos;est pas encore étudié à son adresse.</strong> {communeEtudiee ? `Les lignes ci-dessous valent pour toute la commune de ${l.commune.nom}, pas pour ce logement en particulier.` : "Rien n'est encore étudié pour votre Projet."}</p> : null}
        <div className={w.conditions}>
          {rangs.map(({ li, use, seLitAdresse }) => {
            const limite = etat.projet.criteres.find((k) => k.cle === li.cle)?.valeur ?? null;
            return (
              <div key={li.cle} className={w.condition}>
                <p className={w.conditionNom}>{li.libelle}<span className={w.conditionPoids}> · {li.sansCompromis ? "sans compromis" : POIDS[(li.poids || 1) as 1 | 2 | 3]}</span></p>
                <div className={w.conditionLecture}>
                  {use ? (
                    <>
                      <Marque ligne={use.cell.ligne} perime={use.cell.perime} />
                      {use.cell.ligne!.mesure ? <Mesure valeur={use.cell.ligne!.mesure.valeur} unite={use.cell.ligne!.mesure.unite} limite={use.ou === "commune" ? null : limite} limiteAlors={use.cell.limiteAlors} /> : null}
                      {use.cell.ligne!.constat ? <span className={w.constat}>{lier(use.cell.ligne!.constat)}</span> : null}
                      {/* L'échelle reste attachée à la lecture : une gare dans la commune ne dit pas le trajet depuis ce logement (S7). */}
                      <span className={w.ou}>{use.ou === "commune" ? `à l'échelle de ${l.commune.nom}${seLitAdresse && !adresseEtudiee ? ", pas encore à l'adresse" : ""}` : NOM_COUCHE[use.ou].toLowerCase()}</span>
                    </>
                  ) : <span className={w.vide}>Pas encore étudié</span>}
                </div>
              </div>
            );
          })}
        </div>
        {sources.length ? (
          <Preuves>
            <ul className={w.sources}>
              {sources.map(({ li, use }) => <li key={li.cle}><strong className={s.encre}>{li.libelle}</strong> · {use!.cell.ligne!.preuve ? `${use!.cell.ligne!.preuve.source}, ${use!.cell.ligne!.preuve.date}` : "source non précisée"}{use!.cell.origine ? ` · ${use!.cell.origine}` : ""}</li>)}
            </ul>
            {adresseEtudiee ? <button type="button" className={`${s.action} ${v.cible}`} onClick={() => aller({ ecran: "releve", id: l.id })}>Voir l'analyse complète</button> : null}
          </Preuves>
        ) : null}
      </Section>

      {l.verifications.length ? <Verifier api={api} logement={l} /> : null}

      {l.observations.length || noter ? <Notes api={api} logement={l} /> : (
        <div className={w.noter}><button type="button" className={`${s.bouton} ${v.cible}`} onClick={() => setNoter(true)}>Ajouter une note</button><span className={s.nuance}>Après une visite ou un appel. Elle reste la vôtre, avec son origine.</span></div>
      )}

      <details className={`${s.details} ${v.replie}`}>
        <summary>L&apos;annonce et son lien</summary>
        <div className={v.replieCorps}>
          {l.annonce?.url ? <p className={s.dense}><a className={s.lien} href={l.annonce.url} target="_blank" rel="noopener noreferrer nofollow">Voir l&apos;annonce sur {l.annonce.site}</a> · lien gardé pour vous.</p> : <p className={s.nuance}>Aucun lien.</p>}
        </div>
      </details>
      <details className={`${s.details} ${v.replie}`}>
        <summary>Historique et raisons de vos décisions</summary>
        <ol className={v.journal}>
          {[...l.journal].reverse().map((e, i) => (
            <li key={i}><span className={v.journalDate}>{dateCourte(e.date)}</span><span className={s.dense}>{e.type === "ecarte" ? `Écarté : « ${e.raison} ».${e.contexte?.condition ? ` Votre condition d'alors : ${e.contexte.condition}.` : ""}` : e.texte}</span></li>
          ))}
        </ol>
      </details>
      {l.statut !== "ecarte" ? (
        <div className={v.piedFiche}><button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer", mode: "logements", selection: [l.id] })}>Comparer avec un autre logement</button></div>
      ) : null}
    </>
  );
}

/** Les deux dimensions, côte à côte et nommées : votre suivi (modifiable) et ce que futur•e en sait. */
function Dimensions({ api, logement }: { api: Api5; logement: Logement }) {
  const id = useId();
  const [ecarter, setEcarter] = useState(false);
  const [raison, setRaison] = useState("");
  const [cle, setCle] = useState<CleCritere | "">("");
  const ecarte = logement.statut === "ecarte";
  const e = ecarte ? [...logement.journal].reverse().find((x) => x.type === "ecarte") : undefined;
  return (
    <div className={w.dimensions}>
      <div className={w.dimension}>
        <p className={w.dimensionCle}>Votre suivi</p>
        {ecarte ? (
          <div className={s.pileSerree}>
            <Suivi logement={logement} />
            <p className={s.dense}>Le {e ? dateCourte(e.date) : "?"} : « {e?.raison} ».</p>
            <div><button type="button" className={`${s.bouton} ${v.cible}`} onClick={() => api.envoyer({ type: "reactiver", id: logement.id })}>Remettre en course</button></div>
          </div>
        ) : (
          <>
            <Selecteur id={`${id}-s`} question="Où en êtes-vous ?" valeur={logement.statut as "a_etudier" | "a_visiter" | "visite"}
              options={(["a_etudier", "a_visiter", "visite"] as const).map((x) => ({ valeur: x, libelle: x === "a_visiter" && logement.visiteLe ? `Visite le ${dateCourte(logement.visiteLe)}` : LIBELLE_SUIVI51[x] }))}
              onChoisir={(x) => api.envoyer({ type: "statut", id: logement.id, statut: x })} />
            {!ecarter ? <button type="button" className={`${s.action} ${v.cible}`} onClick={() => setEcarter(true)}>Écarter ce logement</button> : (
              <form className={v.ecarterForm} onSubmit={(ev) => { ev.preventDefault(); if (raison.trim()) api.envoyer({ type: "ecarter", id: logement.id, raison: raison.trim(), cle: cle || null }); }}>
                <label className={v.champ}><span className={s.etiquette}>Pourquoi ?</span><input value={raison} onChange={(ev) => setRaison(ev.target.value)} maxLength={200} required autoFocus placeholder="Quelques mots suffisent" /></label>
                <label className={v.champ}><span className={s.etiquette}>À cause d&apos;une condition de votre Projet ? (facultatif)</span>
                  <select value={cle} onChange={(ev) => setCle(ev.target.value as CleCritere | "")}><option value="">Non</option>{api.etat.projet.criteres.map((k) => <option key={k.cle} value={k.cle}>{libelleCritere(k)}</option>)}</select>
                </label>
                <p className={s.nuance}>Votre raison est gardée ; vous pourrez le remettre en course.</p>
                <div className={v.ligneGestes}><button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button><button type="button" className={`${s.action} ${v.cible}`} onClick={() => setEcarter(false)}>Annuler</button></div>
              </form>
            )}
          </>
        )}
      </div>
      <div className={w.dimension}>
        <p className={w.dimensionCle}>Ce que futur•e en sait</p>
        <Savoir r={api.etat} logement={logement} />
      </div>
    </div>
  );
}
