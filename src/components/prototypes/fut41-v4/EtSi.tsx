"use client";
// ET SI MON PROJET CHANGEAIT ? · une simulation qui ne modifie rien. Elle dit, lieu par lieu, ce qui
// POURRAIT changer et avec quelle certitude (une mesure figée le laisse penser, ou seule une analyse
// mise à jour le dirait). Adopter le changement est un second geste, confirmé, qui crée une révision.
import { useEffect, useId, useRef, useState } from "react";
import { Selecteur, releve as s } from "@/components/releve/primitives";
import { dateCourte, libelleCritere, montantFr, simuler, type CleCritere, type EffetSimule, type ModificationProjet } from "./modele";
import type { Api } from "./CentreDecision";
import { lier } from "./communs";
import v from "./v4.module.css";

type Levier = "gare" | "mer" | "calme" | "budget";

const CERTITUDE: Record<EffetSimule["certitude"], string> = {
  raison_a_revoir: "Une raison d'écart à revoir",
  pourrait_changer: "Pourrait changer (une mesure de l'analyse le laisse penser)",
  a_mettre_a_jour: "Seule une analyse mise à jour le dirait",
  information: "Montants déclarés (futur•e ne les mesure pas)",
};

export function EtSi({ api, fermer }: { api: Api; fermer: () => void }) {
  const id = useId();
  const { etat, envoyer } = api;
  const p = etat.projet;
  const valeurDe = (cle: CleCritere) => p.criteres.find((c) => c.cle === cle)?.valeur;
  const [levier, setLevier] = useState<Levier>("gare");
  const [gare, setGare] = useState(String(valeurDe("gare") ?? 20));
  const [mer, setMer] = useState(String(valeurDe("mer") ?? 15));
  const [calme, setCalme] = useState<"sans_compromis" | "priorite">(p.criteres.find((c) => c.cle === "calme")?.nature ?? "priorite");
  const [budget, setBudget] = useState(String(p.budget?.montant ?? 1100));
  const [confirmer, setConfirmer] = useState(false);
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panneau.current?.querySelector<HTMLElement>("h2")?.focus();
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [fermer]);

  const modif: ModificationProjet = levier === "gare" ? { type: "valeur", cle: "gare", valeur: Number(gare) }
    : levier === "mer" ? { type: "valeur", cle: "mer", valeur: Number(mer) }
      : levier === "calme" ? { type: "nature", cle: "calme", nature: calme }
        : { type: "budget", montant: Number(budget) };
  const inchange = (levier === "gare" && Number(gare) === valeurDe("gare")) || (levier === "mer" && Number(mer) === valeurDe("mer"))
    || (levier === "calme" && calme === p.criteres.find((c) => c.cle === "calme")?.nature) || (levier === "budget" && Number(budget) === p.budget?.montant);
  const r = simuler(etat.lieux, p, modif);
  const parCertitude = (Object.keys(CERTITUDE) as EffetSimule["certitude"][]).map((c) => ({ c, effets: r.effets.filter((e) => e.certitude === c) })).filter((x) => x.effets.length);

  const avant = levier === "budget" ? (p.budget ? `${montantFr(p.budget.montant)} par mois` : "aucun") : levier === "calme" ? (p.criteres.find((c) => c.cle === "calme")?.nature === "sans_compromis" ? "Le calme, sans compromis" : "Le calme, une priorité") : libelleCritere(p.criteres.find((c) => c.cle === levier)!);
  const apres = levier === "budget" ? `${montantFr(Number(budget))} par mois` : levier === "calme" ? (calme === "sans_compromis" ? "Le calme, sans compromis" : "Le calme, une priorité") : libelleCritere(r.projet.criteres.find((c) => c.cle === levier)!);

  return (
    <div className={v.voile} onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <div ref={panneau} className={v.panneau} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <div className={v.panneauTete}>
          <p className={v.simulation}>Simulation · votre Projet n&apos;est pas modifié</p>
          <button type="button" className={s.action} onClick={fermer}>Fermer</button>
        </div>
        <h2 className={s.titre} id={`${id}-t`} tabIndex={-1}>Et si votre Projet changeait ?</h2>

        <Selecteur id={`${id}-levier`} question="Ce que vous voulez essayer" valeur={levier} onChoisir={(x) => { setLevier(x); setConfirmer(false); }}
          options={[{ valeur: "gare", libelle: "La gare" }, { valeur: "mer", libelle: "La mer" }, { valeur: "calme", libelle: "Le calme" }, { valeur: "budget", libelle: "Le budget" }]} />

        {levier === "gare" ? <Selecteur id={`${id}-g`} question="Une gare à moins de" valeur={gare} onChoisir={setGare} options={["15", "20", "30", "40"].map((x) => ({ valeur: x, libelle: `${x} min` }))} /> : null}
        {levier === "mer" ? <Selecteur id={`${id}-m`} question="La mer à moins de" valeur={mer} onChoisir={setMer} options={["10", "15", "25"].map((x) => ({ valeur: x, libelle: `${x} km` }))} /> : null}
        {levier === "calme" ? <Selecteur id={`${id}-c`} question="Le calme est" valeur={calme} onChoisir={setCalme} options={[{ valeur: "priorite", libelle: "une priorité" }, { valeur: "sans_compromis", libelle: "sans compromis" }]} /> : null}
        {levier === "budget" ? <Selecteur id={`${id}-b`} question="Budget par mois" valeur={budget} onChoisir={setBudget} options={["1000", "1100", "1200", "1300"].map((x) => ({ valeur: x, libelle: montantFr(Number(x)) }))} /> : null}

        <p className={v.avantApres}><span>{avant}</span><span aria-hidden> → </span><span className={s.encre}>{apres}</span></p>

        {inchange ? <p className={s.nuance}>C&apos;est la valeur de votre Projet actuel.</p> : (
          <div className={s.pile} aria-live="polite">
            {parCertitude.length ? parCertitude.map(({ c, effets }) => (
              <div key={c} className={v.effets}>
                <p className={v.groupeTitre}>{CERTITUDE[c]}</p>
                <ul className={v.listeSimple}>{effets.map((e, i) => <li key={i} className={s.dense}>{lier(e.phrase)}</li>)}</ul>
              </div>
            )) : <p className={s.corps}>Aucune conclusion de vos logements ne semble touchée par ce changement.</p>}
            {levier === "calme" && calme === "sans_compromis" ? <p className={s.nuance}>Rendre le calme sans compromis peut transformer un compromis en condition non tenue ; seule une analyse mise à jour le dirait, logement par logement.</p> : null}

            {!confirmer ? (
              <div className={v.gestes}>
                <button type="button" className={s.bouton} onClick={() => setConfirmer(true)}>Adopter ce changement</button>
                <button type="button" className={s.action} onClick={fermer}>Laisser mon Projet tel qu&apos;il est</button>
              </div>
            ) : (
              <div className={v.confirmer} role="group" aria-label="Confirmer le changement">
                <p className={s.dense}>Votre Projet passera à la révision {p.revision + 1}. Les analyses déjà faites restent lisibles telles quelles ; pour {levier === "budget" ? "le budget, rien ne change dans les conclusions" : `cette condition, elles seront dites « faites sous votre Projet du ${dateCourte(p.date)} » jusqu'à leur mise à jour`}. Aucune analyse n&apos;est relancée automatiquement.</p>
                <div className={v.gestes}>
                  <button type="button" className={`${s.bouton} ${s.boutonMarque}`} onClick={() => { envoyer({ type: "adopter", modification: modif }); fermer(); }}>Confirmer</button>
                  <button type="button" className={s.action} onClick={() => setConfirmer(false)}>Revenir</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
