"use client";
// LE PANNEAU D'UN GESTE D'ANALYSE · avant d'analyser une adresse, de lire une commune ou de mettre à
// jour un dossier : ce que ce geste apprendra pour votre Projet, ce qu'il ne dira pas, ce qu'il coûte.
// Rien ne se déclenche en un clic depuis une liste : le panneau est le seul endroit d'où l'on lance.
import { useEffect, useId, useRef } from "react";
import { releve as s } from "@/components/releve/primitives";
import { analysesEnAttente, portee, type Geste, type Piste } from "./modele5";
import { PASS_INCLUSES, peutSimuler } from "./etat5";
import type { Api5 } from "./CentreDecision5";
import { lier } from "./communs5";
import v from "./v5.module.css";

export function PanneauAnalyse({ api, piste, geste, fermer }: { api: Api5; piste: Piste; geste: Geste["cle"]; fermer: () => void }) {
  const id = useId();
  const { etat, envoyer } = api;
  const p = portee(etat, piste, geste);
  const ref = useRef<HTMLDivElement>(null);
  const pisteId = piste.type === "commune" ? `c:${piste.commune.insee}` : piste.logement.id;
  const simulable = geste === "mettre_a_jour" || peutSimuler(pisteId);
  const pass = etat.droits === "pass";
  const prix = geste === "mettre_a_jour" ? "Gratuit : le dossier est déjà acquis." : pass ? `Inclus dans votre Pass Recherche (hypothèse) : ${PASS_INCLUSES - etat.passUtilisees} analyses restantes jusqu'au 18 janv.` : geste === "analyser" ? "39 € à l'unité." : "14 € à l'unité.";
  const attente = analysesEnAttente(etat);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("h2")?.focus();
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [fermer]);

  const lancer = () => {
    if (geste === "mettre_a_jour") envoyer({ type: "mettre_a_jour", id: pisteId });
    else if (geste === "analyser") envoyer({ type: "analyser", id: pisteId });
    else envoyer({ type: "examiner", insee: pisteId.slice(2) });
    fermer();
  };

  return (
    <div className={v.voile} onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <div ref={ref} className={v.panneau} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <div className={v.panneauTete}><p className={v.simulation}>Prototype · rien n&apos;est payé ni analysé</p><button type="button" className={s.action} onClick={fermer}>Fermer</button></div>
        <h2 className={s.titre} id={`${id}-t`} tabIndex={-1}>{lier(p.titre)}</h2>
        <div className={v.portee}>
          <p className={v.porteeCle}>Ce que vous saurez</p>
          <ul>{p.lit.map((x) => <li key={x}>{lier(x)}</li>)}</ul>
        </div>
        <div className={v.portee} data-genre="jamais">
          <p className={v.porteeCle}>Ce qu&apos;elle ne dira pas</p>
          <ul>{p.nePasDire.map((x) => <li key={x}>{lier(x)}</li>)}</ul>
        </div>
        {p.note ? <p className={s.nuance}>{lier(p.note)}</p> : null}
        <p className={s.dense}><strong className={s.encre}>{prix}</strong></p>
        {!pass && geste !== "mettre_a_jour" && attente >= 2 ? (
          <p className={s.nuance}>{attente} de vos possibilités attendent une analyse. À l&apos;unité, chacune se paie ; un Pass Recherche (hypothèse de revue : ni prix ni quota décidés) en couvrirait plusieurs pendant votre recherche.</p>
        ) : null}
        {simulable ? (
          <div className={v.ligneGestes}>
            <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={lancer}>{geste === "mettre_a_jour" ? "Mettre à jour (simulé)" : "Lancer l'analyse (simulée)"}</button>
            <button type="button" className={s.action} onClick={fermer}>Pas maintenant</button>
          </div>
        ) : (
          <p className={v.simplifie}>Dans ce prototype, seules l&apos;analyse du T4 rue de la Convention, celle du T4 place Sainte-Anne et la lecture d&apos;Angers sont simulées. Rien d&apos;autre ne peut être lancé ici.</p>
        )}
      </div>
    </div>
  );
}
