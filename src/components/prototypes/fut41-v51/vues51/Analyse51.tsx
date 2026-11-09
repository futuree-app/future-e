"use client";
// L'ANALYSE COMPLÈTE, V5.1 (ex-« Relevé » de la V5 ; le mot reste un nom interne de direction artistique).
// Simplifiée pour la revue : en production, c'est le dossier servi (verdict, contrôles, preuves) et ses
// trois échelles, Territoire, Autour de l'adresse et Logement (pages existantes `/rapport/quartier`,
// `/rapport/autour`, `/rapport/logement`). Ici, les quatre onglets filtrent les lignes du même dossier
// par l'échelle où elles ont été lues ; la conclusion est citée mot pour mot, à sa date, avec le Projet
// sous lequel elle a été écrite. Chaque version reste lisible.
import { useState } from "react";
import { EmblemeEchelles, Ligne, Marge, Plaque, Registre, Selecteur, releve as s } from "@/components/releve/primitives";
import { communeCommeLieu, dateCourte, etatsEmbleme, libelleCritere, GRAIN_LIBELLE, TEINTE_ISSUE, LIBELLE_ISSUE_SIMPLE } from "../../fut41-v5/modele5";
import type { Api5 } from "../../fut41-v5/CentreDecision5";
import { Fil, lier } from "../../fut41-v5/communs5";
import { Agir } from "../communs51";
import v from "../../fut41-v5/v5.module.css";
import w from "../v51.module.css";

type Onglet = "synthese" | "territoire" | "autour" | "logement";
const GRAIN_ONGLET = { commune: "territoire", secteur: "autour", batiment: "logement" } as const;
const NOM_ONGLET: Record<Onglet, string> = { synthese: "Synthèse", territoire: "Territoire", autour: "Autour de l'adresse", logement: "Logement" };

export function Analyse51({ api }: { api: Api5 }) {
  const { etat, aller } = api;
  const id = etat.vue.id ?? "";
  const commune = id.startsWith("c:") ? etat.communes.find((c) => `c:${c.insee}` === id) : undefined;
  const lieu = commune ? communeCommeLieu(commune) : etat.logements.find((l) => l.id === id);
  const [version, setVersion] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("synthese");
  const retour = () => aller(commune ? { ecran: "commune", id } : { ecran: "logement", id });
  if (!lieu || !lieu.analyses.length) return <h1 className={s.titre} tabIndex={-1} data-titre-vue>Aucune analyse pour ce lieu</h1>;
  const a = lieu.analyses.find((x) => String(x.version) === version) ?? lieu.analyses[lieu.analyses.length - 1]!;
  const derniere = a === lieu.analyses[lieu.analyses.length - 1];
  const onglets: Onglet[] = a.perimetre === "commune" ? ["synthese", "territoire"] : ["synthese", "territoire", "autour", "logement"];
  const lignes = a.projet.criteres.flatMap((k) => {
    const r = a.registre.find((x) => x.cle === k.cle);
    return r && (onglet === "synthese" || (r.grain && GRAIN_ONGLET[r.grain as keyof typeof GRAIN_ONGLET] === onglet)) ? [{ k, r }] : [];
  });

  return (
    <>
      <Fil segments={[{ libelle: "Ma décision", aller: () => aller({ ecran: "ensemble" }) }, { libelle: lieu.libelle, aller: retour }, { libelle: "Analyse complète" }]} />
      <p className={v.simplifie}>Analyse simplifiée pour la revue. En production : le dossier servi, avec ses trois échelles.</p>
      <div className={v.releveTete}>
        <div className={s.pileSerree}>
          <p className={s.surtitre}><span>{a.perimetre === "commune" ? "Analyse de la commune" : "Analyse de l'adresse"} · {dateCourte(a.generatedAt)}</span></p>
          <h1 className={`${s.titre} ${w.titre}`} tabIndex={-1} data-titre-vue>{lieu.adresse ?? lieu.libelle}</h1>
          <p className={s.nuance}>Écrite sous votre Projet du {dateCourte(a.projet.date)}{a.projet.revision !== etat.projet.revision ? " ; votre Projet a changé depuis" : ""}.</p>
        </div>
        <div className={v.releveEmbleme}><EmblemeEchelles etiquette="Échelles étudiées" etats={etatsEmbleme({ ...lieu, analyses: [a] })} /></div>
      </div>

      <nav className={w.onglets} aria-label="Les échelles de l'analyse">
        {onglets.map((o) => <button key={o} type="button" className={w.onglet} aria-current={onglet === o ? "page" : undefined} onClick={() => setOnglet(o)}>{NOM_ONGLET[o]}</button>)}
      </nav>

      {lieu.analyses.length > 1 ? (
        <Selecteur id="versions" question="Version" valeur={String(a.version)} onChoisir={setVersion}
          options={lieu.analyses.map((x) => ({ valeur: String(x.version), libelle: `${x.version} · ${dateCourte(x.generatedAt)}${x === lieu.analyses[lieu.analyses.length - 1] ? " (actuelle)" : ""}` }))} />
      ) : null}
      {!derniere ? <p className={v.change}>Version ancienne, conservée telle qu&apos;elle a été écrite.</p> : null}
      {onglet === "synthese" ? <Plaque etiquette="Conclusion"><p className={s.etiquette}>{a.conclusion.etiquette}</p><p className={`${s.display} ${s.verdict}`} data-conclusion>{lier(a.conclusion.phrase)}</p></Plaque> : null}
      <div className={`${s.liste} ${v.releveListe}`}>
        {lignes.length ? lignes.map(({ k, r }) => (
          <Ligne key={k.cle} marge={<Marge elements={[...(r.grain ? [{ type: "grain" as const, grain: r.grain, libelle: GRAIN_LIBELLE[r.grain] }] : []), ...(r.preuve ? [{ type: "source" as const, texte: `Source : ${r.preuve.source}`, date: r.preuve.date }] : [])]} />}>
            <Registre teinte={TEINTE_ISSUE[r.issue]} as="h3">{libelleCritere(k)}</Registre>
            <p className={s.dense}><strong className={s.encre}>{LIBELLE_ISSUE_SIMPLE[r.issue]}</strong>{r.constat ? ` : ${r.constat}` : ""}</p>
          </Ligne>
        )) : <p className={s.nuance}>Aucune condition de votre Projet n&apos;est étudiée à cette échelle dans cette analyse.</p>}
      </div>
      <div className={v.ligneGestes}>
        <Agir principal onClick={retour}>{commune ? `Revenir à ${lieu.libelle}` : "Revenir à la fiche du logement"}</Agir>
        {!commune ? <button type="button" className={`${s.bouton} ${v.cible}`} onClick={() => aller({ ecran: "comparer", mode: "logements", selection: [id] })}>Comparer avec un autre logement</button> : null}
      </div>
    </>
  );
}
