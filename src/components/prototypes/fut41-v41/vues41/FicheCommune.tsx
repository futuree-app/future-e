"use client";
// UNE COMMUNE, V4.1 · ce que la commune dit pour votre Projet (une seule lecture, valable pour tous
// ses logements), ou ce que la lecture gratuite ne dit pas encore ; puis ses logements.
import { useState } from "react";
import { GlypheGrain, Plaque, releve as s } from "@/components/releve/primitives";
import { analyseServie, communeCommeLieu, criteresDepasses, dateCourte, gestePrincipal, libelleCritere, logementsDe, savoirLogement, LIBELLE_STATUT } from "../modele41";
import type { Api41 } from "../CentreDecision41";
import { BoutonGeste, Fil41, Marque, Section, Triade, Vignette, lier } from "../communs41";
import { faireGeste } from "./Accueil";
import v from "../v41.module.css";

export function FicheCommune({ api }: { api: Api41 }) {
  const { etat, aller, envoyer } = api;
  const c = etat.communes.find((x) => `c:${x.insee}` === etat.vue.id);
  const [ecarter, setEcarter] = useState(false);
  const [raison, setRaison] = useState("");
  if (!c) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Cette commune n&apos;est pas dans cette situation</h1>;
  const a = c.lecture === "rapport" ? analyseServie(communeCommeLieu(c)) : null;
  const dep = a ? criteresDepasses(a, etat.projet) : [];
  const g = gestePrincipal(etat, { type: "commune", commune: c }, etat.droits);
  const logements = logementsDe(etat, c);
  return (
    <>
      <Fil41 segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "accueil" }) }, { libelle: c.nom }]} />
      <div className={v.ficheTete}>
        <span className={v.communeGlyphe} aria-hidden><GlypheGrain grain="commune" taille={56} /></span>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>La commune</span></p>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{c.nom}</h1>
          <p className={s.nuance}>{a ? `Rapport de territoire du ${dateCourte(a.generatedAt)}${a.simulee ? " (simulé)" : ""}` : c.lecture === "gratuite" ? "Lecture gratuite" : "Pas encore lue"}{c.statut === "ecartee" ? ` · écartée : « ${c.raisonEcart} »` : ""}</p>
        </div>
      </div>
      {c.statut === "ecartee" ? <div className={v.ecarteBandeau}><p className={s.dense}>Écartée : « {c.raisonEcart} ».</p><button type="button" className={s.bouton} onClick={() => envoyer({ type: "reactiver", id: `c:${c.insee}` })}>Remettre en course</button></div> : null}

      {a ? (
        <Plaque etiquette="Ce que conclut le rapport" className={v.conclusion}>
          <p className={s.etiquette}>Rapport de territoire · vaut pour vos {logements.filter((l) => l.statut !== "ecarte").length} logement{logements.length > 1 ? "s" : ""} de {c.nom}, à l&apos;échelle de la commune</p>
          <p className={v.conclusionTexte} data-conclusion>{lier(a.conclusion.phrase)}</p>
          <p className={s.nuance}>{dep.length ? `Fait sous votre Projet du ${dateCourte(a.projet.date)} : ${dep.map((d) => `${d.avant.toLowerCase()} (aujourd'hui : ${d.apres.toLowerCase()})`).join(", ")}. Tant qu'il n'est pas mis à jour, cette condition ne se compare pas avec les autres communes.` : "Répond à votre Projet actuel."}</p>
          <div className={v.ligneGestes}>
            <button type="button" className={s.bouton} onClick={() => aller({ ecran: "releve", id: `c:${c.insee}` })}>Ouvrir le Relevé de {c.nom}</button>
            {dep.length ? <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => envoyer({ type: "mettre_a_jour", id: `c:${c.insee}` })}>Mettre à jour (gratuit)</button> : null}
          </div>
        </Plaque>
      ) : (
        <Section titre="Ce que la lecture gratuite dit, et ne dit pas" id="gratuit">
          <ul className={v.listeSimple}>{c.apercu.map((x) => <li key={x} className={s.dense}>{x}</li>)}</ul>
          <p className={s.nuance}>Ces repères situent {c.nom} parmi les communes de France. Ils ne disent pas si elle tient vos conditions.</p>
          <BoutonGeste geste={g} faire={faireGeste(api, { type: "commune", commune: c })} principal />
        </Section>
      )}

      {a ? (
        <Section titre="Face à votre Projet" id="projet" sous={`Lu à l'échelle de la commune. Pour un logement précis, seuls ses abords et le logement lui-même disent plus.`}>
          <ul className={v.faceListe}>
            {etat.projet.criteres.map((k) => {
              const l = a.registre.find((x) => x.cle === k.cle) ?? null;
              return (
                <li key={k.cle}>
                  <span className={v.faceCrit}>{libelleCritere(k)}{k.nature === "sans_compromis" ? <span className={v.dur}> · sans compromis</span> : null}</span>
                  <Marque ligne={l} sansLieu />
                  {l?.constat ? <span className={v.faceConstat}>{lier(l.constat)}</span> : null}
                  {l?.preuve ? <span className={v.preuve}>{l.preuve.source}, {l.preuve.date}</span> : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      <Section titre={`Vos logements à ${c.nom}`} id="logements">
        {logements.length ? (
          <ul className={v.listeSimple}>
            {logements.map((l) => (
              <li key={l.id} className={v.miniLogement}>
                <Vignette logement={l} taille={44} />
                <span className={s.pileSerree}>
                  <button type="button" className={v.lien} onClick={() => aller({ ecran: "fiche", id: l.id })}>{l.libelle}</button>
                  <span className={s.nuance}>{LIBELLE_STATUT[l.statut]}</span>
                  <Triade savoir={savoirLogement(etat, l)} compacte />
                </span>
              </li>
            ))}
          </ul>
        ) : <p className={s.nuance}>Aucun logement ici pour l&apos;instant.</p>}
      </Section>

      {c.statut !== "ecartee" ? (
        !ecarter ? <button type="button" className={s.action} onClick={() => setEcarter(true)}>Écarter {c.nom}</button> : (
          <form className={v.ecarterForm} onSubmit={(e) => { e.preventDefault(); if (raison.trim()) envoyer({ type: "ecarter", id: `c:${c.insee}`, raison: raison.trim(), cle: null }); }}>
            <label className={v.champ}><span className={s.etiquette}>Pourquoi écarter {c.nom} ?</span><input value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={200} required autoFocus /></label>
            <div className={v.ligneGestes}><button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button><button type="button" className={s.action} onClick={() => setEcarter(false)}>Annuler</button></div>
          </form>
        )
      ) : null}
    </>
  );
}
