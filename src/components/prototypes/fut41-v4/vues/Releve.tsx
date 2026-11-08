"use client";
// LE RELEVÉ D'UN LOGEMENT, SIMPLIFIÉ POUR LA REVUE. En production, c'est `DossierDecisionReleve`
// (FUT-91, sous `DECISION_RELEVE`) qui rend le dossier servi. Ici, la même conclusion, mot pour mot,
// les mêmes échelles et les mêmes preuves, pour montrer la continuité : on entre depuis la fiche, on
// en ressort vers elle (« Retrouver ce logement dans Ma décision »).
import { CoupeEchelles, EmblemeEchelles, Ligne, Marge, Plaque, Registre, releve as s } from "@/components/releve/primitives";
import { analyseServie, dateCourte, etatsEmbleme, libelleCritere, GRAIN_LIBELLE, LIBELLE_ISSUE, TEINTE_ISSUE } from "../modele";
import type { Api } from "../CentreDecision";
import { Fil, lier } from "../communs";
import v from "../v4.module.css";

export function Releve({ api }: { api: Api }) {
  const { etat, aller } = api;
  const lieu = etat.lieux.find((l) => l.id === etat.vue.lieu);
  const a = lieu ? analyseServie(lieu) : null;
  if (!lieu || !a) {
    return (
      <>
        <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) }, { libelle: "Relevé" }]} />
        <h1 className={s.titre} tabIndex={-1} data-titre-vue>Aucun dossier ne conclut sur ce logement</h1>
      </>
    );
  }
  const compte = (g: "commune" | "secteur" | "batiment") => a.registre.filter((r) => r.grain === g && r.constat).length;
  return (
    <>
      <Fil segments={[
        { libelle: "Ma décision", aller: () => aller({ ecran: "decision" }) },
        { libelle: lieu.libelle, aller: () => aller({ ecran: "fiche", lieu: lieu.id }) },
        { libelle: "Relevé" },
      ]} />
      <p className={v.bandeauSimplifie}>Relevé simplifié pour la revue. En production : le Relevé du dossier servi (FUT-91), version {a.version} du {dateCourte(a.generatedAt)}.</p>
      <div className={v.releveTete}>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>{a.perimetre === "commune" ? "Rapport de territoire" : "Dossier d'adresse"} · version {a.version} du {dateCourte(a.generatedAt)}</span></p>
          <h1 className={`${s.titre} ${s.titreAdresse}`} tabIndex={-1} data-titre-vue>{lieu.adresse ?? lieu.commune.nom}</h1>
          <p className={s.nuance}>Votre Projet du {dateCourte(a.projet.date)} (révision {a.projet.revision})</p>
        </div>
        <div className={v.releveEmbleme}>
          <EmblemeEchelles etiquette="Les trois échelles du dossier" etats={etatsEmbleme(lieu)}
            renvois={[`commune · ${compte("commune")}`, a.perimetre === "commune" ? "abords · non lus" : `abords · ${compte("secteur")}`, a.perimetre === "commune" ? "logement · non lu" : `logement · ${compte("batiment")}`]} />
        </div>
      </div>
      <Plaque etiquette="Verdict">
        <p className={s.etiquette}>{a.conclusion.etiquette}</p>
        <p className={`${s.display} ${s.verdict}`} data-conclusion>{lier(a.conclusion.phrase)}</p>
      </Plaque>
      <section className={s.mouvementSerre}>
        <div className={s.liste}>
          {a.projet.criteres.map((c) => {
            const r = a.registre.find((x) => x.cle === c.cle);
            if (!r) return null;
            return (
              <Ligne key={c.cle} marge={<Marge elements={[
                ...(r.grain ? [{ type: "grain" as const, grain: r.grain, libelle: GRAIN_LIBELLE[r.grain] }] : []),
                ...(r.preuve ? [{ type: "source" as const, texte: `Source : ${r.preuve.source}`, date: r.preuve.date }] : []),
              ]} />}>
                <Registre teinte={TEINTE_ISSUE[r.issue]} as="h3">{libelleCritere(c)}</Registre>
                <p className={s.dense}><strong className={s.encre}>{LIBELLE_ISSUE[r.issue]}</strong>{r.constat ? ` : ${r.constat}` : ""}</p>
              </Ligne>
            );
          })}
        </div>
      </section>
      <CoupeEchelles liens={{}} courante="territoire" />
      <div className={`${v.gestes} ${v.retourReleve}`}>
        <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => aller({ ecran: "fiche", lieu: lieu.id })}>Retrouver ce logement dans Ma décision</button>
      </div>
    </>
  );
}
