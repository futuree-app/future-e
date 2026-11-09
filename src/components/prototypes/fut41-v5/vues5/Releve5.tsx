"use client";
// LE RELEVÉ, simplifié pour la revue (en production : DossierDecisionReleve, FUT-91). La conclusion est
// celle de la fiche, mot pour mot, à sa date. Quand un dossier a été mis à jour, chaque version reste
// lisible avec le Projet sous lequel elle a été écrite.
import { useState } from "react";
import { EmblemeEchelles, Ligne, Marge, Plaque, Registre, Selecteur, releve as s } from "@/components/releve/primitives";
import { communeCommeLieu, dateCourte, etatsEmbleme, libelleCritere, GRAIN_LIBELLE, TEINTE_ISSUE, LIBELLE_ISSUE_SIMPLE } from "../modele5";
import type { Api5 } from "../CentreDecision5";
import { Fil, lier } from "../communs5";
import v from "../v5.module.css";

export function Releve5({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const id = etat.vue.id ?? "";
  const commune = id.startsWith("c:") ? etat.communes.find((c) => `c:${c.insee}` === id) : undefined;
  const lieu = commune ? communeCommeLieu(commune) : etat.logements.find((l) => l.id === id);
  const [version, setVersion] = useState<string | null>(null);
  const retour = () => aller(commune ? { ecran: "commune", id } : { ecran: "logement", id });
  if (!lieu || !lieu.analyses.length) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Aucun dossier ici</h1>;
  const a = lieu.analyses.find((x) => String(x.version) === version) ?? lieu.analyses[lieu.analyses.length - 1]!;
  const derniere = a === lieu.analyses[lieu.analyses.length - 1];
  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, { libelle: lieu.libelle, aller: retour }, { libelle: "Relevé" }]} />
      <p className={v.simplifie}>Relevé simplifié pour la revue. En production : le Relevé du dossier servi.</p>
      <div className={v.releveTete}>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>{a.perimetre === "commune" ? "Rapport de territoire" : "Dossier d'adresse"} · {dateCourte(a.generatedAt)}</span></p>
          <h1 className={`${s.titre} ${v.titreVue}`} tabIndex={-1} data-titre-vue>{lieu.adresse ?? lieu.libelle}</h1>
          <p className={s.nuance}>Écrit sous votre Projet du {dateCourte(a.projet.date)} (révision {a.projet.revision}){a.projet.revision !== etat.projet.revision ? ` ; votre Projet actuel est la révision ${etat.projet.revision}` : ""}.</p>
        </div>
        <div className={v.releveEmbleme}><EmblemeEchelles etiquette="Échelles lues" etats={etatsEmbleme({ ...lieu, analyses: [a] })} /></div>
      </div>
      {lieu.analyses.length > 1 ? (
        <Selecteur id="versions" question="Version" valeur={String(a.version)} onChoisir={setVersion}
          options={lieu.analyses.map((x) => ({ valeur: String(x.version), libelle: `${x.version} · ${dateCourte(x.generatedAt)}${x === lieu.analyses[lieu.analyses.length - 1] ? " (actuelle)" : ""}` }))} />
      ) : null}
      {!derniere ? <p className={v.change}>Version ancienne, conservée telle qu&apos;elle a été écrite.</p> : null}
      <Plaque etiquette="Verdict"><p className={s.etiquette}>{a.conclusion.etiquette}</p><p className={`${s.display} ${s.verdict}`} data-conclusion>{lier(a.conclusion.phrase)}</p></Plaque>
      <div className={`${s.liste} ${v.releveListe}`}>
        {a.projet.criteres.map((k) => {
          const r = a.registre.find((x) => x.cle === k.cle);
          if (!r) return null;
          return (
            <Ligne key={k.cle} marge={<Marge elements={[...(r.grain ? [{ type: "grain" as const, grain: r.grain, libelle: GRAIN_LIBELLE[r.grain] }] : []), ...(r.preuve ? [{ type: "source" as const, texte: `Source : ${r.preuve.source}`, date: r.preuve.date }] : [])]} />}>
              <Registre teinte={TEINTE_ISSUE[r.issue]} as="h3">{libelleCritere(k)}</Registre>
              <p className={s.dense}><strong className={s.encre}>{LIBELLE_ISSUE_SIMPLE[r.issue]}</strong>{r.constat ? ` : ${r.constat}` : ""}</p>
            </Ligne>
          );
        })}
      </div>
      <div className={v.ligneGestes}><button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={retour}>Retrouver {lieu.libelle} dans Ma décision</button></div>
    </>
  );
}
