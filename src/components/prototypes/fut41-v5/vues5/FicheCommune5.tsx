"use client";
// UNE COMMUNE, V5 · ce que la commune dit pour votre Projet (une seule lecture, valable pour tous ses
// logements, sans rien dire d'un logement en particulier), ou ce que la lecture gratuite ne dit pas
// encore ; puis ses logements, et l'accès à la comparaison avec vos autres communes.
import { useState } from "react";
import { GlypheGrain, Plaque, releve as s } from "@/components/releve/primitives";
import { alertes, analyseServie, communeCommeLieu, confronter, criteresDepasses, dateCourte, gestePrincipal, logementsDe, LIBELLE_STATUT } from "../modele5";
import { faireGeste, type Api5 } from "../CentreDecision5";
import { BoutonGeste, Fil, Section, Vignette, lier } from "../communs5";
import { Confrontation } from "../Confrontation";
import { savoirCourt } from "./Ensemble";
import v from "../v5.module.css";

export function FicheCommune5({ api }: { api: Api5 }) {
  const { etat, aller, envoyer } = api;
  const c = etat.communes.find((x) => `c:${x.insee}` === etat.vue.id);
  const [ecarter, setEcarter] = useState(false);
  const [raison, setRaison] = useState("");
  if (!c) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Cette commune n&apos;est pas dans cette situation</h1>;
  const piste = { type: "commune" as const, commune: c };
  const a = c.lecture === "rapport" ? analyseServie(communeCommeLieu(c)) : null;
  const dep = a ? criteresDepasses(a, etat.projet) : [];
  const g = gestePrincipal(etat, piste, etat.droits);
  const logements = logementsDe(etat, c);
  const actifs = logements.filter((l) => l.statut !== "ecarte");
  const autres = etat.communes.filter((x) => x.statut !== "ecartee" && x.insee !== c.insee);
  const conf = confronter(etat, [piste]);
  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, { libelle: c.nom }]} />
      <div className={v.ficheTete}>
        <span className={v.communeGlyphe} aria-hidden><GlypheGrain grain="commune" taille={56} /></span>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>La commune</span></p>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{c.nom}</h1>
          <p className={s.nuance}>{a ? `Rapport de territoire du ${dateCourte(a.generatedAt)}${a.simulee ? " (simulé)" : ""}` : c.lecture === "gratuite" ? "Lecture gratuite" : "Pas encore étudiée"} · {actifs.length ? `${actifs.length} logement${actifs.length > 1 ? "s" : ""} en vue` : "aucun logement"}</p>
        </div>
      </div>
      {c.statut === "ecartee" ? <div className={v.ecarteBandeau}><p className={s.dense}>Écartée : « {c.raisonEcart} ».</p><button type="button" className={s.bouton} onClick={() => envoyer({ type: "reactiver", id: `c:${c.insee}` })}>Remettre en course</button></div> : null}

      {a ? (
        <Plaque etiquette="Ce que conclut le rapport" className={v.conclusion}>
          <p className={s.etiquette}>Rapport de territoire · vaut pour la commune, et donc pour tous vos logements de {c.nom}, sans rien dire de l&apos;un d&apos;eux en particulier</p>
          <p className={v.conclusionTexte} data-conclusion>{lier(a.conclusion.phrase)}</p>
          {alertes(etat, [piste]).map((x) => <p key={x.cle} className={v.alerte} data-genre={x.genre}>{lier(x.phrase)}</p>)}
          <p className={dep.length ? v.change : s.nuance}>{dep.length ? `Conclusion conservée telle qu'elle a été écrite, sous votre Projet du ${dateCourte(a.projet.date)} ; tant qu'elle n'est pas mise à jour, cette condition ne se compare pas avec vos autres communes.` : "Écrite pour votre Projet actuel."}</p>
          <div className={v.ligneGestes}>
            <button type="button" className={s.bouton} onClick={() => aller({ ecran: "releve", id: `c:${c.insee}` })}>Ouvrir le Relevé de {c.nom}</button>
            {dep.length ? <BoutonGeste geste={g} faire={faireGeste(api, piste)} principal /> : null}
          </div>
        </Plaque>
      ) : (
        <Section titre="Ce que la lecture gratuite dit, et ne dit pas" id="gratuit">
          <ul className={v.listeSimple}>{c.apercu.map((x) => <li key={x} className={s.dense}>{x}</li>)}</ul>
          <p className={s.nuance}>Ces repères situent {c.nom} parmi les communes de France. Ils ne disent pas si elle tient vos conditions.</p>
          <BoutonGeste geste={g} faire={faireGeste(api, piste)} principal apport={g.apport} />
        </Section>
      )}

      {a ? (
        <Section titre="Face à votre Projet" id="projet" sous="Lu à l'échelle de la commune. Pour un logement précis, ses abords et le logement lui-même se lisent depuis son adresse.">
          <Confrontation colonnes={conf.colonnes} lignes={conf.lignes} projet={etat.projet} seul />
        </Section>
      ) : null}

      <Section titre={`Vos logements à ${c.nom}`} id="logements" action={actifs.length > 1 ? <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer", mode: "logements", selection: actifs.slice(0, 4).map((l) => l.id) })}>Les comparer</button> : undefined}>
        {logements.length ? (
          <ul className={v.listeSimple}>
            {logements.map((l) => (
              <li key={l.id} className={v.miniLogement}>
                <Vignette logement={l} taille={44} />
                <span className={s.pileSerree}>
                  <button type="button" className={v.lien} onClick={() => aller({ ecran: "logement", id: l.id })}>{l.libelle}</button>
                  <span className={s.nuance}>{LIBELLE_STATUT[l.statut]} · {savoirCourt(api, l)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className={s.nuance}>Aucun logement ici pour l&apos;instant. La commune se compare déjà à vos autres communes.</p>}
      </Section>

      <div className={v.piedFiche}>
        {autres.length && c.statut !== "ecartee" ? <button type="button" className={s.bouton} onClick={() => aller({ ecran: "comparer", mode: "communes", selection: [`c:${c.insee}`, ...autres.slice(0, 3).map((x) => `c:${x.insee}`)] })}>Comparer avec vos autres communes</button> : null}
        {c.statut !== "ecartee" ? (
          !ecarter ? <button type="button" className={s.action} onClick={() => setEcarter(true)}>Écarter {c.nom}</button> : (
            <form className={v.ecarterForm} onSubmit={(e) => { e.preventDefault(); if (raison.trim()) envoyer({ type: "ecarter", id: `c:${c.insee}`, raison: raison.trim(), cle: null }); }}>
              <label className={v.champ}><span className={s.etiquette}>Pourquoi écarter {c.nom} ?</span><input value={raison} onChange={(e) => setRaison(e.target.value)} maxLength={200} required autoFocus /></label>
              <p className={s.nuance}>Ses logements restent gardés ; votre raison aussi.</p>
              <div className={v.ligneGestes}><button type="submit" className={s.bouton} disabled={!raison.trim()}>Écarter</button><button type="button" className={s.action} onClick={() => setEcarter(false)}>Annuler</button></div>
            </form>
          )
        ) : null}
      </div>
    </>
  );
}
